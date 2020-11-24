import { DefaultChart } from '../../charts/interfaces/default-chart.interface';

export interface Software {
  id: number;
  name: string;
  url: string;
  globalPlugin: number | null | undefined;
  metricsClass: string;
  examplePlugin: string;
  maxRequestsPerIp: number;
  defaultCharts: DefaultChart[];
  hideInPluginList: boolean;
}
