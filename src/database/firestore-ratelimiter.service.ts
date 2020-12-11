import { Injectable } from '@nestjs/common';
import { ConnectionService } from './connection.service';
import { ConfigService } from '@nestjs/config';
import { DateUtilService } from '../charts/date-util.service';

@Injectable()
export class FirestoreRatelimiterService {
  private readonly maxReadsPer30Min: number;
  private readonly maxWritesPer30Min: number;

  constructor(
    private connectionService: ConnectionService,
    private configService: ConfigService,
    private dateUtilService: DateUtilService,
  ) {
    this.maxReadsPer30Min =
      configService.get<number>('MAX_FIRESTORE_READS_PER_30_MINUTES') ?? 150000;
    this.maxWritesPer30Min =
      configService.get<number>('MAX_FIRESTORE_WRITES_PER_30_MINUTES') ??
      150000;
  }

  async checkRatelimitAndIncr(type: 'read' | 'write') {
    if (await this.isRatelimitedAndIncr(type)) {
      throw Error(`Exceeded maximum firestore ${type}s`);
    }
  }

  async isRatelimitedAndIncr(type: 'read' | 'write') {
    const tms2000 = this.dateUtilService.dateToTms2000(new Date());
    const key = `firestore-${type}:${tms2000}`;
    const response = await this.connectionService
      .getRedis()
      .multi()
      .incr(key)
      .expire(key, 60 * 31)
      .exec();

    return response[0][1] > this.maxReadsPer30Min;
  }
}
