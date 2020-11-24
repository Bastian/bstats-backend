import { Chart } from './chart.interface';
import { DefaultChart } from './default-chart.interface';

export interface SingleLineChart extends Chart {
  type: 'single_linechart';
  data: {
    lineName: string;
    filter?: {
      enabled: boolean;
      maxValue: number;
      minValue: number;
    };
  };
}

export function isSingleLineChart(
  chart: Chart | DefaultChart,
): chart is SingleLineChart {
  return (chart as SingleLineChart).type === 'single_linechart';
}
