import { Injectable } from '@nestjs/common';
import {
  SubmitDataCustomChartDto,
  SubmitDataDto,
  SubmitDataPluginDto,
} from '../dto/submit-data.dto';
import { Parser } from './interfaces/parser.interface';
import { DefaultChart } from '../../charts/interfaces/charts/default-chart.interface';

@Injectable()
export class BugeecordVersionParser implements Parser {
  parse(
    chart: DefaultChart,
    submitDataDto: SubmitDataDto,
    submitDataPluginDto: SubmitDataPluginDto | null,
    requestRandom: number,
  ): SubmitDataCustomChartDto[] | null {
    const { bungeecordVersion } = submitDataDto;

    if (!bungeecordVersion) {
      return null;
    }

    const split = bungeecordVersion.split(':');
    return [
      new SubmitDataCustomChartDto(
        chart.idCustom,
        { value: split.length > 2 ? split[2] : bungeecordVersion },
        requestRandom,
      ),
    ];
  }
}
