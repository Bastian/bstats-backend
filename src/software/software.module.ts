import { Module } from '@nestjs/common';
import { SoftwareService } from './software.service';
import { SoftwareController } from './software.controller';
import { RedisSoftwareService } from './redis-software/redis-software.service';

@Module({
  providers: [SoftwareService, RedisSoftwareService],
  controllers: [SoftwareController],
})
export class SoftwareModule {}
