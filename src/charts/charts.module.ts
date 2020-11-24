import { Module } from '@nestjs/common';
import { ChartsService } from './charts.service';
import { ChartsController } from './charts.controller';
import { RedisChartsService } from './redis-charts/redis-charts.service';
import { DateUtilService } from './date-util.service';

@Module({
  providers: [ChartsService, RedisChartsService, DateUtilService],
  controllers: [ChartsController],
  imports: [DateUtilService],
  exports: [ChartsService, DateUtilService],
})
export class ChartsModule {}
