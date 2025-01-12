import { Injectable } from '@nestjs/common';
import { DateUtilService } from './date-util.service';
import { RedisChartsService } from './redis-charts/redis-charts.service';
import { SingleLineChartData } from './interfaces/data/single-line-chart-data.interface';
import { ConnectionService } from '../database/connection.service';
import { PostgresService } from 'src/database/postgres.service';
import * as admin from 'firebase-admin';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HistoricLineChartDataService {
  constructor(
    private dateUtilService: DateUtilService,
    private redisChartsService: RedisChartsService,
    private connectionService: ConnectionService,
    private postgresService: PostgresService,
    private configService: ConfigService,
  ) {
    const shardNumber = this.configService.get<number>('SHARD_NUMBER', 0);
    postgresService
      .getPool()
      .connect()
      .then((client) => {
        client
          .query(
            `
CREATE TABLE IF NOT EXISTS historic_line_chart_data (
  chartId integer NOT NULL,
  tms2000 integer NOT NULL,
  lineName varchar(255) NOT NULL,
  value real NULL,
  UNIQUE (chartId, tms2000, lineName)
);
      `,
          )
          .then(() => {
            client.release();
            if (shardNumber === 0) {
              this.migrateData();
            }
          });
      });
  }

  async setLineChartData(
    id: number,
    tms2000: number,
    line: string,
    value: number | null,
  ) {
    const pool = this.postgresService.getPool();
    await pool.query(
      `
  INSERT INTO historic_line_chart_data (chartId, tms2000, lineName, value)
  VALUES ($1, $2, $3, $4)
  ON CONFLICT (chartId, tms2000, lineName)
  DO UPDATE SET value = $4;
      `,
      [id, tms2000, line, value],
    );
  }

  async batchSetLineChartData(
    id: number,
    line: string,
    data: [number, number | null][],
  ) {
    let query = `
INSERT INTO historic_line_chart_data (chartId, tms2000, lineName, value)
VALUES
`;
    for (let i = 0; i < data.length; i++) {
      const [tms2000] = data[i];
      query += `(${id}, ${tms2000}, $${i * 2 + 1}, $${i * 2 + 2}),`;
    }
    query = query.slice(0, -1);
    query += `
ON CONFLICT (chartId, tms2000, lineName)
DO UPDATE SET value = EXCLUDED.value;
    `;
    const pool = this.postgresService.getPool();
    await pool.query(
      query,
      data.flatMap(([, value]) => [line, value]),
    );
  }

  /**
   * Migrates the data from Firestore to Postgres.
   *
   * Can be removed after migration is done.
   */
  private async migrateData() {
    // We process data in batches, or it would be too much data to handle at once.
    // At the time of writing this comment (2025-01-08), the highest chartId is
    // 298582. So 3100 * 100 = 310000 is more than enough for the next weeks.
    for (let i = 0; i < 3100; i++) {
      const data = await admin
        .firestore()
        .collection('line-chart-data')
        .where('chartId', '>=', i * 100)
        .where('chartId', '<', (i + 1) * 100)
        .get();

      // Process docs in batches of 90
      // Why 90? I have no clue, this second sentence was added years after the
      // one above. But I'm sure there was a good reason for it.
      for (let j = 0; j < data.docs.length; j += 90) {
        await Promise.all(
          data.docs.slice(j, j + 90).map(async (doc) => {
            const chartId = doc.data().chartId;
            const lineName = doc.data().lineName;
            const data = doc.data().data;
            const tms2000Div1000 = doc.data().tms2000Div1000;

            console.log(
              'Batch',
              i,
              '|',
              'Migrating data',
              chartId,
              lineName,
              tms2000Div1000,
              Object.keys(data).length,
            );

            await this.batchSetLineChartData(
              chartId,
              lineName,
              Object.entries(data).map(([timestamp, value]) => [
                this.dateUtilService.dateToTms2000(
                  new Date(parseInt(timestamp)),
                ),
                value === 'ignored' ? null : parseInt(value as string),
              ]),
            );
          }),
        );
      }
    }

    console.log('Migrated data');
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
    let data: SingleLineChartData = [];

    console.log('Fetching line chart data', id, line, maxElements, tms2000Last);

    // Check if in Redis cache
    const redisLineData = await this.connectionService
      .getRedis()
      .get(`history-data:${id}:${line}:${tms2000Last}`);

    if (redisLineData) {
      ///return JSON.parse(redisLineData);
    }

    const pool = this.postgresService.getPool();
    const response = await pool.query(
      `
SELECT tms2000, value FROM historic_line_chart_data
WHERE chartId = $1 AND lineName = $2 AND tms2000 <= $3
ORDER BY tms2000 DESC
LIMIT $4;
      `,
      [id, line, tms2000Last, maxElements],
    );

    const elements: Record<number, number> = {};

    // Fill with 0s
    for (let i = 0; i < maxElements; i++) {
      const timestamp = this.dateUtilService.tms2000ToTimestamp(
        tms2000Last - i,
      );

      elements[timestamp] = 0;
    }

    for (const row of response.rows) {
      elements[this.dateUtilService.tms2000ToTimestamp(row.tms2000)] =
        row.value ?? 0;
    }

    // Convert to array
    for (const [timestamp, value] of Object.entries(elements)) {
      data.push([parseInt(timestamp), value]);
    }

    // Remove rows with null value
    data = data.filter(([, value]) => value !== null);

    // Sort by timestamp
    data.sort((a, b) => b[0] - a[0]);

    // Cache in redis for 30 minute
    await this.connectionService
      .getRedis()
      .set(
        `history-line-data:${id}:${line}:${tms2000Last}`,
        JSON.stringify(data),
        'EX',
        30 * 60,
      );

    return data;
  }

  async moveHistoricRedisDataToPostgres(id: number, line: string) {
    const allDataInRedis = await this.redisChartsService.getFullLineChartData(
      id,
      line,
    );

    if (allDataInRedis === null) {
      return;
    }

    const currentTms2000 = this.dateUtilService.dateToTms2000(new Date());

    const currentTimestamp = this.dateUtilService
      .tms2000ToDate(currentTms2000)
      .getTime();

    // Saves the last sync tms2000
    const markLastSync = async () => {
      await this.connectionService
        .getRedis()
        .set(`last-sync:${id}.${line}`, currentTms2000 - 1);
    };

    const filteredData = allDataInRedis.filter(
      ([timestamp]) => timestamp !== currentTimestamp,
    );

    if (filteredData.length <= 0) {
      await markLastSync();
      return;
    }

    for (const [timestamp, value] of filteredData) {
      await this.setLineChartData(
        id,
        this.dateUtilService.dateToTms2000(new Date(timestamp)),
        line,
        value === 'ignored' ? null : value,
      );
    }

    await markLastSync();
    await this.redisChartsService.deleteLineChartData(
      id,
      line,
      filteredData.map(([timestamp]) => timestamp),
    );
  }
}
