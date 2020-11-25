import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConnectionService } from '../../database/connection.service';
import { RedisSoftware } from './interfaces/redis-software.interface';
import { assertIsDefined } from '../../assertions';

@Injectable()
export class RedisSoftwareService {
  constructor(private connectionService: ConnectionService) {}

  async findSoftwareById(id: number): Promise<RedisSoftware | null> {
    const fields = [
      'name',
      'url',
      'globalPlugin',
      'metricsClass',
      'examplePlugin',
      'maxRequestsPerIp',
      'defaultCharts',
      'hideInPluginList',
    ];
    const response = await this.connectionService
      .getRedis()
      .hmget(`software:${id}`, fields);

    if (response == null) {
      return null;
    }

    assertIsDefined(response[0]);
    assertIsDefined(response[1]);
    assertIsDefined(response[3]);
    assertIsDefined(response[4]);
    assertIsDefined(response[5]);
    assertIsDefined(response[6]);

    return {
      name: response[0],
      url: response[1],
      globalPlugin: response[2] == null ? null : parseInt(response[2]),
      metricsClass: response[3],
      examplePlugin: response[4],
      maxRequestsPerIp: parseInt(response[5]),
      defaultCharts: JSON.parse(response[6]).map((chart) => ({
        ...chart,
        id: undefined,
        idCustom: chart.id,
      })),
      hideInPluginList: response[7] !== null,
    };
  }

  async findAllSoftwareIds(): Promise<number[]> {
    const response = await this.connectionService
      .getRedis()
      .smembers('software.ids');

    if (response == null) {
      throw new InternalServerErrorException();
    }

    return response.map((s) => parseInt(s));
  }

  async findSoftwareIdByUrl(url: string): Promise<number | null> {
    const softwareId = await this.connectionService
      .getRedis()
      .get(`software.index.id.url:${url}`);

    if (softwareId == null) {
      return null;
    }

    return parseInt(softwareId);
  }
}
