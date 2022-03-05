import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConnectionService } from '../../database/connection.service';
import { RedisService } from './interfaces/redis-service.interface';
import { assertIsDefined } from '../../assertions';

@Injectable()
export class RedisServicesService {
  constructor(private connectionService: ConnectionService) {}

  async findServiceById(id: number): Promise<RedisService | null> {
    const fields = ['name', 'owner', 'software', 'global', 'charts'];
    const response = await this.connectionService
      .getRedis()
      .hmget(`plugins:${id}`, fields);

    if (response == null || response[0] == null) {
      return null;
    }

    assertIsDefined(response[1]);
    assertIsDefined(response[2]);
    assertIsDefined(response[4]);

    return {
      name: response[0],
      owner: response[1],
      software: parseInt(response[2]),
      global: response[3] !== null,
      charts: JSON.parse(response[4]),
    };
  }

  async findAllServiceIds(): Promise<number[]> {
    const response = await this.connectionService
      .getRedis()
      .smembers('plugins.ids');

    if (response == null) {
      throw new InternalServerErrorException();
    }

    return response.map((s) => parseInt(s));
  }

  async findServiceIdBySoftwareUrlAndName(
    softwareUrl: string,
    name: string,
  ): Promise<number | null> {
    const serviceId = await this.connectionService
      .getRedis()
      .get(`plugins.index.id.url+name:${softwareUrl}.${name.toLowerCase()}`);

    if (serviceId == null) {
      return null;
    }

    return parseInt(serviceId);
  }

  async findUserServiceIds(username : string): Promise<number[] | null> {
    const services = await this.connectionService
        .getRedis()
        .smembers(`users.index.plugins.username:${username}`);

    if (services == null) {
      return null;
    }
    
    return services.map((s) => parseInt(s));
  }
}
