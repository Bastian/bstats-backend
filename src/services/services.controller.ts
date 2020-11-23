import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { Service } from './interfaces/service.interface';
import { ServicesService } from './services.service';

@Controller('services')
export class ServicesController {
  constructor(private servicesService: ServicesService) {}

  @Get()
  async findAll(): Promise<Service[]> {
    return this.servicesService.findAll();
  }

  @Get('search')
  async findBySoftwareUrlAndName(
    @Query('softwareUrl') softwareUrl: string,
    @Query('name') name: string,
  ): Promise<Service> {
    return this.servicesService.findBySoftwareUrlAndName(softwareUrl, name);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Service> {
    return this.servicesService.findOne(id);
  }
}
