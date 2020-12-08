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
   * Converts tms2000 to date.
   */
  tms2000ToDate(tms2000: number): Date {
    return new Date(this.PAST + tms2000 * 1000 * 60 * 30);
  }

  /**
   * Converts tms2000 to timestamo.
   */
  tms2000ToTimestamp(tms2000: number): number {
    return this.PAST + tms2000 * 1000 * 60 * 30;
  }

  dateToTms2000Div1000(date: Date): number {
    return ((date.getTime() - this.PAST) / (1000 * 1000 * 60 * 30)) | 0;
  }

  tms2000Div1000ToDate(tms2000Div1000: number): Date {
    return new Date(this.PAST + tms2000Div1000 * 1000 * 1000 * 60 * 30);
  }

  thirtyMinutesSinceLastTms2000Div1000(date: Date): number {
    const tms2000 = this.dateToTms2000(date);
    const tms2000Div1000 = this.dateToTms2000Div1000(date);
    const dateLastTms2000Div1000 = this.tms2000Div1000ToDate(tms2000Div1000);
    const tms2000AtLastTms2000Div1000 = this.dateToTms2000(
      dateLastTms2000Div1000,
    );
    return tms2000 - tms2000AtLastTms2000Div1000;
  }
}
