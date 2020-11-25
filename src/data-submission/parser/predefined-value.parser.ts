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
} from '../../charts/interfaces/default-chart.interface';

@Injectable()
export class PredefinedValueParser implements Parser {
  parse(
    chart: DefaultChart,
    submitDataDto: SubmitDataDto,
    submitDataPluginDto: SubmitDataPluginDto | null,
    requestRandom: number,
  ): SubmitDataCustomChartDto[] | null {
    if (!isPredefinedValueParser(chart.requestParser)) {
      return null;
    }
    let value = chart.requestParser.predefinedValue;
    if (value === '%country.name%') {
      // TODO Get country name
      value = 'Unknown';
    }
    return [
      new SubmitDataCustomChartDto(chart.idCustom, { value }, requestRandom),
    ];
  }
}
