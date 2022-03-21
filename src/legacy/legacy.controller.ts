import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Ip,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { assertIsDefinedOrThrowNotFound } from '../assertions';
import { ServicesService } from '../services/services.service';
import { Chart } from '../charts/interfaces/charts/chart.interface';
import { ChartData } from '../charts/interfaces/data/chart-data.interface';
import { ChartsService } from '../charts/charts.service';
import { DeprecatedSubmitDataDto } from '../data-submission/dto/submit-data.dto';
import { IpAddress } from '../ip-address.decorator';
import { DataSubmissionService } from '../data-submission/data-submission.service';
import { ApiTags } from '@nestjs/swagger';

@Controller('legacy')
@ApiTags('legacy')
export class LegacyController {
  constructor(
    private servicesService: ServicesService,
    private chartsService: ChartsService,
    private dataSubmissionService: DataSubmissionService,
  ) {}

  @Get('service/:id')
  async findOneService(@Param('id', ParseIntPipe) id: number): Promise<any> {
    const service = await this.servicesService.findOne(id, true);
    assertIsDefinedOrThrowNotFound(service);
    service.charts = this.mapChartsArray(service.charts ?? []);
    return service;
  }

  @Get('service/:id/charts')
  async findCharts(@Param('id', ParseIntPipe) id: number): Promise<any> {
    const service = await this.servicesService.findOne(id, true);
    assertIsDefinedOrThrowNotFound(service);
    return this.mapChartsArray(service.charts ?? []);
  }

  @Get('service/:id/charts/:idCustom')
  async findOneChart(
    @Param('id', ParseIntPipe) id: number,
    @Param('idCustom') idCustom: string,
  ): Promise<any> {
    const service = await this.servicesService.findOne(id, true);
    assertIsDefinedOrThrowNotFound(service);
    return this.mapChartsArray(service.charts ?? [])[idCustom];
  }

  private mapChartsArray(charts: Chart[]): any {
    const newCharts = {};
    charts.forEach((chart) => {
      newCharts[chart.idCustom] = {
        ...chart,
        uid: chart.id,
      };
    });
    return newCharts;
  }

  @Get('service/:id/charts/:idCustom/data')
  async findData(
    @Param('id', ParseIntPipe) serviceId: number,
    @Param('idCustom') idCustom: string,
    @Query('maxElements', new DefaultValuePipe(2 * 24), ParseIntPipe)
    maxElements: number,
  ): Promise<ChartData> {
    const chart = await this.chartsService.findByServiceIdAndCustomId(
      serviceId,
      idCustom,
    );
    assertIsDefinedOrThrowNotFound(chart);
    const chartData = await this.chartsService.findData(chart.id, maxElements);
    assertIsDefinedOrThrowNotFound(chartData);
    if (chart.type === 'single_linechart') {
      return (chartData as []).reverse();
    }
    return chartData;
  }

  @Post('submitData')
  async submitDataOld(
    @Body() submitDataDto: DeprecatedSubmitDataDto,
    @Ip() ip: string,
  ) {
    return this.submitData('bukkit', submitDataDto, ip);
  }

  @Post('submitData/:softwareUrl')
  async submitData(
    @Param('softwareUrl') softwareUrl: string,
    @Body() submitDataDto: DeprecatedSubmitDataDto,
    @IpAddress() ip: string,
  ) {
    const promises = submitDataDto.plugins
      .filter((plugin) => plugin.id !== null || plugin.pluginName !== null)
      .map(async (plugin) => {
        const pluginId =
          plugin.id ??
          (
            await this.servicesService.findBySoftwareUrlAndName(
              softwareUrl,
              plugin.pluginName ?? '',
            )
          )?.id;

        if (pluginId == null) {
          return;
        }

        return await this.dataSubmissionService.submitServiceData(
          softwareUrl,
          {
            ...submitDataDto,
            service: {
              ...plugin,
              id: pluginId,
            },
          },
          ip,
          false,
        );
      });
    await Promise.all(promises);
  }
}
