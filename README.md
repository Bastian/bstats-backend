# bStats Backend

## Description

This repository contains the code for the bStats backend.

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Redis

The bStats backend requires a running Redis instance or cluster.
For local development, you can start a Redis instance with Docker Compose by running `docker-compose up --scale app=0`.

If you want to provide your own Redis instance or cluster (e.g., for production), you can configure Redis with the
following environment variables:

| Variable          | Default Value | Description |
| ----------------- | ------------- | ----------- |
| REDIS_USE_CLUSTER | false         | Whether you are using a Redis cluster or not |
| REDIS_HOST        | 127.0.0.1     | The Redis host or the host of a cluster node |
| REDIS_PORT        | 6379          | The port of the Redis instance of the cluster node |


## Firebase

bStats uses Firebase Auth for authentication.
Thus, you have to create a [Firebase](https://firebase.google.com/) project and set the following environment variables:

| Variable                       | Default Value               | Description |
| ------------------------------ | --------------------------- | ----------- |
| GOOGLE_APPLICATION_CREDENTIALS | ./service-account-file.json | The path to your service account file (Can be downloaded from the Firebase Console) |
| FIREBASE_DATABASE_NAME         | bstats-cfca9                | The id of your firebase project |


## Docker Compose

The Docker Compose file allows you to start both the Redis server and the bStats backend itself.
You can simply run `docker-compose up` to start both Redis and bStats.

You can also use `docker-compose up --scale app=0` to only start Redis but not bStats (useful for development).
