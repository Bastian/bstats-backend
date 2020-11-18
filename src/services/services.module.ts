import { Module } from '@nestjs/common';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { RedisServicesService } from './redis-services/redis-services.service';

@Module({
  controllers: [ServicesController],
  providers: [ServicesService, RedisServicesService],
})
export class ServicesModule {}
