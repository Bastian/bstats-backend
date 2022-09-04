import { Injectable } from '@nestjs/common';
import { Chart } from './interfaces/charts/chart.interface';
import { RedisChartsService } from './redis-charts/redis-charts.service';
import { ChartData } from './interfaces/data/chart-data.interface';
import { HistoricLineChartDataService } from './historic-line-chart-data.service';
import { DateUtilService } from './date-util.service';
import { SingleLineChartData } from './interfaces/data/single-line-chart-data.interface';
import { ConnectionService } from '../database/connection.service';
import { Pipeline } from 'ioredis';

@Injectable()
export class ChartsService {
  constructor(
    private redisChartsService: RedisChartsService,
    private historicLineChartDataService: HistoricLineChartDataService,
    private dateUtilService: DateUtilService,
    private connectionService: ConnectionService,
  ) {}

  async findOne(id: number): Promise<Chart | null> {
    const redisChart = await this.redisChartsService.findChartById(id);

    if (redisChart == null) {
      return null;
    }

    return {
      id,
      idCustom: redisChart.idCustom,
      type: redisChart.type,
      position: redisChart.position,
      title: redisChart.title,
      isDefault: redisChart.default,
      data: redisChart.data,
      serviceId: redisChart.serviceId,
    };
  }

  async findData(id: number, maxElements: number): Promise<ChartData | null> {
    const chart = await this.findOne(id);
    if (chart === null) {
      return null;
    }

    maxElements = Math.min(maxElements, 2 * 24 * 365 * 5);

    switch (chart.type) {
      case 'simple_pie':
      case 'advanced_pie':
        return this.redisChartsService.getPieData(chart.serviceId, id);
      case 'drilldown_pie':
        return this.redisChartsService.getDrilldownPieData(chart.serviceId, id);
      case 'single_linechart':
        return this.findLineChartData(id, '1', maxElements);
      case 'simple_map':
      case 'advanced_map':
        return this.redisChartsService.getMapData(chart.serviceId, id);
      case 'simple_bar':
      case 'advanced_bar':
        return this.redisChartsService.getBarChartData(chart.serviceId, id);
    }

    return null;
  }

  /**
   * Merges the data from redis and Firestore
   */
  private async findLineChartData(
    id: number,
    line: string,
    maxElements: number,
  ): Promise<SingleLineChartData | null> {
    const startTms2000 = this.dateUtilService.dateToTms2000(new Date()) - 1;

    const lastSyncTms2000 = await this.connectionService
      .getRedis()
      .get(`last-sync:${id}.${line}`);

    if (
      lastSyncTms2000 === null ||
      maxElements <= startTms2000 - parseInt(lastSyncTms2000)
    ) {
      // There was no sync or the sync was so long ago that all data should be stored in Redis
      return this.redisChartsService.getLineChartData(id, line, maxElements);
    }

    // The most recent data from Redis
    const dataFromRedis = await this.redisChartsService.getLineChartData(
      id,
      line,
      startTms2000 - parseInt(lastSyncTms2000),
    );

    // And the historic data from firestore
    const dataFromFirestore = await this.historicLineChartDataService.getLineChartData(
      id,
      line,
      maxElements - (startTms2000 - parseInt(lastSyncTms2000)),
      parseInt(lastSyncTms2000),
    );

    return [...(dataFromRedis ?? []), ...dataFromFirestore];
  }

  async findByServiceIdAndCustomId(
    serviceId: number,
    customId: string,
  ): Promise<Chart | null> {
    const chartId = await this.redisChartsService.findChartIdByServiceIdAndCustomId(
      serviceId,
      customId,
    );
    if (chartId == null) {
      return null;
    }
    return this.findOne(chartId);
  }

  async updateLineChartData(
    id: number,
    tms2000: number,
    line: string,
    value: number,
  ) {
    return this.redisChartsService.updateLineChartData(
      id,
      tms2000,
      line,
      value,
    );
  }

  getPipelinedChartUpdater(serviceId: number): PipelinedChartUpdater {
    return new PipelinedChartUpdater(
      this.redisChartsService,
      this.connectionService,
      serviceId,
    );
  }
}

/**
 * Redis has a feature called "pipeline" which can significantly increase performance.
 *
 * This class allows you to easily update data by adding it to the pipeline and then execute the
 * action by calling PipelinedChartUpdater#exec().
 */
export class PipelinedChartUpdater {
  private readonly pipeline: Pipeline;

  constructor(
    private redisChartsService: RedisChartsService,
    private connectionService: ConnectionService,
    private serviceId: number,
  ) {
    this.pipeline = connectionService.getRedis().pipeline() as Pipeline;
  }

  updatePieData(id: number, tms2000: number, valueName: string, value: number) {
    this.redisChartsService.updatePieData(
      this.serviceId,
      id,
      tms2000,
      valueName,
      value,
      this.pipeline,
    );
  }

  updateMapData(id: number, tms2000: number, valueName: string, value: number) {
    this.redisChartsService.updateMapData(
      this.serviceId,
      id,
      tms2000,
      valueName,
      value,
      this.pipeline,
    );
  }

  updateDrilldownPieData(
    id: number,
    tms2000: number,
    valueName: string,
    values: {
      [key: string]: number;
    },
  ) {
    this.redisChartsService.updateDrilldownPieData(
      this.serviceId,
      id,
      tms2000,
      valueName,
      values,
      this.pipeline,
    );
  }

  updateBarChartData(
    id: number,
    tms2000: number,
    values: { category: string; barValues: number[] }[],
  ) {
    this.redisChartsService.updateBarChartData(
      this.serviceId,
      id,
      tms2000,
      values,
      this.pipeline,
    );
  }

  /**
   * Executes the pipeline. Must not be called more than once.
   */
  async exec() {
    await this.pipeline.exec();
  }
}
