import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ServicesModule } from './services/services.module';
import { DatabaseModule } from './database/database.module';
import { FirebaseAuthMiddleware } from './auth/firebase-auth.middleware';
import { SoftwareModule } from './software/software.module';
import { ChartsModule } from './charts/charts.module';

@Module({
  imports: [ServicesModule, DatabaseModule, SoftwareModule, ChartsModule],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(FirebaseAuthMiddleware).forRoutes('*');
  }
}
