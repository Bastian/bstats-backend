import { Injectable } from '@nestjs/common';
import { ChartDataProcessor } from './interfaces/chart-data-processor.interface';
import { Chart } from '../../charts/interfaces/charts/chart.interface';
import { SubmitDataCustomChartDto } from '../dto/submit-data.dto';
import { PipelinedChartUpdater } from '../../charts/charts.service';
import { isSimplePieChart } from '../../charts/interfaces/charts/single-pie-chart.interface';
import * as geoip from 'geoip-lite';

@Injectable()
export class SimplePieChartDataProcessor implements ChartDataProcessor {
  async processData(
    chart: Chart,
    customChartData: SubmitDataCustomChartDto,
    tms2000: number,
    geo: geoip.Lookup | null,
    pipelineChartUpdater: PipelinedChartUpdater,
  ): Promise<any> {
    if (
      typeof customChartData.data !== 'object' ||
      typeof customChartData.data.value !== 'string' ||
      !isSimplePieChart(chart)
    ) {
      return;
    }
    pipelineChartUpdater.updatePieData(
      chart.id,
      tms2000,
      customChartData.data.value,
      1,
    );
  }
}
