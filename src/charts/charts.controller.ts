import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { Chart } from './interfaces/chart.interface';
import { ChartsService } from './charts.service';

@Controller('charts')
export class ChartsController {
  constructor(private chartsService: ChartsService) {}

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Chart> {
    return this.chartsService.findOne(id);
  }
}
