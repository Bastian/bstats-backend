import { install as sourceMapSupportInstall } from 'source-map-support';

sourceMapSupportInstall();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as admin from 'firebase-admin';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

function swagger(app){
  const options = new DocumentBuilder()
    .setTitle('API List')
    .setDescription('bstats-backend API list')
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('/api-list', app, document);
}

async function bootstrap() {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: `https://${process.env.FIREBASE_DATABASE_NAME}.firebaseio.com`,
  });
  const app = await NestFactory.create(AppModule, { cors: true });
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
