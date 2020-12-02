import { Injectable } from '@nestjs/common';
import { RedisSoftwareService } from './redis-software/redis-software.service';
import { Software } from './interfaces/software.interface';
import { isNotNull } from '../assertions';

@Injectable()
export class SoftwareService {
  /**
   * The software does hardly change and if it does, we can just restart the server.
   *
   * So, to save database requests, we can easily cache the software in a local variable.
   */
  private softwareById: { [id: number]: Software } = {};
  private softwareIdByUrl: { [url: string]: number } = {};

  constructor(private redisSoftwareService: RedisSoftwareService) {}

  async findAll(): Promise<Software[]> {
    const softwareIds = await this.redisSoftwareService.findAllSoftwareIds();
    const software = await Promise.all(
      softwareIds.map((id) => this.findOne(id)),
    );
    return software.filter(isNotNull);
  }

  async findOne(id: number): Promise<Software | null> {
    if (this.softwareById[id]) {
      return this.softwareById[id];
    }

    const redisSoftware = await this.redisSoftwareService.findSoftwareById(id);

    if (redisSoftware === null) {
      return null;
    }

    const software = {
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

    this.softwareById[id] = software;

    return software;
  }

  async findOneByUrl(url: string): Promise<Software | null> {
    if (this.softwareIdByUrl[url] !== undefined) {
      return this.findOne(this.softwareIdByUrl[url]);
    }
    const softwareId = await this.redisSoftwareService.findSoftwareIdByUrl(url);
    if (softwareId === null) {
      return null;
    }
    this.softwareIdByUrl[url] = softwareId;
    return this.findOne(softwareId);
  }
}
