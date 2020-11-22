export interface Software {
  id: number;
  name: string;
  url: string;
  globalPlugin: number;
  metricsClass: string;
  examplePlugin: string;
  maxRequestsPerIp: number;
  defaultCharts: unknown; // TODO
  hideInPluginList: boolean;
}
