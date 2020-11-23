import { Module } from '@nestjs/common';
import { ChartsService } from './charts.service';
import { ChartsController } from './charts.controller';
import { RedisChartsService } from './redis-charts/redis-charts.service';

@Module({
  providers: [ChartsService, RedisChartsService],
  controllers: [ChartsController],
  exports: [ChartsService],
})
export class ChartsModule {}
