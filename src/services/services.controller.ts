import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { Service } from './interfaces/service.interface';
import { ServicesService } from './services.service';

@Controller('services')
export class ServicesController {
  constructor(private servicesService: ServicesService) {}

  @Get()
  findAll(): Service[] {
    return this.servicesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Service {
    return this.servicesService.findOne(id);
  }
}
