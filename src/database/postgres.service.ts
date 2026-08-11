import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

@Injectable()
export class PostgresService {
  private readonly pool: Pool;
  private readonly db: NodePgDatabase<typeof schema>;

  constructor(private configService: ConfigService) {
    this.pool = new Pool({
      user: configService.get<string>('POSTGRES_USER'),
      password: configService.get<string>('POSTGRES_PASSWORD'),
      database: configService.get<string>('POSTGRES_DB'),
      max: 95,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    this.db = drizzle(this.pool, { schema });
  }

  getPool(): Pool {
    return this.pool;
  }

  getDb(): NodePgDatabase<typeof schema> {
    return this.db;
  }
}
