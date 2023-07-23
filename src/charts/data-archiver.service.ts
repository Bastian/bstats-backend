import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConnectionService } from '../database/connection.service';
import { ServicesService } from '../services/services.service';
import { HistoricLineChartDataService } from './historic-line-chart-data.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DataArchiverService {
  private readonly logger = new Logger(DataArchiverService.name);

  private readonly BATCH_COUNT = 15;

  private counter = 0;

  constructor(
    private connectionService: ConnectionService,
    private servicesService: ServicesService,
    private historicLineChartDataService: HistoricLineChartDataService,
    private configService: ConfigService,
  ) {}

  /*
   * To have a more even load on the server, we use the following strategy to move historic data to the postgres database:
   * 1. Every shard (= a running instance of the application) is only responsible for a subset of all applications
   * 2. This subset is processed in batches.
   */
  @Cron('1-15 4 * * *') // Sync once per day in batches of 15 (one batch per minute)
  async storeHistoricChartData() {
    const shardNumber = this.configService.get<number>('SHARD_NUMBER', 0);
    const totalShards = this.configService.get<number>('TOTAL_SHARDS', 1);

    this.counter = (this.counter + 1) % this.BATCH_COUNT;

    const allServiceIds = await this.servicesService.findAllServiceIds();

    const serviceIdBatch = allServiceIds.filter(
      (serviceId) =>
        serviceId % (totalShards * this.BATCH_COUNT) ===
        shardNumber * this.BATCH_COUNT + this.counter,
    );

    for (const serviceId of serviceIdBatch) {
      this.logger.debug('Processing service id ' + serviceId);

      const service = await this.servicesService.findOne(serviceId, true);
      if (service === null) {
        this.logger.warn('Failed to find service with id ' + serviceId);
        continue;
      }

      for (const chart of service.charts ?? []) {
        if (chart.type === 'single_linechart') {
          const lockResponse = await this.connectionService
            .getRedis()
            .set(
              `lock:single_line_chart_sync:${chart.id}:1`,
              '-',
              'EX',
              (60 * 29).toString(),
              'NX',
            );

          // This should not happen
          if (lockResponse === null) {
            this.logger.warn(
              'Failed to quire lock for service with id ' +
                serviceId +
                '. Did you forget to set the SHARD_NUMBER and TOTAL_SHARDS environment variables?',
            );
            continue;
          }
          this.logger.debug(
            `Moving historic line chart data for chart with id ${chart.id} and line '1'`,
          );
          await this.historicLineChartDataService.moveHistoricRedisDataToPostgres(
            chart.id,
            '1',
          );
        }
      }
    }
  }
}
