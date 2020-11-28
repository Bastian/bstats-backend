import { Injectable } from '@nestjs/common';
import { ChartRendererService } from '../chart-renderer/chart-renderer.service';
import { ChartsService } from '../charts.service';
import { SoftwareService } from '../../software/software.service';
import { ServicesService } from '../../services/services.service';
import { SingleLineChartData } from '../interfaces/data/single-line-chart-data.interface';
import { assertIsDefined } from '../../assertions';

@Injectable()
export class SignaturesService {
  constructor(
    private chartRendererService: ChartRendererService,
    private chartsService: ChartsService,
    private softwareService: SoftwareService,
    private servicesService: ServicesService,
  ) {}

  async renderServersAndPlayersChart(
    softwareUrl: string,
    serviceName: string,
  ): Promise<Buffer | null> {
    const service = await this.servicesService.findBySoftwareUrlAndName(
      softwareUrl,
      serviceName,
      true,
    );
    if (service === null) {
      return null;
    }

    const getChartData = async (
      idCustom: string,
    ): Promise<SingleLineChartData | null> => {
      const chart = service?.charts?.find((c) => c.idCustom === idCustom);
      if (!chart) {
        return null;
      }
      if (chart.type !== 'single_linechart') {
        return null;
      }
      return ((await this.chartsService.findData(
        chart.id,
        2 * 24 * 7,
      )) as unknown) as Promise<SingleLineChartData | null>;
    };

    const playersData = await getChartData('players');
    const serversData = await getChartData('servers');

    assertIsDefined(playersData);
    assertIsDefined(serversData);

    return this.chartRendererService.renderServersAndPlayersChart(
      `${service.name} by ${service.owner.name}`,
      playersData,
      serversData,
    );
  }
}
