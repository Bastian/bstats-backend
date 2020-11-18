import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConnectionService } from '../../database/connection.service';
import { RedisService } from './interfaces/redis-service.interface';

@Injectable()
export class RedisServicesService {
  constructor(private connectionService: ConnectionService) {}

  async findServiceById(id: number): Promise<RedisService> {
    const fields = ['name', 'owner', 'software', 'global'];
    const response = await this.connectionService
      .getRedis()
      .hmget(`plugins:${id}`, fields);

    if (response == null) {
      throw new NotFoundException();
    }

    return {
      name: response[0],
      owner: response[1],
      software: parseInt(response[2]),
      global: response[3] !== null,
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
}
