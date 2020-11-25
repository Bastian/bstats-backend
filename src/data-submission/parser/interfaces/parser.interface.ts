import {
  SubmitDataCustomChartDto,
  SubmitDataDto,
  SubmitDataPluginDto,
} from '../../dto/submit-data.dto';
import { DefaultChart } from '../../../charts/interfaces/default-chart.interface';

export interface Parser {
  parse: (
    chart: DefaultChart,
    submitDataDto: SubmitDataDto,
    submitDataPluginDto: SubmitDataPluginDto | null,
    requestRandom: number,
  ) => SubmitDataCustomChartDto[] | null;
}
