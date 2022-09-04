import { Injectable } from '@nestjs/common';
import { ConnectionService } from '../database/connection.service';
import { Software } from '../software/interfaces/software.interface';
import { TooManyRequestsException } from '../exceptions/TooManyRequestsException';
import { SubmitDataDto } from './dto/submit-data.dto';

@Injectable()
export class RatelimitService {
  constructor(private connectionService: ConnectionService) {}

  async checkRatelimits(
    submitDataDto: SubmitDataDto,
    software: Software,
    ip: string,
    tms2000: number,
  ) {
    if (
      await this.isRatelimited(
        `${submitDataDto.service.id}#${submitDataDto.serverUUID}`,
        software.url,
        1,
        tms2000,
      )
    ) {
      throw new TooManyRequestsException();
    }
    if (
      await this.isRatelimited(
        `${submitDataDto.service.id}#${ip}`,
        software.url,
        software.maxRequestsPerIp,
        tms2000,
      )
    ) {
      throw new TooManyRequestsException();
    }
  }

  private async isRatelimited(
    identifier: string,
    softwareUrl: string,
    maxRequests: number,
    tms2000: number,
  ): Promise<boolean> {
    const key = `ratelimit:${identifier}.${softwareUrl}.${tms2000}`;
    const response = await this.connectionService
      .getRedis()
      .multi()
      .incr(key)
      .expire(key, 60 * 31)
      .exec();

    const result = response?.[0]?.[1] as number;
    return result > maxRequests;
  }
}
