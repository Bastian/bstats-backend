import { install as sourceMapSupportInstall } from 'source-map-support';
import compression from 'fastify-compress';

sourceMapSupportInstall();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as admin from 'firebase-admin';
import { ValidationPipe } from '@nestjs/common';
import { FastifyAdapter } from '@nestjs/platform-fastify';

async function bootstrap() {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: `https://${process.env.FIREBASE_DATABASE_NAME}.firebaseio.com`,
  });
  const app = await NestFactory.create(
    AppModule,
    new FastifyAdapter({ ignoreTrailingSlash: true }),
    {
      cors: true,
    },
  );
  app.useGlobalPipes(
    new ValidationPipe({
      forbidUnknownValues: true,
      whitelist: false,
    }),
  );
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  app.register(compression);
  await app.listen(
    parseInt(process.env.PORT ?? '3001'),
    process.env.HOST ?? '127.0.0.1',
  );
}
bootstrap();
