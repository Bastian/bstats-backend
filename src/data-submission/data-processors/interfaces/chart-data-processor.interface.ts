import { Chart } from '../../../charts/interfaces/charts/chart.interface';
import { SubmitDataCustomChartDto } from '../../dto/submit-data.dto';
import * as geoip from 'geoip-lite';

export interface ChartDataProcessor {
  processData(
    chart: Chart,
    customChartData: SubmitDataCustomChartDto,
    tms2000: number,
    geo: geoip.Lookup | null,
  ): Promise<any>;
}
