import { Injectable, Logger } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { join } from 'path';
import { PostgresService } from './postgres.service';

const ADVISORY_LOCK_ID = 92110325;

@Injectable()
export class MigrationService {
  private readonly logger = new Logger(MigrationService.name);

  constructor(private postgresService: PostgresService) {}

  async migrate(): Promise<void> {
    const client = await this.postgresService.getPool().connect();
    let destroyConnection = false;

    try {
      this.logger.log('Waiting for database migration lock');
      await client.query('SELECT pg_advisory_lock($1)', [ADVISORY_LOCK_ID]);
      try {
        await migrate(drizzle(client), {
          migrationsFolder: join(__dirname, 'drizzle'),
        });
        this.logger.log('Database migrations completed');
      } finally {
        try {
          await client.query('SELECT pg_advisory_unlock($1)', [
            ADVISORY_LOCK_ID,
          ]);
        } catch (error) {
          // A failed unlock must not return a connection that may still hold the
          // session-level lock to the pool. Do not rethrow: that would mask a
          // migration error, while destroying the session releases the lock.
          destroyConnection = true;
          this.logger.warn(`Failed to release the migration lock: ${error}`);
        }
      }
    } finally {
      client.release(destroyConnection);
    }
  }
}
