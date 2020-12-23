import { Controller, Get, Param, Res } from '@nestjs/common';
import { SignaturesService } from './signatures.service';
import { assertIsDefinedOrThrowNotFound } from '../../assertions';
import { FastifyReply } from 'fastify';

@Controller('signatures')
export class SignaturesController {
  constructor(private signaturesService: SignaturesService) {}

  @Get(':softwareUrl/:serviceName(^\\w+).svg')
  async findOne(
    @Param('softwareUrl') softwareUrl: string,
    @Param('serviceName') serviceName: string,
    @Res() response: FastifyReply,
  ): Promise<void> {
    const buffer = await this.signaturesService.renderServersAndPlayersChart(
      softwareUrl,
      serviceName,
    );
    assertIsDefinedOrThrowNotFound(buffer);
    response.header('Content-Type', 'image/svg+xml');
    response.send(buffer);
  }
}
