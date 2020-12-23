export interface Chart {
  id: number;
  idCustom: string;
  type:
    | 'single_linechart'
    | 'simple_pie'
    | 'advanced_pie'
    | 'drilldown_pie'
    | 'simple_map'
    | 'advanced_map'
    | 'simple_bar'
    | 'advanced_bar'
    | string;
  position: number;
  title: string;
  isDefault: boolean;
  data: unknown;
  serviceId: number;
}
