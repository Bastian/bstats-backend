import { Module } from '@nestjs/common';
import { ChartsService } from './charts.service';
import { ChartsController } from './charts.controller';
import { RedisChartsService } from './redis-charts/redis-charts.service';
import { DateUtilService } from './date-util.service';
import { ChartRendererModule } from './chart-renderer/chart-renderer.module';
import { SignaturesModule } from './signatures/signatures.module';

@Module({
  providers: [ChartsService, RedisChartsService, DateUtilService],
  controllers: [ChartsController],
  imports: [DateUtilService, ChartRendererModule, SignaturesModule],
  exports: [ChartsService, DateUtilService],
})
export class ChartsModule {}
