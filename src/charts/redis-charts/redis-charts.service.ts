import { Injectable } from '@nestjs/common';
import { ConnectionService } from '../../database/connection.service';
import { RedisChart } from './interfaces/redis-chart.interface';
import { DateUtilService } from '../date-util.service';
import { assertIsDefined } from '../../assertions';
import { SimplePieChartData } from '../interfaces/data/simple-pie-chart-data.interface';
import { AdvancedPieChartData } from '../interfaces/data/advanced-pie-chart-data.interface';
import { SimpleMapChartData } from '../interfaces/data/simple-map-chart-data.interface';
import { SingleLineChartData } from '../interfaces/data/single-line-chart-data.interface';
import { DrilldownPieChartData } from '../interfaces/data/drilldown-pie-chart-data.interface';

@Injectable()
export class RedisChartsService {
  constructor(
    private connectionService: ConnectionService,
    private dateUtilService: DateUtilService,
  ) {}

  async findChartById(id: number): Promise<RedisChart | null> {
    const fields = ['id', 'type', 'position', 'title', 'default', 'data'];
    const response = await this.connectionService
      .getRedis()
      .hmget(`charts:${id}`, fields);

    if (response == null || response[0] == null) {
      return null;
    }

    assertIsDefined(response[1]);
    assertIsDefined(response[2]);
    assertIsDefined(response[3]);
    assertIsDefined(response[5]);

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
  ): Promise<number | null> {
    const chartId = await this.connectionService
      .getRedis()
      .get(`charts.index.uid.pluginId+chartId:${serviceId}.${customId}`);

    if (chartId == null) {
      return null;
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

  async getPieData(
    id: number,
    tms2000: number = this.dateUtilService.dateToTms2000(new Date()) - 1,
  ): Promise<(SimplePieChartData & AdvancedPieChartData) | null> {
    const response = await this.connectionService
      .getRedis()
      .zrange(`data:${id}.${tms2000}`, 0, -1, 'WITHSCORES');

    if (response === null) {
      return null;
    }

    // We have to convert the data first, e.g.:
    // ["offline","1","online","3"] -> [{"name":"offline","y":1},{"name":"online","y":3}]
    const data: SimplePieChartData & AdvancedPieChartData = [];
    for (let i = 0; i < response.length; i += 2) {
      data.push({ name: response[i], y: parseInt(response[i + 1]) });
    }

    return data;
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

  async getMapData(
    id: number,
    tms2000: number = this.dateUtilService.dateToTms2000(new Date()) - 1,
  ): Promise<SimpleMapChartData | null> {
    const response = await this.connectionService
      .getRedis()
      .zrange(`data:${id}.${tms2000}`, 0, -1, 'WITHSCORES');

    if (response === null) {
      return null;
    }

    // We have to convert the data first, e.g.:
    // ["DE","1","US","3"] -> [{"code":"DE","value":1},{"code":"US","value":3}]
    const data: SimpleMapChartData = [];
    for (let i = 0; i < response.length; i += 2) {
      data.push({ code: response[i], value: parseInt(response[i + 1]) });
    }

    return data;
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

  async getLineChartData(
    id: number,
    line: string,
    amount: number,
    tms2000Last: number = this.dateUtilService.dateToTms2000(new Date()) - 1,
  ): Promise<SingleLineChartData | null> {
    const lastTimestamp = this.dateUtilService
      .tms2000ToDate(tms2000Last)
      .getTime();
    const datesToFetch: string[] = [];
    for (let i = 0; i < amount; i++) {
      datesToFetch.push((lastTimestamp - 1000 * 60 * 30 * i).toString());
    }

    const response = await this.connectionService
      .getRedis()
      .hmget(`data:${id}.${line}`, datesToFetch);

    if (response === null) {
      return null;
    }

    const data: SingleLineChartData = [];
    for (let i = 0; i < response.length; i++) {
      const responseNumber = parseInt(response[i] ?? 'NaN');
      if (!isNaN(responseNumber)) {
        data.push([parseInt(datesToFetch[i]), responseNumber]);
      } else {
        if (response[i] !== 'ignored') {
          data.push([parseInt(datesToFetch[i]), 0]);
        }
      }
    }

    return data;
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

  async getDrilldownPieData(
    id: number,
    tms2000: number = this.dateUtilService.dateToTms2000(new Date()) - 1,
  ): Promise<DrilldownPieChartData | null> {
    const response = await this.connectionService
      .getRedis()
      .zrange(`data:${id}.${tms2000}`, 0, -1, 'WITHSCORES');

    if (response === null) {
      return null;
    }

    // We have to convert the data first, e.g.:
    // ["Windows","7","Linux","42"] -> [{"name":"Windows","y":7,"drilldown":"Windows"},{"name":"Linux","y":42,"drilldown":"Linux"}]
    const data: DrilldownPieChartData = {
      drilldownData: [],
      seriesData: [],
    };
    for (let i = 0; i < response.length; i += 2) {
      data.seriesData.push({
        name: response[i],
        y: parseInt(response[i + 1]),
        drilldown: response[i],
      });

      const drilldownResponse = await this.connectionService
        .getRedis()
        .zrange(`data:${id}.${tms2000}.${response[i]}`, 0, -1, 'WITHSCORES');

      // We have to convert the data first, e.g.:
      // ["Windows 10","4","Windows 7","3"] -> {"name": "Windows", "id": "Windows", "data":[["Windows 10", 4], ["Windows 7", 3]]}
      const drilldownData: [string, number][] = [];
      for (let i = 0; i < drilldownResponse.length; i += 2) {
        drilldownData.push([
          drilldownResponse[i],
          parseInt(drilldownResponse[i + 1]),
        ]);
      }

      data.drilldownData.push({
        name: response[i],
        id: response[i],
        data: drilldownData,
      });
    }

    return data;
  }
}
