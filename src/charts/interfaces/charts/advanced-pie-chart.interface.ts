import { Chart } from './chart.interface';

export interface AdvancedPieChart extends Chart {
  type: 'advanced_pie';
  data: {
    filter?: {
      enabled: boolean;
      useRegex: boolean;
      blacklist: boolean;
      filter: string[];
    };
  };
}

export function isAdvancedPieChart(chart: Chart): chart is AdvancedPieChart {
  return (chart as AdvancedPieChart).type === 'advanced_pie';
}
