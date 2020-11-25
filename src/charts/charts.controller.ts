import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { Chart } from './interfaces/charts/chart.interface';
import { ChartsService } from './charts.service';
import { assertIsDefinedOrThrowNotFound } from '../assertions';

@Controller('charts')
export class ChartsController {
  constructor(private chartsService: ChartsService) {}

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Chart> {
    const chart = await this.chartsService.findOne(id);
    assertIsDefinedOrThrowNotFound(chart);
    return chart;
  }
}
