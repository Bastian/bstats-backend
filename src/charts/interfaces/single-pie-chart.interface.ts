import { Chart } from './chart.interface';
import { DefaultChart } from './default-chart.interface';

export interface SimplePieChart extends Chart {
  type: 'simple_pie';
  data: {
    filter?: {
      enabled: boolean;
      useRegex: boolean;
      blacklist: boolean;
      filter: string[];
    };
  };
}

export function isSimplePieChart(
  chart: Chart | DefaultChart,
): chart is SimplePieChart {
  return (chart as SimplePieChart).type === 'simple_pie';
}
