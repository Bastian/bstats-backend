import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { SoftwareService } from './software.service';
import { Software } from './interfaces/software.interface';
import { assertIsDefinedOrThrowNotFound } from '../assertions';
import { ApiTags } from '@nestjs/swagger';

@Controller('software')
@ApiTags('software')
export class SoftwareController {
  constructor(private softwareService: SoftwareService) {}

  @Get()
  async findAll(): Promise<Software[]> {
    return this.softwareService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Software> {
    const software = await this.softwareService.findOne(id);
    assertIsDefinedOrThrowNotFound(software);
    return software;
  }

  @Get('url/:url')
  async findOneByUrl(@Param('url') url: string): Promise<Software> {
    const software = await this.softwareService.findOneByUrl(url);
    assertIsDefinedOrThrowNotFound(software);
    return software;
  }
}
