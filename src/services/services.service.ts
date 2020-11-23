import { Injectable } from '@nestjs/common';
import { Service } from './interfaces/service.interface';
import { RedisServicesService } from './redis-services/redis-services.service';

@Injectable()
export class ServicesService {
  constructor(private redisServicesService: RedisServicesService) {}

  async findAll(): Promise<Service[]> {
    const serviceIds = await this.redisServicesService.findAllServiceIds();
    return Promise.all(serviceIds.map((id) => this.findOne(id)));
  }

  async findOne(id: number): Promise<Service> {
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
      chartIds: redisService.charts,
    };
  }

  async findBySoftwareUrlAndName(
    softwareUrl: string,
    name: string,
  ): Promise<Service> {
    return this.findOne(
      await this.redisServicesService.findServiceIdBySoftwareUrlAndName(
        softwareUrl,
        name,
      ),
    );
  }
}
