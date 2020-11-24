import { SimpleMapData } from './simple-map-data';
import { SingleLineChartData } from './single-line-chart-data.interface';
import { SimplePieChartData } from './single-pie-chart-data';
import { DrilldownPieChartData } from './drilldown-pie-chart-data';

export interface Chart {
  id: number;
  idCustom: string;
  type: string;
  position: number;
  title: string;
  isDefault: boolean;
  data:
    | SingleLineChartData
    | SimplePieChartData
    | DrilldownPieChartData
    | SimpleMapData
    | unknown;
}
