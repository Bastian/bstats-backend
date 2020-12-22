import { Chart } from './chart.interface';
import { DefaultChart } from './default-chart.interface';

export interface BarChart extends Chart {
  type: 'advanced_bar' | 'simple_bar'; // There's not really a difference
  data: {
    valueName: string;
    barNames: string[];
    filter?: {
      enabled: boolean;
      maxValue: number;
      useRegex: boolean;
      blacklist: boolean;
      filter: string[];
    };
  };
}

export function isBarChart(chart: Chart | DefaultChart): chart is BarChart {
  return (
    (chart as BarChart).type === 'advanced_bar' ||
    (chart as BarChart).type === 'simple_bar'
  );
}
