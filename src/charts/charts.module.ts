import { forwardRef, Module } from '@nestjs/common';
import { ChartsService } from './charts.service';
import { ChartsController } from './charts.controller';
import { RedisChartsService } from './redis-charts/redis-charts.service';
import { DateUtilService } from './date-util.service';
import { ChartRendererModule } from './chart-renderer/chart-renderer.module';
import { SignaturesModule } from './signatures/signatures.module';
import { HistoricLineChartDataService } from './historic-line-chart-data.service';
import { DataArchiverService } from './data-archiver.service';
import { ServicesModule } from '../services/services.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  providers: [
    ChartsService,
    RedisChartsService,
    DateUtilService,
    HistoricLineChartDataService,
    DataArchiverService,
  ],
  controllers: [ChartsController],
  imports: [
    ConfigModule,
    DateUtilService,
    ChartRendererModule,
    SignaturesModule,
    forwardRef(() => ServicesModule),
  ],
  exports: [ChartsService, DateUtilService],
})
export class ChartsModule {}
