import { Injectable } from '@nestjs/common';
import { Chart } from './interfaces/charts/chart.interface';
import { RedisChartsService } from './redis-charts/redis-charts.service';
import { ChartData } from './interfaces/data/chart-data.interface';

@Injectable()
export class ChartsService {
  constructor(private redisChartsService: RedisChartsService) {}

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
    };
  }

  async findData(id: number, maxElements: number): Promise<ChartData | null> {
    const chart = await this.findOne(id);
    if (chart === null) {
      return null;
    }

    switch (chart.type) {
      case 'simple_pie':
      case 'advanced_pie':
        return this.redisChartsService.getPieData(id);
      case 'drilldown_pie':
        return this.redisChartsService.getDrilldownPieData(id);
      case 'single_linechart':
        return this.redisChartsService.getLineChartData(id, '1', maxElements);
      case 'simple_map':
      case 'advanced_map':
        return this.redisChartsService.getMapData(id);
    }

    return null;
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

  async updatePieData(
    id: number,
    tms2000: number,
    valueName: string,
    value: number,
  ) {
    return this.redisChartsService.updatePieData(id, tms2000, valueName, value);
  }

  async updateMapData(
    id: number,
    tms2000: number,
    valueName: string,
    value: number,
  ) {
    return this.redisChartsService.updateMapData(id, tms2000, valueName, value);
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

  async updateDrilldownPieData(
    id: number,
    tms2000: number,
    valueName: string,
    values: {
      [key: string]: number;
    },
  ) {
    return this.redisChartsService.updateDrilldownPieData(
      id,
      tms2000,
      valueName,
      values,
    );
  }
}
