import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { assertIsDefinedOrThrowNotFound } from '../assertions';
import { ServicesService } from '../services/services.service';
import { Chart } from '../charts/interfaces/charts/chart.interface';
import { ChartData } from '../charts/interfaces/data/chart-data.interface';
import { ChartsService } from '../charts/charts.service';
import { ApiTags } from '@nestjs/swagger';

@Controller('legacy')
@ApiTags('legacy')
export class LegacyController {
  constructor(
    private servicesService: ServicesService,
    private chartsService: ChartsService,
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
}
