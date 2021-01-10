import {
  SubmitDataCustomChartDto,
  SubmitDataDto,
} from '../../dto/submit-data.dto';
import { DefaultChart } from '../../../charts/interfaces/charts/default-chart.interface';

export interface Parser {
  parse: (
    chart: DefaultChart,
    submitDataDto: SubmitDataDto,
    requestRandom: number,
    countryName: string | null,
  ) => SubmitDataCustomChartDto[] | null;
}
