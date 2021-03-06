import { Injectable } from '@nestjs/common';
import {
  SubmitDataCustomChartDto,
  SubmitDataDto,
} from '../dto/submit-data.dto';
import { Parser } from './interfaces/parser.interface';
import { DefaultChart } from '../../charts/interfaces/charts/default-chart.interface';

@Injectable()
export class OsParser implements Parser {
  parse(
    chart: DefaultChart,
    submitDataDto: SubmitDataDto,
    requestRandom: number,
  ): SubmitDataCustomChartDto[] | null {
    const { osName, osVersion } = submitDataDto;
    if (typeof osName !== 'string' || typeof osVersion !== 'string') {
      return null;
    }
    const operatingSystemChart = new SubmitDataCustomChartDto(
      'os',
      { values: {} },
      requestRandom,
    );
    if (osName.startsWith('Windows Server')) {
      operatingSystemChart.data.values['Windows Server'] = {};
      operatingSystemChart.data.values['Windows Server'][osName] = 1;
    } else if (osName.startsWith('Windows NT')) {
      operatingSystemChart.data.values['Windows NT'] = {};
      operatingSystemChart.data.values['Windows NT'][osName] = 1;
    } else if (osName.startsWith('Windows')) {
      operatingSystemChart.data.values['Windows'] = {};
      operatingSystemChart.data.values['Windows'][osName] = 1;
    } else if (osName.startsWith('Linux')) {
      operatingSystemChart.data.values['Linux'] = {};
      operatingSystemChart.data.values['Linux'][osVersion] = 1;
    } else if (osName.startsWith('Mac OS X')) {
      operatingSystemChart.data.values['Mac OS X'] = {};
      operatingSystemChart.data.values['Mac OS X']['Mac OS X ' + osVersion] = 1;
    } else if (osName.indexOf('BSD') !== -1) {
      operatingSystemChart.data.values['BSD'] = {};
      operatingSystemChart.data.values['BSD'][osName + ' ' + osVersion] = 1;
    } else {
      operatingSystemChart.data.values['Other'] = {};
      operatingSystemChart.data.values['Other'][
        osName + ' (' + osVersion + ')'
      ] = 1;
    }
    return [operatingSystemChart];
  }
}
