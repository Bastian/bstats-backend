export interface DrilldownPieChartData {
  filter?: {
    enabled: boolean;
    useRegex: boolean;
    blacklist: boolean;
    filter: string[];
  };
}
