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
}
