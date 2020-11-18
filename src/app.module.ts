import { Module } from '@nestjs/common';
import { ServicesModule } from './services/services.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [ServicesModule, DatabaseModule],
})
export class AppModule {}
