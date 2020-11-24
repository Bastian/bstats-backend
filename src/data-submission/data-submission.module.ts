import { Module } from '@nestjs/common';
import { DataSubmissionService } from './data-submission.service';
import { DataSubmissionController } from './data-submission.controller';
import { DateUtilService } from '../charts/date-util.service';
import { SoftwareModule } from '../software/software.module';
import { ServicesModule } from '../services/services.module';
import { ChartsModule } from '../charts/charts.module';

@Module({
  providers: [DataSubmissionService],
  controllers: [DataSubmissionController],
  imports: [SoftwareModule, ServicesModule, ChartsModule],
})
export class DataSubmissionModule {}
