import { Injectable } from '@nestjs/common';
import { ChartDataProcessor } from './interfaces/chart-data-processor.interface';
import { Chart } from '../../charts/interfaces/charts/chart.interface';
import { SubmitDataCustomChartDto } from '../dto/submit-data.dto';
import { ChartsService } from '../../charts/charts.service';
import { isSingleLineChart } from '../../charts/interfaces/charts/single-line-chart.interface';

@Injectable()
export class SingleLineChartDataProcessor implements ChartDataProcessor {
  constructor(private chartsService: ChartsService) {}

  async processData(
    chart: Chart,
    customChartData: SubmitDataCustomChartDto,
    tms2000: number,
  ): Promise<any> {
    if (
      typeof customChartData.data !== 'object' ||
      typeof customChartData.data.value !== 'number' ||
      !isSingleLineChart(chart)
    ) {
      return;
    }
    let { value } = customChartData.data;
    if (chart.data.filter !== undefined && chart.data.filter.enabled) {
      const maxValue = chart.data.filter.maxValue;
      const minValue = chart.data.filter.minValue;
      if (typeof maxValue === 'number' && value > maxValue) {
        value = maxValue;
      } else if (typeof minValue === 'number' && value <= minValue) {
        value = minValue;
      }
    }
    return this.chartsService.updateLineChartData(
      chart.id,
      tms2000,
      '1',
      value,
    );
  }
}
