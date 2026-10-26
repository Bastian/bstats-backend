import { Injectable, Logger } from '@nestjs/common';
import { ClientBase } from 'pg';
import { DateUtilService } from './date-util.service';
import { RedisChartsService } from './redis-charts/redis-charts.service';
import { SingleLineChartData } from './interfaces/data/single-line-chart-data.interface';
import { ConnectionService } from '../database/connection.service';
import { PostgresService } from '../database/postgres.service';
import { LineChartMigrationStateService } from './line-chart-migration-state.service';
import {
  SLOTS_PER_DAY,
  Slots,
  dayAndSlotToTms2000,
  dayToLastTms2000,
  groupIntoDays,
  tms2000ToDay,
} from './line-chart-days';

@Injectable()
export class HistoricLineChartDataService {
  private readonly logger = new Logger(HistoricLineChartDataService.name);

  constructor(
    private dateUtilService: DateUtilService,
    private redisChartsService: RedisChartsService,
    private connectionService: ConnectionService,
    private postgresService: PostgresService,
    private migrationStateService: LineChartMigrationStateService,
  ) {}

  /** Old per-bucket format, used until the backfill reaches the chart. */
  private async setLineChartData(
    client: ClientBase,
    id: number,
    tms2000: number,
    line: string,
    value: number | null,
  ) {
    await client.query(
      `
  INSERT INTO historic_line_chart_data (chartId, tms2000, lineName, value)
  VALUES ($1, $2, $3, $4)
  ON CONFLICT (chartId, tms2000, lineName)
  DO UPDATE SET value = $4;
      `,
      [id, tms2000, line, value],
    );
  }

  /** Writes one day as a single row; null slots keep what is already there. */
  private async setLineChartDay(
    client: ClientBase,
    id: number,
    line: string,
    day: number,
    slots: Slots,
  ) {
    await client.query(
      `
INSERT INTO line_chart_data_daily (chart_id, line_name, day, slots)
VALUES ($1, $2, $3, $4::real[])
ON CONFLICT (chart_id, line_name, day) DO UPDATE SET slots = (
  SELECT array_agg(COALESCE(n, o) ORDER BY i)
  FROM unnest(EXCLUDED.slots, line_chart_data_daily.slots)
       WITH ORDINALITY AS t(n, o, i)
);
      `,
      [id, line, day, slots],
    );
  }

  /**
   * Fetches the line chart data from the database.
   */
  async getLineChartData(
    id: number,
    line: string,
    maxElements: number,
    tms2000Last: number = this.dateUtilService.dateToTms2000(new Date()) - 1,
  ): Promise<SingleLineChartData> {
    const data: SingleLineChartData = [];
    const tms2000Min = Math.max(0, tms2000Last - maxElements + 1);

    const elements: Record<number, number | null> = {};

    // Fill with 0s
    const elementsToFill = Math.min(maxElements, tms2000Last + 1);
    for (let i = 0; i < elementsToFill; i++) {
      const timestamp = this.dateUtilService.tms2000ToTimestamp(
        tms2000Last - i,
      );

      elements[timestamp] = 0;
    }

    if (await this.migrationStateService.isMigrated(id)) {
      await this.readDaily(elements, id, line, tms2000Min, tms2000Last);
    } else {
      await this.readBuckets(
        elements,
        id,
        line,
        tms2000Min,
        tms2000Last,
        maxElements,
      );
    }

    // Convert to array, skipping null values
    for (const [timestamp, value] of Object.entries(elements)) {
      if (value !== null) {
        data.push([parseInt(timestamp), value]);
      }
    }

    // Sort by timestamp
    data.sort((a, b) => b[0] - a[0]);

    return data;
  }

  /** Reads from the day-array format, one row per day. */
  private async readDaily(
    elements: Record<number, number | null>,
    id: number,
    line: string,
    tms2000Min: number,
    tms2000Last: number,
  ) {
    const response = await this.postgresService.getPool().query<{
      day: number;
      slots: Slots;
    }>(
      `
SELECT day, slots FROM line_chart_data_daily
WHERE chart_id = $1 AND line_name = $2 AND day >= $3 AND day <= $4
ORDER BY day DESC;
      `,
      [id, line, tms2000ToDay(tms2000Min), tms2000ToDay(tms2000Last)],
    );

    // Spread out in JS — unnest() would put the saved rows back on the wire.
    for (const { day, slots } of response.rows) {
      for (let slot = 0; slot < SLOTS_PER_DAY; slot++) {
        const value = slots[slot];

        // Nothing recorded, keep the prefilled 0
        if (value === null || value === undefined) {
          continue;
        }

        const tms2000 = dayAndSlotToTms2000(day, slot);
        if (tms2000 < tms2000Min || tms2000 > tms2000Last) {
          continue;
        }

        // NaN = 'ignored' marker: null drops the point, a gap instead of a 0
        elements[this.dateUtilService.tms2000ToTimestamp(tms2000)] =
          Number.isNaN(value) ? null : value;
      }
    }
  }

  /** Reads from the old per-bucket format, one row per bucket. */
  private async readBuckets(
    elements: Record<number, number | null>,
    id: number,
    line: string,
    tms2000Min: number,
    tms2000Last: number,
    maxElements: number,
  ) {
    const response = await this.postgresService.getPool().query(
      `
SELECT tms2000, value FROM historic_line_chart_data
WHERE chartId = $1 AND lineName = $2 AND tms2000 >= $3 AND tms2000 <= $4
ORDER BY tms2000 DESC
LIMIT $5;
      `,
      [id, line, tms2000Min, tms2000Last, maxElements],
    );

    for (const row of response.rows) {
      elements[this.dateUtilService.tms2000ToTimestamp(row.tms2000)] =
        row.value ?? null;
    }
  }

  /**
   * Moves every complete day out of Redis into Postgres.
   */
  async moveHistoricRedisDataToPostgres(id: number, line: string) {
    const allDataInRedis = await this.redisChartsService.getFullLineChartData(
      id,
      line,
    );

    if (allDataInRedis === null) {
      return;
    }

    const currentDay = tms2000ToDay(
      this.dateUtilService.dateToTms2000(new Date()),
    );
    const lastCompleteDay = currentDay - 1;

    // 'ignored' is set manually to mark broken buckets (usually a bStats
    // downtime)
    const buckets: {
      tms2000: number;
      value: number | 'ignored';
      timestamp: number;
    }[] = [];
    const broken: number[] = [];
    for (const [timestamp, value] of allDataInRedis) {
      const tms2000 = this.dateUtilService.dateToTms2000(new Date(timestamp));

      // Pre-epoch buckets are broken data points; dropped for good
      if (tms2000 < 0) {
        broken.push(timestamp);
        continue;
      }

      // The day is not over yet, a later run picks it up
      if (tms2000ToDay(tms2000) > lastCompleteDay) {
        continue;
      }

      buckets.push({ tms2000, value, timestamp });
    }

    if (broken.length > 0) {
      this.logger.warn(
        `Dropping ${broken.length} bucket(s) before the tms2000 epoch of ` +
          `chart ${id}, line '${line}'`,
      );
    }

    if (buckets.length > 0) {
      await this.writeBuckets(id, line, buckets);
    }

    // last-sync is the last tms2000 that is fully archived.
    const lastSyncKey = `last-sync:${id}.${line}`;
    const lastSync = dayToLastTms2000(lastCompleteDay);
    const previousLastSync = await this.connectionService
      .getRedis()
      .get(lastSyncKey);
    if (previousLastSync === null || parseInt(previousLastSync) < lastSync) {
      await this.connectionService.getRedis().set(lastSyncKey, lastSync);
    }

    // Deleted only after last-sync moved
    if (buckets.length > 0 || broken.length > 0) {
      await this.redisChartsService.deleteLineChartData(id, line, [
        ...buckets.map(({ timestamp }) => timestamp),
        ...broken,
      ]);
    }
  }

  /**
   * Writes in the format the watermark prescribes, holding the watermark (see
   * `lockMigratedBelow`) so a backfill batch cannot move it past the chart
   * between format decision and write.
   */
  private async writeBuckets(
    id: number,
    line: string,
    buckets: { tms2000: number; value: number | 'ignored' }[],
  ) {
    const client = await this.postgresService.getPool().connect();
    let destroyConnection = false;
    try {
      await client.query('BEGIN');

      if (id < (await this.migrationStateService.lockMigratedBelow(client))) {
        // 'ignored' becomes NaN; a null slot already means "nothing recorded"
        for (const { day, slots } of groupIntoDays(
          buckets.map(({ tms2000, value }): [number, number] => [
            tms2000,
            value === 'ignored' ? NaN : value,
          ]),
        )) {
          await this.setLineChartDay(client, id, line, day, slots);
        }
      } else {
        // One row per bucket, 'ignored' is a NULL value
        for (const { tms2000, value } of buckets) {
          await this.setLineChartData(
            client,
            id,
            tms2000,
            line,
            value === 'ignored' ? null : value,
          );
        }
      }

      await client.query('COMMIT');
    } catch (error) {
      // A failed rollback may leave the connection mid-transaction; don't pool it
      await client.query('ROLLBACK').catch(() => {
        destroyConnection = true;
      });
      throw error;
    } finally {
      client.release(destroyConnection);
    }
  }
}
