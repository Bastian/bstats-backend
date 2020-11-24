import { DefaultChart } from '../../charts/interfaces/default-chart.interface';

export interface Software {
  id: number;
  name: string;
  url: string;
  globalPlugin: number;
  metricsClass: string;
  examplePlugin: string;
  maxRequestsPerIp: number;
  defaultCharts: DefaultChart[];
  hideInPluginList: boolean;
}
