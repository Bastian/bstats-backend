import { Injectable } from '@nestjs/common';
import { ChartDataProcessor } from './interfaces/chart-data-processor.interface';
import { Chart } from '../../charts/interfaces/charts/chart.interface';
import { SubmitDataCustomChartDto } from '../dto/submit-data.dto';
import { ChartsService } from '../../charts/charts.service';
import { isSimplePieChart } from '../../charts/interfaces/charts/single-pie-chart.interface';

@Injectable()
export class SimplePieChartDataProcessor implements ChartDataProcessor {
  constructor(private chartsService: ChartsService) {}

  async processData(
    chart: Chart,
    customChartData: SubmitDataCustomChartDto,
    tms2000: number,
  ): Promise<any> {
    if (
      typeof customChartData.data !== 'object' ||
      typeof customChartData.data.value !== 'string' ||
      !isSimplePieChart(chart)
    ) {
      return;
    }
    return this.chartsService.updatePieData(
      chart.id,
      tms2000,
      customChartData.data.value,
      1,
    );
  }
}
