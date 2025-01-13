import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

@Injectable()
export class PostgresService {
  private readonly pool: Pool;

  constructor(private configService: ConfigService) {
    this.pool = new Pool({
      user: configService.get<string>('POSTGRES_USER'),
      password: configService.get<string>('POSTGRES_PASSWORD'),
      database: configService.get<string>('POSTGRES_DB'),
      max: 95,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  getPool(): Pool {
    return this.pool;
  }
}
