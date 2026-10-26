import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ClientBase } from 'pg';
import { PostgresService } from '../database/postgres.service';

const CACHE_TTL_MS = 60 * 1000;

/**
 * Watermark deciding where a chart's historic line data lives: chart ids below
 * `migratedBelow` exclusively in `line_chart_data_daily`, the rest exclusively
 * in `historic_line_chart_data`.
 *
 * Readers get it cached for a minute. A stale value reads the old table, which
 * can lack a day the archiver wrote right after the migration — up to 60s of
 * zeros for that day, then self-healing. Writers take `lockMigratedBelow`.
 */
@Injectable()
export class LineChartMigrationStateService implements OnApplicationBootstrap {
  private readonly logger = new Logger(LineChartMigrationStateService.name);

  private cachedAt = 0;
  private cached: number | null = null;
  private inFlight: Promise<number> | null = null;

  constructor(private postgresService: PostgresService) {}

  /**
   * Rows above the watermark mean migrated charts are served from the old
   * table — a watermark lowered by hand or lost in a restore.
   */
  async onApplicationBootstrap() {
    const migratedBelow = await this.getMigratedBelow();
    const response = await this.postgresService
      .getPool()
      .query<{ exists: boolean }>(
        `
SELECT EXISTS (
  SELECT 1 FROM line_chart_data_daily WHERE chart_id >= $1
) AS exists;
        `,
        [migratedBelow],
      );
    if (response.rows[0].exists) {
      this.logger.warn(
        `line_chart_data_daily has rows for chart ids at or above ` +
          `migrated_below (${migratedBelow}). Those charts are read from and ` +
          `archived to the old table, which lacks the days archived while ` +
          `they were migrated. Was the watermark lowered by hand or lost in a ` +
          `restore?`,
      );
    }
  }

  async getMigratedBelow(): Promise<number> {
    if (this.cached !== null && Date.now() - this.cachedAt < CACHE_TTL_MS) {
      return this.cached;
    }

    // Collapse concurrent refreshes into one query.
    if (this.inFlight === null) {
      this.inFlight = this.read().finally(() => {
        this.inFlight = null;
      });
    }

    return this.inFlight;
  }

  /** Whether the chart's historic data lives in `line_chart_data_daily`. */
  async isMigrated(chartId: number): Promise<boolean> {
    return chartId < (await this.getMigratedBelow());
  }

  /**
   * Reads the watermark uncached and pins it (FOR SHARE) until the client's
   * transaction ends, so a backfill batch (FOR UPDATE) cannot move it while a
   * writer picks the table.
   */
  async lockMigratedBelow(client: ClientBase): Promise<number> {
    const response = await client.query<{ migrated_below: number }>(
      'SELECT migrated_below FROM line_chart_migration_state FOR SHARE',
    );
    return migratedBelowOf(response.rows);
  }

  private async read(): Promise<number> {
    const response = await this.postgresService
      .getPool()
      .query<{ migrated_below: number }>(
        'SELECT migrated_below FROM line_chart_migration_state',
      );

    const migratedBelow = migratedBelowOf(response.rows);

    this.cached = migratedBelow;
    this.cachedAt = Date.now();

    return migratedBelow;
  }
}

/**
 * The migration seeds the row, so a missing row means lost state. Guessing 0
 * would silently serve every migrated chart from the old table.
 */
function migratedBelowOf(rows: { migrated_below: number }[]): number {
  if (rows.length === 0) {
    throw new Error(
      'line_chart_migration_state is empty — refusing to guess where the ' +
        'historic line chart data lives',
    );
  }
  return rows[0].migrated_below;
}
