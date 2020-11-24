import { Injectable } from '@nestjs/common';
import { Chart } from './interfaces/chart.interface';
import { RedisChartsService } from './redis-charts/redis-charts.service';

@Injectable()
export class ChartsService {
  constructor(private redisChartsService: RedisChartsService) {}

  async findOne(id: number): Promise<Chart> {
    const redisChart = await this.redisChartsService.findChartById(id);

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

  async findByServiceIdAndCustomId(
    serviceId: number,
    customId: string,
  ): Promise<Chart> {
    return this.findOne(
      await this.redisChartsService.findChartIdByServiceIdAndCustomId(
        serviceId,
        customId,
      ),
    );
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
