import { Chart } from './chart.interface';

export interface DrilldownPieChart extends Chart {
  type: 'drilldown_pie';
  data: {
    filter?: {
      enabled: boolean;
      useRegex: boolean;
      blacklist: boolean;
      filter: string[];
    };
  };
}

export function isDrilldownPieChart(chart: Chart): chart is DrilldownPieChart {
  return (chart as DrilldownPieChart).type === 'drilldown_pie';
}
