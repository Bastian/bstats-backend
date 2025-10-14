import { Injectable } from '@nestjs/common';
import { Service } from './interfaces/service.interface';
import { RedisServicesService } from './redis-services/redis-services.service';
import { ChartsService } from '../charts/charts.service';
import { assertIsDefined, isNotNull } from '../assertions';

@Injectable()
export class ServicesService {
  constructor(
    private redisServicesService: RedisServicesService,
    private chartsService: ChartsService,
  ) {}

  async findAllServiceIds(): Promise<number[]> {
    return this.redisServicesService.findAllServiceIds();
  }

  async findAll(includeCharts = false): Promise<Service[]> {
    const serviceIds = await this.redisServicesService.findAllServiceIds();
    const services = await Promise.all(
      serviceIds.map((id) => this.findOne(id, includeCharts)),
    );
    return services.filter(isNotNull);
  }

  async findOne(id: number, includeCharts = false): Promise<Service | null> {
    const redisService = await this.redisServicesService.findServiceById(id);

    if (!redisService) {
      return null;
    }

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
            redisService.charts.map(async (chartId) => {
              const chart = await this.chartsService.findOne(chartId);
              assertIsDefined(chart);
              return chart;
            }),
          )
        : undefined,
    };
  }

  async findBySoftwareUrlAndName(
    softwareUrl: string,
    name: string,
    includeCharts = false,
  ): Promise<Service | null> {
    const serviceId =
      await this.redisServicesService.findServiceIdBySoftwareUrlAndName(
        softwareUrl,
        name,
      );
    if (serviceId === null) {
      return null;
    }
    return this.findOne(serviceId, includeCharts);
  }

  async findUserServicesById(
    uid: string,
    includeCharts = false,
  ): Promise<Service[] | null> {
    const serviceIds = await this.redisServicesService.findUserServiceIds(uid);

    if (serviceIds === null) {
      return null;
    }

    const services = await Promise.all(
      serviceIds.map((id) => this.findOne(id, includeCharts)),
    );
    return services.filter(isNotNull);
  }
}
