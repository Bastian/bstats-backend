import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { DateUtilService } from './date-util.service';
import { RedisChartsService } from './redis-charts/redis-charts.service';
import { SingleLineChartData } from './interfaces/data/single-line-chart-data.interface';
import { ConnectionService } from '../database/connection.service';
import { FirestoreRatelimiterService } from '../database/firestore-ratelimiter.service';

@Injectable()
export class HistoricLineChartDataService {
  constructor(
    private dateUtilService: DateUtilService,
    private redisChartsService: RedisChartsService,
    private connectionService: ConnectionService,
    private firestoreRatelimiterService: FirestoreRatelimiterService,
  ) {}

  private getFirestoreDocument(
    id: number,
    tms2000Div1000: number,
    line: string,
  ) {
    return admin
      .firestore()
      .collection('line-chart-data')
      .doc(`${id}#${tms2000Div1000}#${line}`);
  }

  async setLineChartData(
    id: number,
    tms2000: number,
    line: string,
    value: number | null,
  ) {
    const timestamp = this.dateUtilService.tms2000ToDate(tms2000).getTime();
    const tms2000Div1000 = this.dateUtilService.dateToTms2000Div1000(
      new Date(timestamp),
    );

    await this.firestoreRatelimiterService.checkRatelimitAndIncr('write');
    await this.getFirestoreDocument(id, tms2000Div1000, line).set(
      {
        chartId: id,
        lineName: line,
        tms2000Div1000: tms2000Div1000,
        data: {
          [timestamp]: value,
        },
      },
      {
        merge: true,
      },
    );
  }

  async bulkSetLineChartData(
    id: number,
    line: string,
    data: [number, number | 'ignored'][],
  ) {
    const dataGroupedByTms2000Div1000 = data.reduce(
      (prev, [timestamp, dataPoint]) => {
        const tms2000Div1000 = this.dateUtilService.dateToTms2000Div1000(
          new Date(timestamp),
        );
        if (!prev[tms2000Div1000]) {
          prev[tms2000Div1000] = {};
        }
        prev[tms2000Div1000][timestamp] =
          dataPoint === 'ignored' ? null : dataPoint;
        return prev;
      },
      {},
    );

    for (const tms2000Div1000 of Object.keys(dataGroupedByTms2000Div1000)) {
      await this.firestoreRatelimiterService.checkRatelimitAndIncr('write');
      await this.getFirestoreDocument(id, parseInt(tms2000Div1000), line).set(
        {
          chartId: id,
          lineName: line,
          tms2000Div1000: parseInt(tms2000Div1000),
          data: dataGroupedByTms2000Div1000[tms2000Div1000],
        },
        {
          merge: true,
        },
      );
      // Clear the cache (if it exists)
      await this.connectionService
        .getRedis()
        .del(`history-data:${id}:${line}:${tms2000Div1000}`);
    }
  }

  /**
   * Fetches the line chart data from the database.
   * Automatically accumulates data from multiple documents.
   */
  async getLineChartData(
    id: number,
    line: string,
    maxElements: number,
    tms2000Last: number = this.dateUtilService.dateToTms2000(new Date()) - 1,
  ): Promise<SingleLineChartData> {
    const date = this.dateUtilService.tms2000ToDate(tms2000Last);

    const currentTms2000Div1000 = this.dateUtilService.dateToTms2000Div1000(
      date,
    );

    // The latest document does most likely not contain the full 1000 data points
    const elementsInFirstDocument = this.dateUtilService.thirtyMinutesSinceLastTms2000Div1000(
      date,
    );

    // Every document only contains 1000 data points at max
    const tms2000Div1000sToFetch = [currentTms2000Div1000];
    while (
      maxElements -
        (tms2000Div1000sToFetch.length - 1) * 1000 -
        elementsInFirstDocument >
      0
    ) {
      tms2000Div1000sToFetch.push(
        currentTms2000Div1000 - tms2000Div1000sToFetch.length,
      );
    }

    const data: SingleLineChartData = [];

    for (const tms2000Div1000 of tms2000Div1000sToFetch) {
      // To decrease the number for Firestore reads, we cache historic line
      // chart data in Redis for 1 week when it is requested. So before
      // we read, we first check if the data is in Redis.
      const redisLineData = await this.connectionService
        .getRedis()
        .get(`history-data:${id}:${line}:${tms2000Div1000}`);

      let lineData:
        | {
            [timestamp: number]: number | undefined;
          }
        | undefined;

      if (redisLineData) {
        lineData = JSON.parse(redisLineData);
      } else {
        await this.firestoreRatelimiterService.checkRatelimitAndIncr('read');
        const document = await this.getFirestoreDocument(
          id,
          tms2000Div1000,
          line,
        ).get();

        lineData = document.data()?.data;

        // Cache the historic data in Redis
        await this.connectionService
          .getRedis()
          .set(
            `history-data:${id}:${line}:${tms2000Div1000}`,
            JSON.stringify(lineData ?? {}),
          );
        // for 1 week
        await this.connectionService
          .getRedis()
          .expire(
            `history-data:${id}:${line}:${tms2000Div1000}`,
            60 * 60 * 24 * 7,
          );
      }

      for (let i = 0; i < 1000; i++) {
        const tms2000 = (tms2000Div1000 + 1) * 1000 - (i + 1);
        if (tms2000 <= tms2000Last && tms2000Last - tms2000 < maxElements) {
          const timestamp = this.dateUtilService.tms2000ToTimestamp(tms2000);

          const dataPoint = lineData?.[timestamp];
          if (dataPoint === null) {
            continue;
          }
          data.push([timestamp, dataPoint ?? 0]);
        }
      }
    }

    return data;
  }

  async moveHistoricRedisDataToFirebase(id: number, line: string) {
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

    await this.bulkSetLineChartData(id, line, filteredData);
    await markLastSync();

    await this.redisChartsService.deleteLineChartData(
      id,
      line,
      filteredData.map(([timestamp]) => timestamp),
    );
  }
}
