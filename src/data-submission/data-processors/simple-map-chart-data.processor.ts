import { Injectable } from '@nestjs/common';
import { ChartDataProcessor } from './interfaces/chart-data-processor.interface';
import { Chart } from '../../charts/interfaces/charts/chart.interface';
import { SubmitDataCustomChartDto } from '../dto/submit-data.dto';
import { PipelinedChartUpdater } from '../../charts/charts.service';
import { isSimpleMapDataChart } from '../../charts/interfaces/charts/simple-map-chart.interface';
import * as geoip from 'geoip-lite';

@Injectable()
export class SimpleMapChartDataProcessor implements ChartDataProcessor {
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
      !isSimpleMapDataChart(chart)
    ) {
      return;
    }
    let { value } = customChartData.data;
    if (value === 'AUTO') {
      value = geo?.country;
      if (!value) {
        return;
      }
    }
    pipelineChartUpdater.updateMapData(chart.id, tms2000, value, 1);
  }
}
