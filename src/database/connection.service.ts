import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { Cluster } from 'ioredis';

@Injectable()
export class ConnectionService {
  private readonly redis: Redis | Cluster;

  constructor(private configService: ConfigService) {
    const useCluster =
      configService.get<string>('REDIS_USE_CLUSTER') === 'true';

    const node = {
      host: configService.get<string>('REDIS_HOST'),
      port: parseInt(configService.get<string>('REDIS_PORT') ?? '-1'),
    };

    if (useCluster) {
      this.redis = new Redis.Cluster([node], { enableAutoPipelining: false });
    } else {
      this.redis = new Redis({ ...node, enableAutoPipelining: false });
    }
  }

  getRedis(): Redis | Cluster {
    return this.redis;
  }
}
