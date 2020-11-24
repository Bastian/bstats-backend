import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConnectionService } from '../../database/connection.service';
import { RedisService } from './interfaces/redis-service.interface';
import assert from 'assert';
import { assertIsDefined } from '../../assertions';

@Injectable()
export class RedisServicesService {
  constructor(private connectionService: ConnectionService) {}

  async findServiceById(id: number): Promise<RedisService> {
    const fields = ['name', 'owner', 'software', 'global', 'charts'];
    const response = await this.connectionService
      .getRedis()
      .hmget(`plugins:${id}`, fields);

    if (response == null) {
      throw new NotFoundException();
    }

    assertIsDefined(response[0]);
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
  ): Promise<number> {
    const serviceId = await this.connectionService
      .getRedis()
      .get(`plugins.index.id.url+name:${softwareUrl}.${name}`);

    if (serviceId == null) {
      throw new NotFoundException();
    }

    return parseInt(serviceId);
  }
}
