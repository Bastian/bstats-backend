import { Injectable, NotFoundException } from '@nestjs/common';
import { ConnectionService } from '../../database/connection.service';
import { RedisChart } from './interfaces/redis-chart.interface';

@Injectable()
export class RedisChartsService {
  constructor(private connectionService: ConnectionService) {}

  async findChartById(id: number): Promise<RedisChart> {
    const fields = ['id', 'type', 'position', 'title', 'default', 'data'];
    const response = await this.connectionService
      .getRedis()
      .hmget(`charts:${id}`, fields);

    if (response == null) {
      throw new NotFoundException();
    }

    return {
      idCustom: response[0],
      type: response[1],
      position: parseInt(response[2]),
      title: response[3],
      default: response[4] !== null,
      data: JSON.parse(response[5]),
    };
  }

  async findChartIdByServiceIdAndCustomId(
    serviceId: number,
    customId: string,
  ): Promise<number> {
    const chartId = await this.connectionService
      .getRedis()
      .get(`charts.index.uid.pluginId+chartId:${serviceId}.${customId}`);

    if (chartId == null) {
      throw new NotFoundException();
    }

    return parseInt(chartId);
  }
}
