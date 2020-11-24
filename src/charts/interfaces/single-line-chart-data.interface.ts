export interface SingleLineChartData {
  lineName: string;
  filter?: {
    enabled: boolean;
    maxValue: number;
    minValue: number;
  };
}
