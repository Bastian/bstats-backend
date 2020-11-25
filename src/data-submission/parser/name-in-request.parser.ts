import { Injectable } from '@nestjs/common';
import {
  SubmitDataCustomChartDto,
  SubmitDataDto,
  SubmitDataPluginDto,
} from '../dto/submit-data.dto';
import { Parser } from './interfaces/parser.interface';
import {
  DefaultChart,
  isNameInRequestBoolParser,
  isNameInRequestNumberParser,
  isNameInRequestParser,
} from '../../charts/interfaces/charts/default-chart.interface';
import { isSimplePieChart } from '../../charts/interfaces/charts/single-pie-chart.interface';
import { isSimpleMapDataChart } from '../../charts/interfaces/charts/simple-map-chart.interface';
import { isSingleLineChart } from '../../charts/interfaces/charts/single-line-chart.interface';

@Injectable()
export class NameInRequestParser implements Parser {
  parse(
    chart: DefaultChart,
    submitDataDto: SubmitDataDto,
    submitDataPluginDto: SubmitDataPluginDto | null,
    requestRandom: number,
  ): SubmitDataCustomChartDto[] | null {
    if (!isNameInRequestParser(chart.requestParser)) {
      return null;
    }
    const { nameInRequest, position } = chart.requestParser;
    let value: any = null;
    if (position === 'plugin' && submitDataPluginDto !== null) {
      value = submitDataPluginDto[nameInRequest];
    }
    if (position === 'global') {
      value = submitDataDto[nameInRequest];
    }
    if (value === null) {
      return null;
    }
    const fakeCustomChart = this.mapDefaultChartToFakeCustomChart(
      value,
      chart,
      requestRandom,
    );
    if (fakeCustomChart) {
      return [fakeCustomChart];
    } else {
      return null;
    }
  }

  private mapDefaultChartToFakeCustomChart(
    value: any,
    chart: DefaultChart,
    requestRandom: number,
  ): SubmitDataCustomChartDto | undefined {
    if (isNameInRequestNumberParser(chart.requestParser)) {
      if (typeof value !== 'number') {
        return;
      }
    } else if (isNameInRequestBoolParser(chart.requestParser)) {
      if (typeof value === 'number') {
        value = value !== 0;
      } else {
        return;
      }
    } else {
      if (typeof value !== 'string') {
        return;
      }
    }

    if (isSimplePieChart(chart) || isSimpleMapDataChart(chart)) {
      value = value.toString();
    } else if (isSingleLineChart(chart)) {
      if (chart.data.filter?.enabled) {
        const { minValue, maxValue } = chart.data.filter;
        if (typeof maxValue === 'number' && value > maxValue) {
          value = maxValue;
        } else if (typeof minValue === 'number' && value <= minValue) {
          value = minValue;
        }
      }
    } else {
      return;
    }

    return new SubmitDataCustomChartDto(
      chart.idCustom,
      { value },
      requestRandom,
    );
  }
}
