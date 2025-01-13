import { Module } from '@nestjs/common';
import { ServicesModule } from './services/services.module';
import { DatabaseModule } from './database/database.module';
import { SoftwareModule } from './software/software.module';
import { ChartsModule } from './charts/charts.module';
import { DataSubmissionModule } from './data-submission/data-submission.module';
import { LegacyModule } from './legacy/legacy.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ServicesModule,
    DatabaseModule,
    SoftwareModule,
    ChartsModule,
    DataSubmissionModule,
    LegacyModule,
  ],
})
export class AppModule {}
