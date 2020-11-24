import { DefaultChart } from '../../../charts/interfaces/default-chart.interface';

export interface RedisSoftware {
  name: string;
  url: string;
  globalPlugin: number | null;
  metricsClass: string;
  examplePlugin: string;
  maxRequestsPerIp: number;
  defaultCharts: DefaultChart[];
  hideInPluginList: boolean;
}
