import {
  HttpException,
  HttpStatus,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as admin from 'firebase-admin';
import { AuthenticatedUser } from './authenticated-user.interface';

@Injectable()
export class FirebaseAuthMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: () => void) {
    const { authorization } = req.headers;

    if (!authorization) {
      next();
      return;
    }

    // Remove "Bearer " prefix
    const token = authorization.replace('Bearer ', '');

    try {
      const verifiedIdToken = await admin.auth().verifyIdToken(token);
      const firebaseUser = await admin.auth().getUser(verifiedIdToken.uid);
      const user: AuthenticatedUser = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        phoneNumber: firebaseUser.phoneNumber,
        disabled: firebaseUser.disabled,
        photoURL: firebaseUser.photoURL,
      };
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      req.user = user;
    } catch (e) {
      throw new HttpException(
        { message: 'Input data validation failed', e },
        HttpStatus.UNAUTHORIZED,
      );
    }

    next();
  }
}
