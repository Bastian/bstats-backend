import { Injectable } from '@nestjs/common';
import { ChartDataProcessor } from './interfaces/chart-data-processor.interface';
import { Chart } from '../../charts/interfaces/charts/chart.interface';
import { SubmitDataCustomChartDto } from '../dto/submit-data.dto';
import { PipelinedChartUpdater } from '../../charts/charts.service';
import { isAdvancedPieChart } from '../../charts/interfaces/charts/advanced-pie-chart.interface';
import * as geoip from 'geoip-lite';

@Injectable()
export class AdvancedPieChartDataProcessor implements ChartDataProcessor {
  async processData(
    chart: Chart,
    customChartData: SubmitDataCustomChartDto,
    tms2000: number,
    geo: geoip.Lookup | null,
    pipelineChartUpdater: PipelinedChartUpdater,
  ): Promise<any> {
    if (
      typeof customChartData.data !== 'object' ||
      typeof customChartData.data.values !== 'object' ||
      !isAdvancedPieChart(chart)
    ) {
      return;
    }
    for (const value in customChartData.data.values) {
      if (
        !customChartData.data.values.hasOwnProperty(value) ||
        typeof customChartData.data.values[value] !== 'number'
      ) {
        continue;
      }
      pipelineChartUpdater.updatePieData(
        chart.id,
        tms2000,
        value,
        customChartData.data.values[value],
      );
    }
  }
}
