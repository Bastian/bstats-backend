import { Injectable } from '@nestjs/common';

@Injectable()
export class DateUtilService {
  /**
   * Converts a date to a tms2000 value.
   */
  dateToTms2000(date: Date): number {
    const past = new Date(2000, 1, 1, 0, 0, 0, 0).getTime();
    return ((date.getTime() - past) / (1000 * 60 * 30)) | 0;
  }

  /**
   * Converts tms2000 tp date.
   */
  tms2000ToDate(tms2000: number): Date {
    const past = new Date(2000, 1, 1, 0, 0, 0, 0).getTime();
    return new Date(past + tms2000 * 1000 * 60 * 30);
  }
}
