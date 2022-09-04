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
      this.redis = new Redis.Cluster([node], {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        enableAutoPipelining: true,
      });
    } else {
      this.redis = new Redis({ ...node, enableAutoPipelining: true });
    }
  }

  getRedis(): Redis | Cluster {
    return this.redis;
  }
}
