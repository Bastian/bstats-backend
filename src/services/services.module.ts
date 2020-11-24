import { Module } from '@nestjs/common';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { RedisServicesService } from './redis-services/redis-services.service';
import { ChartsModule } from '../charts/charts.module';

@Module({
  controllers: [ServicesController],
  providers: [ServicesService, RedisServicesService],
  imports: [ChartsModule],
  exports: [ServicesService],
})
export class ServicesModule {}
