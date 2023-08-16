import { Injectable, Logger } from '@nestjs/common';
import { ConnectionService } from './connection.service';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

/**
 * Upload local user data to firebase
 *
 * @author yuanlu
 */
@Injectable()
export class UploadUsersService {
  private readonly logger = new Logger(UploadUsersService.name);

  constructor(
    private connectionService: ConnectionService,
    private configService: ConfigService,
  ) {
    const needConvert = configService.get<string>('UPLOAD_USERS') === 'true';
    if (!needConvert) {
      return;
    }

    this.convertUsers();
  }
  /**
   * Transfer the user login information in the database to firebase
   */
  private async convertUsers() {
    // Check if the old data does not exist
    if (
      (await this.connectionService.getRedis().exists('users.usernames')) != 1
    ) {
      return;
    }

    const usernames = await this.connectionService
      .getRedis()
      .smembers('users.usernames');

    if (!usernames || usernames.length <= 0) {
      return;
    }

    this.logger.log(
      `Start importing user data into firebase: ${usernames.length} user(s)`,
    );

    const importSize = 999; // One time import user threshold
    const record: admin.auth.UserImportRecord[] = new Array(importSize);
    const importTimes = Math.ceil(usernames.length / importSize); //Total import times
    let importTimesCount = 0; // Now import times
    let importSuccessCount = 0,
      importFailureCount = 0; // Import status counts

    for (let index = 0; index < usernames.length; index += importSize) {
      const size = Math.min(importSize, usernames.length - index);

      for (let i = 0; i < size; i++) {
        const user = await this.connectionService
          .getRedis()
          .hmget(`users:${usernames[index + i].toLowerCase()}`, [
            'name',
            'password',
          ]);

        if (!user || !user[0] || !user[1]) {
          this.logger.warn(`Bad user data: ${usernames[index + i]} = ${user}`);
          continue;
        }

        const username: string = user[0],
          password: string = user[1];
        record[i] = {
          uid: username,
          email: `${username}@bstats.org`,
          passwordHash: Buffer.from(password),
        };
      }

      admin
        .auth()
        .importUsers(record.slice(0, size), {
          hash: { algorithm: 'BCRYPT' },
        })
        .then((results) => {
          results.errors.forEach((err) => {
            const i = err.index;
            this.logger.warn(
              `Error importing user ${record[i].uid}: ${err.error}`,
            );
          });
          importSuccessCount += results.successCount;
          importFailureCount += results.failureCount;

          if (++importTimesCount >= importTimes) {
            this.logger.log('Finish importing user data to firebase.');
            this.logger.log(
              `${importSuccessCount} user(s) imported successfully, ${importFailureCount} user(s) failed`,
            );
          }
        })
        .catch((error) => {
          this.logger.warn('Error importing users:', error);
        });
    }
  }
}
