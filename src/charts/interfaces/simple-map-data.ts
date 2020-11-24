export interface SimpleMapData {
  valueName: string;
  filter?: {
    enabled: boolean;
    useRegex: boolean;
    blacklist: boolean;
    filter: string[];
  };
}
