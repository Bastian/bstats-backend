import { Injectable } from '@nestjs/common';
import { Service } from './interfaces/service.interface';
import { RedisServicesService } from './redis-services/redis-services.service';
import { ChartsService } from '../charts/charts.service';

@Injectable()
export class ServicesService {
  constructor(
    private redisServicesService: RedisServicesService,
    private chartsService: ChartsService,
  ) {}

  async findAll(includeCharts = false): Promise<Service[]> {
    const serviceIds = await this.redisServicesService.findAllServiceIds();
    return Promise.all(serviceIds.map((id) => this.findOne(id, includeCharts)));
  }

  async findOne(id: number, includeCharts = false): Promise<Service> {
    const redisService = await this.redisServicesService.findServiceById(id);

    return {
      id,
      name: redisService.name,
      owner: {
        name: redisService.owner,
      },
      software: {
        id: redisService.software,
      },
      isGlobal: redisService.global,
      chartIds: includeCharts ? undefined : redisService.charts,
      charts: includeCharts
        ? await Promise.all(
            redisService.charts.map((chartId) =>
              this.chartsService.findOne(chartId),
            ),
          )
        : undefined,
    };
  }

  async findBySoftwareUrlAndName(
    softwareUrl: string,
    name: string,
    includeCharts = false,
  ): Promise<Service> {
    return this.findOne(
      await this.redisServicesService.findServiceIdBySoftwareUrlAndName(
        softwareUrl,
        name,
      ),
      includeCharts,
    );
  }
}
