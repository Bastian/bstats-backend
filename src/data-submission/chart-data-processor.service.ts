import { Injectable } from '@nestjs/common';
import { SimpleMapChartDataProcessor } from './data-processors/simple-map-chart-data.processor';
import { AdvancedPieChartDataProcessor } from './data-processors/advanced-pie-chart-data.processor';
import { DrilldownPieChartDataProcessor } from './data-processors/drilldown-pie-chart-data.processor';
import { SingleLineChartDataProcessor } from './data-processors/single-line-chart-data.processor';
import { Chart } from '../charts/interfaces/charts/chart.interface';
import { ChartDataProcessor } from './data-processors/interfaces/chart-data-processor.interface';
import { isSimplePieChart } from '../charts/interfaces/charts/single-pie-chart.interface';
import { isAdvancedPieChart } from '../charts/interfaces/charts/advanced-pie-chart.interface';
import { isDrilldownPieChart } from '../charts/interfaces/charts/drilldown-pie-chart.interface';
import { isSingleLineChart } from '../charts/interfaces/charts/single-line-chart.interface';
import { isSimpleMapDataChart } from '../charts/interfaces/charts/simple-map-chart.interface';
import { SimplePieChartDataProcessor } from './data-processors/simple-pie-chart-data.processor';
import { isBarChart } from '../charts/interfaces/charts/advanced-bar-chart.interface';
import { BarChartDataProcessor } from './data-processors/bar-chart-data.processor';

@Injectable()
export class ChartDataProcessorService {
  constructor(
    private simplePieChartDataProcessor: SimplePieChartDataProcessor,
    private advancedPieChartDataProcessor: AdvancedPieChartDataProcessor,
    private drilldownPieChartDataProcessor: DrilldownPieChartDataProcessor,
    private singleLineChartDataProcessor: SingleLineChartDataProcessor,
    private simpleMapChartDataProcessor: SimpleMapChartDataProcessor,
    private barChartDataProcessor: BarChartDataProcessor,
  ) {}

  findChartDataProcessor(chart: Chart): ChartDataProcessor | null {
    if (isSimplePieChart(chart)) {
      return this.simplePieChartDataProcessor;
    } else if (isAdvancedPieChart(chart)) {
      return this.advancedPieChartDataProcessor;
    } else if (isDrilldownPieChart(chart)) {
      return this.drilldownPieChartDataProcessor;
    } else if (isSingleLineChart(chart)) {
      return this.singleLineChartDataProcessor;
    } else if (isSimpleMapDataChart(chart)) {
      return this.simpleMapChartDataProcessor;
    } else if (isBarChart(chart)) {
      return this.barChartDataProcessor;
    } else {
      return null;
    }
  }
}
