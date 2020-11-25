import { Injectable } from '@nestjs/common';
import {
  SubmitDataCustomChartDto,
  SubmitDataDto,
  SubmitDataPluginDto,
} from '../dto/submit-data.dto';
import { Parser } from './interfaces/parser.interface';
import { DefaultChart } from '../../charts/interfaces/default-chart.interface';

@Injectable()
export class JavaVersionParser implements Parser {
  parse(
    chart: DefaultChart,
    submitDataDto: SubmitDataDto,
    submitDataPluginDto: SubmitDataPluginDto | null,
    requestRandom: number,
  ): SubmitDataCustomChartDto[] | null {
    const { javaVersion } = submitDataDto;
    if (typeof javaVersion !== 'string') {
      return null;
    }
    const javaVersionChart = new SubmitDataCustomChartDto(
      'javaVersion',
      { values: {} },
      requestRandom,
    );
    if (javaVersion.startsWith('1.7')) {
      javaVersionChart.data.values['Java 7'] = {};
      javaVersionChart.data.values['Java 7'][javaVersion] = 1;
    } else if (javaVersion.startsWith('1.8')) {
      javaVersionChart.data.values['Java 8'] = {};
      javaVersionChart.data.values['Java 8'][javaVersion] = 1;
    } else if (javaVersion.startsWith('9') || javaVersion === '1.9.0-ea') {
      //java 9 changed the version format to 9.0.1 and 1.9.0 is only used for early access
      //reference: http://openjdk.java.net/jeps/223
      javaVersionChart.data.values['Java 9'] = {};
      javaVersionChart.data.values['Java 9'][javaVersion] = 1;
    } else if (javaVersion.startsWith('10')) {
      javaVersionChart.data.values['Java 10'] = {};
      javaVersionChart.data.values['Java 10'][javaVersion] = 1;
    } else if (javaVersion.startsWith('11')) {
      javaVersionChart.data.values['Java 11'] = {};
      javaVersionChart.data.values['Java 11'][javaVersion] = 1;
    } else if (javaVersion.startsWith('12')) {
      javaVersionChart.data.values['Java 12'] = {};
      javaVersionChart.data.values['Java 12'][javaVersion] = 1;
    } else if (javaVersion.startsWith('13')) {
      javaVersionChart.data.values['Java 13'] = {};
      javaVersionChart.data.values['Java 13'][javaVersion] = 1;
    } else if (javaVersion.startsWith('14')) {
      javaVersionChart.data.values['Java 14'] = {};
      javaVersionChart.data.values['Java 14'][javaVersion] = 1;
    } else if (javaVersion.startsWith('15')) {
      javaVersionChart.data.values['Java 15'] = {};
      javaVersionChart.data.values['Java 15'][javaVersion] = 1;
    } else if (javaVersion.startsWith('16')) {
      javaVersionChart.data.values['Java 16'] = {};
      javaVersionChart.data.values['Java 16'][javaVersion] = 1;
    } else if (javaVersion.startsWith('17')) {
      javaVersionChart.data.values['Java 17'] = {};
      javaVersionChart.data.values['Java 17'][javaVersion] = 1;
    } else if (javaVersion.startsWith('18')) {
      javaVersionChart.data.values['Java 18'] = {};
      javaVersionChart.data.values['Java 18'][javaVersion] = 1;
    } else if (javaVersion.startsWith('19')) {
      javaVersionChart.data.values['Java 19'] = {};
      javaVersionChart.data.values['Java 19'][javaVersion] = 1;
    } else if (javaVersion.startsWith('20')) {
      javaVersionChart.data.values['Java 20'] = {};
      javaVersionChart.data.values['Java 20'][javaVersion] = 1;
    } else {
      javaVersionChart.data.values['Other'] = {};
      javaVersionChart.data.values['Other'][javaVersion] = 1;
    }
    return [javaVersionChart];
  }
}
