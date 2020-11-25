import { Injectable } from '@nestjs/common';
import {
  SubmitDataCustomChartDto,
  SubmitDataDto,
  SubmitDataPluginDto,
} from '../dto/submit-data.dto';
import { Parser } from './interfaces/parser.interface';
import { DefaultChart } from '../../charts/interfaces/charts/default-chart.interface';

@Injectable()
export class JavaVersionParser implements Parser {
  private JAVA_VERSION_MAPPING = [
    ['1.7', 'Java 7'],
    ['1.8', 'Java 8'],
    // Java 9 changed the version format to 9.x.x instead of 1.9.x
    ...[...Array(22).keys()] // [0..22]
      .map((i) => i + 9) // [9..30]
      .map((i) => [`${i}`, `Java ${i}`]),
  ];

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

    for (const [identifier, readableName] of this.JAVA_VERSION_MAPPING) {
      if (javaVersion.startsWith(identifier)) {
        javaVersionChart.data.values[readableName] = {};
        javaVersionChart.data.values[readableName][javaVersion] = 1;
        return [javaVersionChart];
      }
    }

    javaVersionChart.data.values['Other'] = {};
    javaVersionChart.data.values['Other'][javaVersion] = 1;
    return [javaVersionChart];
  }
}
