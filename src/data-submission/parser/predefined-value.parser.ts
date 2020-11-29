import { Injectable } from '@nestjs/common';
import {
  SubmitDataCustomChartDto,
  SubmitDataDto,
  SubmitDataPluginDto,
} from '../dto/submit-data.dto';
import { Parser } from './interfaces/parser.interface';
import {
  DefaultChart,
  isPredefinedValueParser,
} from '../../charts/interfaces/charts/default-chart.interface';

@Injectable()
export class PredefinedValueParser implements Parser {
  parse(
    chart: DefaultChart,
    submitDataDto: SubmitDataDto,
    submitDataPluginDto: SubmitDataPluginDto | null,
    requestRandom: number,
    countryName: string | null,
  ): SubmitDataCustomChartDto[] | null {
    if (!isPredefinedValueParser(chart.requestParser)) {
      return null;
    }
    let value = chart.requestParser.predefinedValue;
    if (value === '%country.name%') {
      value = countryName ?? 'Unknown';
    }
    return [
      new SubmitDataCustomChartDto(chart.idCustom, { value }, requestRandom),
    ];
  }
}
