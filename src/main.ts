import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as admin from 'firebase-admin';

async function bootstrap() {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: `https://${process.env.FIREBASE_DATABASE_NAME}.firebaseio.com`,
  });
  const app = await NestFactory.create(AppModule, { cors: true });
  await app.listen(3001);
}
bootstrap();
