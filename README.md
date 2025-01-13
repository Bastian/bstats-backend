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

| Variable          | Default Value | Description                                        |
| ----------------- | ------------- | -------------------------------------------------- |
| REDIS_USE_CLUSTER | false         | Whether you are using a Redis cluster or not       |
| REDIS_HOST        | 127.0.0.1     | The Redis host or the host of a cluster node       |
| REDIS_PORT        | 6379          | The port of the Redis instance of the cluster node |

## Sharding

If multiple instance of the bStats backend are running as a cluster, you must configure the following environment variables:

| Variable     | Default Value | Description                                    |
| ------------ | ------------- | ---------------------------------------------- |
| SHARD_NUMBER | 0             | The number of the current shard, starting at 0 |
| TOTAL_SHARDS | 1             | The total number of shards                     |

These sharding information is used to divide the load of periodically moving line chart data from Redis into Postgres.
If you do not set the variables, the application will still work properly but have a bottleneck that prevents it from
properly scaling horizontally.

## Global Filter

Sometimes, people try to send fake data to mess up with the displayed data.
While not being perfect, these kind of requests can usually be blocked and logged with a simple word filter.

| Variable       | Default Value           | Description                                                       |
| -------------- | ----------------------- | ----------------------------------------------------------------- |
| WORD_BLOCKLIST | ["I do not like pizza"] | A list of words that should be blocked, formatted as a JSON array |

## Docker Compose

The Docker Compose file allows you to start both the Redis server and the bStats backend itself.
You can simply run `docker-compose up` to start both Redis and bStats.

You can also use `docker-compose up --scale app=0` to only start Redis but not bStats (useful for development).

## License

This project is licensed under the [MIT License](/LICENSE).
