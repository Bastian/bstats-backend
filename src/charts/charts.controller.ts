import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { Chart } from './interfaces/charts/chart.interface';
import { ChartsService } from './charts.service';
import { assertIsDefinedOrThrowNotFound } from '../assertions';
import { ChartData } from './interfaces/data/chart-data.interface';
import { ApiTags } from '@nestjs/swagger';

@Controller('charts')
@ApiTags('charts')
export class ChartsController {
  constructor(private chartsService: ChartsService) {}

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Chart> {
    const chart = await this.chartsService.findOne(id);
    assertIsDefinedOrThrowNotFound(chart);
    return chart;
  }

  @Get(':id/data')
  async findData(
    @Param('id', ParseIntPipe) id: number,
    @Query('maxElements', new DefaultValuePipe(2 * 24), ParseIntPipe)
    maxElements: number,
  ): Promise<ChartData> {
    const chartData = await this.chartsService.findData(id, maxElements);
    assertIsDefinedOrThrowNotFound(chartData);
    return chartData;
  }
}
