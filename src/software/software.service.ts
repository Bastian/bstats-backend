import { Injectable } from '@nestjs/common';
import { RedisSoftwareService } from './redis-software/redis-software.service';
import { Software } from './interfaces/software.interface';

@Injectable()
export class SoftwareService {
  constructor(private redisSoftwareService: RedisSoftwareService) {}

  async findAll(): Promise<Software[]> {
    const softwareIds = await this.redisSoftwareService.findAllSoftwareIds();
    return Promise.all(softwareIds.map((id) => this.findOne(id)));
  }

  async findOne(id: number): Promise<Software> {
    const redisSoftware = await this.redisSoftwareService.findSoftwareById(id);

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

  async findOneByUrl(url: string): Promise<Software> {
    return this.findOne(
      await this.redisSoftwareService.findSoftwareIdByUrl(url),
    );
  }
}
