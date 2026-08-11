import { install as sourceMapSupportInstall } from 'source-map-support';

sourceMapSupportInstall();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { MigrationService } from './database/migration.service';

function swagger(app) {
  const options = new DocumentBuilder()
    .setTitle('API List')
    .setDescription('bstats-backend API list')
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('/api-list', app, document);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  // Before app.listen(), so neither an HTTP request nor a cron job can hit the
  // database before the schema is up to date. Failing here on purpose: the
  // application must not run against a schema it does not know.
  await app.get(MigrationService).migrate();

  swagger(app);
  app.useGlobalPipes(
    new ValidationPipe({
      forbidUnknownValues: true,
      whitelist: false,
    }),
  );
  await app.listen(parseInt(process.env.PORT ?? '3001'));
}
bootstrap();
