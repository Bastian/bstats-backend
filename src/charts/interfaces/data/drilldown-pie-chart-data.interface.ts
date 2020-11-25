export interface DrilldownPieChartData {
  seriesData: { name: string; y: number; drilldown: string }[];
  drilldownData: { name: string; id: string; data: [string, number][] }[];
}
