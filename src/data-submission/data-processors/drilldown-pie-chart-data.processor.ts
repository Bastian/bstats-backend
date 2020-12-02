import { Injectable } from '@nestjs/common';
import { ChartDataProcessor } from './interfaces/chart-data-processor.interface';
import { Chart } from '../../charts/interfaces/charts/chart.interface';
import { SubmitDataCustomChartDto } from '../dto/submit-data.dto';
import { ChartsService } from '../../charts/charts.service';
import { isDrilldownPieChart } from '../../charts/interfaces/charts/drilldown-pie-chart.interface';

@Injectable()
export class DrilldownPieChartDataProcessor implements ChartDataProcessor {
  constructor(private chartsService: ChartsService) {}

  async processData(
    chart: Chart,
    customChartData: SubmitDataCustomChartDto,
    tms2000: number,
  ): Promise<any> {
    if (
      typeof customChartData.data !== 'object' ||
      typeof customChartData.data.values !== 'object' ||
      !isDrilldownPieChart(chart)
    ) {
      return;
    }
    const promises: Promise<unknown>[] = [];
    for (const value in customChartData.data.values) {
      if (
        !customChartData.data.values.hasOwnProperty(value) ||
        typeof customChartData.data.values[value] !== 'object'
      ) {
        continue;
      }
      promises.push(
        this.chartsService.updateDrilldownPieData(
          chart.id,
          tms2000,
          value,
          customChartData.data.values[value],
        ),
      );
    }
    return Promise.all(promises);
  }
}
