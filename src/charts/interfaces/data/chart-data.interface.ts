import { SimplePieChartData } from './simple-pie-chart-data.interface';
import { AdvancedPieChartData } from './advanced-pie-chart-data.interface';
import { DrilldownPieChartData } from './drilldown-pie-chart-data.interface';
import { SingleLineChartData } from './single-line-chart-data.interface';
import { SimpleMapChartData } from './simple-map-chart-data.interface';

export type ChartData =
  | SimplePieChartData
  | AdvancedPieChartData
  | DrilldownPieChartData
  | SingleLineChartData
  | SimpleMapChartData;
