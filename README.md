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

bStats uses Firebase Auth for authentication and Firestore to store historic line chart data.
Thus, you have to create a [Firebase](https://firebase.google.com/) project and set the following environment variables:

| Variable                       | Default Value               | Description |
| ------------------------------ | --------------------------- | ----------- |
| GOOGLE_APPLICATION_CREDENTIALS | ./service-account-file.json | The path to your service account file (Can be downloaded from the Firebase Console) |
| FIREBASE_DATABASE_NAME         | bstats-testing              | The id of your firebase project |

## Sharding

If multiple instance of the bStats backend are running as a cluster, you must configure the following environment variables:

| Variable     | Default Value | Description |
| -------------| ------------- | ----------- |
| SHARD_NUMBER | 0             | The number of the current shard, starting at 0 |
| TOTAL_SHARDS | 1             | The total number of shards |

These sharding information is used to divide the load of periodically moving line chart data from Redis into Firestore.
If you do not set the variables, the application will still work properly but have a bottleneck that prevents it from
properly scaling horizontally.

## Docker Compose

The Docker Compose file allows you to start both the Redis server and the bStats backend itself.
You can simply run `docker-compose up` to start both Redis and bStats.

You can also use `docker-compose up --scale app=0` to only start Redis but not bStats (useful for development).

## Bankruptcy Protection

SaaS with a pay-as-you-go model like Firestore is very scary because a single mistake (e.g., an infinite loop) can
easily accumulate an enormous amount of writes or reads that may cost you a shit ton of money in a very short time.
Noone likes to go to bed and
[wake up with a $30,356.56 dollar bill](https://hackernoon.com/how-we-spent-30k-usd-in-firebase-in-less-than-72-hours-307490bd24d)
the next day because of a programming error or some idiot starting a DDoS attack on your service.

To prevent incidents like these, you can set the following environment variables that limit the amount of writes and
reads that bStats performs per 30 minutes:

| Variable                            | Default Value |
| ------------------------------------| ------------- |
| MAX_FIRESTORE_READS_PER_30_MINUTES  | 150000        |
| MAX_FIRESTORE_WRITES_PER_30_MINUTES | 150000        |

The limits should be set to something, that's high enough to not trigger any false positives but still low enough to
protect you from ending up on the street because you had to sell your house. The default settings allow for a maximum
spending of $0.36 per 30 minutes which would be $17.28 per day or ~$520 per month if you didn't notice the bug.

**Disclaimer**: Unfortunately, Firebase does not allow you to set any limits (why?!?), that's why this limit is enforced
by incrementing a number in Redis and manually checking it on every write or read. This is not optimal for two reasons:
1. This is a bottleneck because it's using a single field in Redis and thus limits horizontal scaling. However, this is
   more of a theoretical limit because Redis is super fast and can easily handle over 100k Ops/Second. If bStats ever
   grows large enough that it can afford 100k Firestore Reads ($155k / month) or Writes ($466k / month) per second, we
   can discuss this issue again in my mansion.
2. This is a more serious issue: Developers are humans, too. This means that it can be forgotten to perform this
   manual check and thus accidentally bypass the ratelimiting. However, as long as Google does not add native support
   for ratelimiting Firestore reads and writes, this is better than nothing.

## License

This project is licensed under the [MIT License](/LICENSE).
