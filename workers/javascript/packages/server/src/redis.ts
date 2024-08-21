import { RedisClientOptions, createClient } from '@redis/client';
import { RedisConnectionOptions } from './types';

/**
 * Reconnect strategy for Redis.
 * @param retries The number of retries attempted so far.
 * @returns Wait time in milliseconds prior to attempting a reconnect.
 */
function reconnectStrategy(opts: RedisConnectionOptions): (retries: number) => number | Error {
  return (retries: number): number | Error => {
    opts.logger?.error({ name: opts.name, url: opts.url, retries }, 'attemping reconnection to reddis');
    // TODO(frank): Pull out all of the configuration bells and whistiles.
    //              Add jitter, backoff, etc.
    return 1000;
  };
}

/**
 * A helper for creating a NATs connection. As you can see, it's not
 * hard to create a native connection but here's a helper anyways.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function connect(opts: RedisConnectionOptions): Promise<any> {
  const _clientOptions: RedisClientOptions = {
    // NOTE(frank): This will cause requests to fail when the client is disconnected
    //              rather than being queued up by the client.
    disableOfflineQueue: true,
    name: opts.name,
    database: opts.database,
    readonly: false,
    legacyMode: false,
    socket: {
      host: opts.url,
      port: opts.port || 6379,
      reconnectStrategy: reconnectStrategy(opts),
      noDelay: !opts.delay
    },
    isolationPoolOptions: {
      ...{
        min: 10,
        max: 50
      },
      ...opts.pool
    }
  };

  if (opts.token != '') {
    _clientOptions.password = opts.token;
  }

  if (opts.tls) {
    _clientOptions.socket = {
      ..._clientOptions.socket,
      ...{
        tls: true,
        servername: opts.servername || opts.url
      }
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let client: any;
  {
    try {
      client = createClient(_clientOptions);
    } catch (err) {
      opts.logger?.error({ err }, 'could not create redis client');
      throw err;
    }
  }

  client.on('error', (err) => opts.logger?.error({ err }, 'the redis client emitted an error'));

  try {
    opts.logger?.info({ options: { ..._clientOptions, ...{ password: '<redacted>' } } }, 'attempting connection with options');
    await client.connect();
    opts.logger?.info('connected to redis');
  } catch (err) {
    opts.logger?.error({ err }, 'could not connect to redis');
    throw err;
  }

  return client;
}
