import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { SoftwareService } from './software.service';
import { Software } from './interfaces/software.interface';

@Controller('software')
export class SoftwareController {
  constructor(private softwareService: SoftwareService) {}

  @Get()
  async findAll(): Promise<Software[]> {
    return this.softwareService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Software> {
    return this.softwareService.findOne(id);
  }
}
