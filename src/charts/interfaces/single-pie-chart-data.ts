export interface SimplePieChartData {
  filter?: {
    enabled: boolean;
    useRegex: boolean;
    blacklist: boolean;
    filter: string[];
  };
}
