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

  getRedis(): IORedis.Redis | Redis.Cluster {
    return this.redis;
  }
}
