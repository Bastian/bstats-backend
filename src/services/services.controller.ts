import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { Service } from './interfaces/service.interface';
import { ServicesService } from './services.service';
import { assertIsDefinedOrThrowNotFound } from '../assertions';
import { ApiTags } from '@nestjs/swagger';

@Controller('services')
@ApiTags('services')
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
    @Query('includeCharts', new DefaultValuePipe(false), ParseBoolPipe)
    includeCharts: boolean,
  ): Promise<Service> {
    const service = await this.servicesService.findBySoftwareUrlAndName(
      softwareUrl,
      name,
      includeCharts,
    );
    assertIsDefinedOrThrowNotFound(service);
    return service;
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('includeCharts', new DefaultValuePipe(false), ParseBoolPipe)
    includeCharts: boolean,
  ): Promise<Service> {
    const service = await this.servicesService.findOne(id, includeCharts);
    assertIsDefinedOrThrowNotFound(service);
    return service;
  }

  @Get('legacy/:id')
  async findOneLegacy(@Param('id', ParseIntPipe) id: number): Promise<any> {
    const service = await this.servicesService.findOne(id, true);
    assertIsDefinedOrThrowNotFound(service);
    return {};
  }
}
