import { DefaultChart } from '../../charts/interfaces/charts/default-chart.interface';

export interface Software {
  id: number;
  name: string;
  url: string;
  globalPlugin: number | null | undefined;
  metricsClass: string | null;
  examplePlugin: string | null;
  maxRequestsPerIp: number;
  defaultCharts: DefaultChart[];
  hideInPluginList: boolean;
}
