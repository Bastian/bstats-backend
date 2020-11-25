import { Chart } from './chart.interface';
import { DefaultChart } from './default-chart.interface';

export interface SimpleMapDataChart extends Chart {
  type: 'simple_map';
  data: {
    valueName: string;
    filter?: {
      enabled: boolean;
      useRegex: boolean;
      blacklist: boolean;
      filter: string[];
    };
  };
}

export function isSimpleMapDataChart(
  chart: Chart | DefaultChart,
): chart is SimpleMapDataChart {
  return (chart as SimpleMapDataChart).type === 'simple_map';
}
