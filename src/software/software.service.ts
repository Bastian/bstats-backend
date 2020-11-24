import { Injectable } from '@nestjs/common';
import { RedisSoftwareService } from './redis-software/redis-software.service';
import { Software } from './interfaces/software.interface';
import { isNotNull } from '../assertions';

@Injectable()
export class SoftwareService {
  constructor(private redisSoftwareService: RedisSoftwareService) {}

  async findAll(): Promise<Software[]> {
    const softwareIds = await this.redisSoftwareService.findAllSoftwareIds();
    const software = await Promise.all(
      softwareIds.map((id) => this.findOne(id)),
    );
    return software.filter(isNotNull);
  }

  async findOne(id: number): Promise<Software | null> {
    const redisSoftware = await this.redisSoftwareService.findSoftwareById(id);

    if (redisSoftware === null) {
      return null;
    }

    return {
      id,
      name: redisSoftware.name,
      url: redisSoftware.url,
      globalPlugin: redisSoftware.globalPlugin,
      metricsClass: redisSoftware.metricsClass,
      examplePlugin: redisSoftware.examplePlugin,
      maxRequestsPerIp: redisSoftware.maxRequestsPerIp,
      defaultCharts: redisSoftware.defaultCharts,
      hideInPluginList: redisSoftware.hideInPluginList,
    };
  }

  async findOneByUrl(url: string): Promise<Software | null> {
    const softwareId = await this.redisSoftwareService.findSoftwareIdByUrl(url);
    if (softwareId === null) {
      return null;
    }
    return this.findOne(softwareId);
  }
}
