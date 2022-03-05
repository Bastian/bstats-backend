import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { Service } from './interfaces/service.interface';
import { ServicesService } from './services.service';
import { assertIsDefinedOrThrowNotFound } from '../assertions';
import { AuthenticatedUser } from '../auth/authenticated-user.interface';

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

  @Get('users')
  async findUserServices(
    @Req() request: Request,
    @Query('includeCharts', new DefaultValuePipe(false), ParseBoolPipe)
    includeCharts: boolean,
  ): Promise<Service[]> {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    const user: AuthenticatedUser = request.user;
    assertIsDefinedOrThrowNotFound(user);
    const services = await this.servicesService.findUserServicesById(
      user.uid,
      includeCharts,
    );
    assertIsDefinedOrThrowNotFound(services);
    return services;
  }

  @Get('users/:uid')
  async findUserServicesById(
    @Param('uid') uid: string,
    @Query('includeCharts', new DefaultValuePipe(false), ParseBoolPipe)
    includeCharts: boolean,
  ): Promise<Service[]> {
    const services = await this.servicesService.findUserServicesById(
      uid,
      includeCharts,
    );
    assertIsDefinedOrThrowNotFound(services);
    return services;
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
