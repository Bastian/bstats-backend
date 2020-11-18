import { Global, Module } from '@nestjs/common';
import { ConnectionService } from './connection.service';
import { ConfigModule } from '@nestjs/config';
import { PopulatorService } from './populator.service';

@Global()
@Module({
  providers: [ConnectionService, PopulatorService],
  exports: [ConnectionService],
  imports: [ConfigModule.forRoot()],
})
export class DatabaseModule {}
