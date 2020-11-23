export interface Chart {
  id: number;
  idCustom: string;
  position: number;
  title: string;
  isDefault: boolean;
  data:
    | SingleLineChartData
    | SimplePieChartData
    | DrilldownPieChartData
    | unknown;
}

export interface SingleLineChartData {
  lineName: string;
  filter?: {
    enabled: boolean;
    maxValue: number;
    minValue: number;
  };
}

export interface SimplePieChartData {
  filter?: {
    enabled: boolean;
    useRegex: boolean;
    blacklist: boolean;
    filter: string[];
  };
}

export interface DrilldownPieChartData {
  filter?: {
    enabled: boolean;
    useRegex: boolean;
    blacklist: boolean;
    filter: string[];
  };
}

export interface SimpleMapData {
  valueName: string;
  filter?: {
    enabled: boolean;
    useRegex: boolean;
    blacklist: boolean;
    filter: string[];
  };
}
