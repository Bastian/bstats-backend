import { Global, Module } from '@nestjs/common';
import { ConnectionService } from './connection.service';
import { ConfigModule } from '@nestjs/config';
import { PopulatorService } from './populator.service';
import { ChartsModule } from '../charts/charts.module';
import { PostgresService } from './postgres.service';
import { MigrationService } from './migration.service';

@Global()
@Module({
  providers: [
    ConnectionService,
    PopulatorService,
    PostgresService,
    MigrationService,
  ],
  exports: [ConnectionService, PostgresService, MigrationService],
  imports: [ConfigModule.forRoot(), ChartsModule],
})
export class DatabaseModule {}
