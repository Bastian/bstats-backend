import { Injectable, NotFoundException } from '@nestjs/common';
import { ConnectionService } from '../../database/connection.service';
import { RedisChart } from './interfaces/redis-chart.interface';
import { DateUtilService } from '../date-util.service';

@Injectable()
export class RedisChartsService {
  constructor(
    private connectionService: ConnectionService,
    private dateUtilService: DateUtilService,
  ) {}

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

  async updatePieData(
    id: number,
    tms2000: number,
    valueName: string,
    value: number,
  ) {
    await this.connectionService
      .getRedis()
      .zincrby(`data:${id}.${tms2000}`, value, valueName);
    await this.connectionService
      .getRedis()
      .expire(`data:${id}.${tms2000}`, 60 * 61);
  }

  async updateMapData(
    id: number,
    tms2000: number,
    valueName: string,
    value: number,
  ) {
    // The charts are saved the same way
    await this.updatePieData(id, tms2000, valueName, value);
  }

  async updateLineChartData(
    id: number,
    tms2000: number,
    line: string,
    value: number,
  ) {
    await this.connectionService
      .getRedis()
      .hincrby(
        `data:${id}.${line}`,
        this.dateUtilService.tms2000ToDate(tms2000).getTime().toString(),
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
    let totalValue = 0;
    for (const valueKey of Object.keys(values)) {
      totalValue += values[valueKey];
      await this.connectionService
        .getRedis()
        .zincrby(
          `data:${id}.${tms2000}.${valueName}`,
          values[valueKey],
          valueKey,
        );
      await this.connectionService
        .getRedis()
        .expire(`data:${id}.${tms2000}.${valueName}`, 60 * 61);
    }
    await this.connectionService
      .getRedis()
      .zincrby(`data:${id}.${tms2000}`, totalValue, valueName);
    await this.connectionService
      .getRedis()
      .expire(`data:${id}.${tms2000}`, 60 * 61);
  }
}
