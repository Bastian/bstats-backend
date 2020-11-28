import { Controller, Get, Param, Res } from '@nestjs/common';
import { SignaturesService } from './signatures.service';
import { assertIsDefinedOrThrowNotFound } from '../../assertions';
import { Response } from 'express';

@Controller('signatures')
export class SignaturesController {
  constructor(private signaturesService: SignaturesService) {}

  @Get(':softwareUrl/:serviceName.svg')
  async findOne(
    @Param('softwareUrl') softwareUrl: string,
    @Param('serviceName') serviceName: string,
    @Res() response: Response,
  ): Promise<void> {
    const buffer = await this.signaturesService.renderServersAndPlayersChart(
      softwareUrl,
      serviceName,
    );
    assertIsDefinedOrThrowNotFound(buffer);
    response.setHeader('Content-Type', 'image/svg+xml');
    response.send(buffer);
  }
}
