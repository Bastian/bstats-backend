import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import IORedis from 'ioredis';

@Injectable()
export class ConnectionService {
  private readonly redis: IORedis.Redis | Redis.Cluster;

  constructor(private configService: ConfigService) {
    const useCluster =
      configService.get<string>('REDIS_USE_CLUSTER') === 'true';

    const node = {
      host: configService.get<string>('REDIS_HOST'),
      port: parseInt(configService.get<string>('REDIS_PORT')),
    };

    if (useCluster) {
      this.redis = new Redis.Cluster([node]);
    } else {
      this.redis = new Redis({ ...node });
    }
  }

  getRedis(): IORedis.Redis | Redis.Cluster {
    return this.redis;
  }
}
