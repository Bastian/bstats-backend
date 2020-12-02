import { Injectable } from '@nestjs/common';

@Injectable()
export class DateUtilService {
  private PAST = Date.UTC(2000, 1, 1, 0, 0, 0, 0);

  /**
   * Converts a date to a tms2000 value.
   */
  dateToTms2000(date: Date): number {
    return ((date.getTime() - this.PAST) / (1000 * 60 * 30)) | 0;
  }

  /**
   * Converts tms2000 tp date.
   */
  tms2000ToDate(tms2000: number): Date {
    return new Date(this.PAST + tms2000 * 1000 * 60 * 30);
  }
}
