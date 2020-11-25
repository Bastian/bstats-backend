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
  private JAVA_VERSION_MAPPING = [
    ['1.7', 'Java 7'],
    ['1.8', 'Java 8'],
    //java 9 changed the version format to 9.0.1 and 1.9.0 is only used for early access
    //reference: http://openjdk.java.net/jeps/223
    ['1.9.0-ea', 'Java 9'],
    ['9', 'Java 9'],
    ['10', 'Java 10'],
    ['11', 'Java 11'],
    ['12', 'Java 12'],
    ['13', 'Java 13'],
    ['14', 'Java 14'],
    ['15', 'Java 15'],
    ['16', 'Java 16'],
    ['17', 'Java 17'],
    ['18', 'Java 18'],
    ['19', 'Java 19'],
    ['20', 'Java 20'],
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
