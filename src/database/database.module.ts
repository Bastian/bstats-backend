import { Global, Module } from '@nestjs/common';
import { ConnectionService } from './connection.service';
import { ConfigModule } from '@nestjs/config';
import { PopulatorService } from './populator.service';
import { FirestoreRatelimiterService } from './firestore-ratelimiter.service';
import { UploadUsersService } from './upload-users.service';
import { ChartsModule } from '../charts/charts.module';

@Global()
@Module({
  providers: [
    ConnectionService,
    PopulatorService,
    FirestoreRatelimiterService,
    UploadUsersService,
  ],
  exports: [ConnectionService, FirestoreRatelimiterService],
  imports: [ConfigModule.forRoot(), ChartsModule],
})
export class DatabaseModule {}
