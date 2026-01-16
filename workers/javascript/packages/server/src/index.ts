import { RedisClientType } from '@redis/client';
import { HttpServer, MaybeError, shutdownHandlers } from '@superblocks/shared';
import express, { NextFunction, Request, Response } from 'express';
import {
  SUPERBLOCKS_AGENT_PROCESS_ASYNC,
  SUPERBLOCKS_AGENT_REDIS_POOL_FAST_MAX,
  SUPERBLOCKS_AGENT_REDIS_POOL_FAST_MIN,
  SUPERBLOCKS_AGENT_REDIS_POOL_QUEUE_MAX,
  SUPERBLOCKS_AGENT_REDIS_POOL_QUEUE_MIN,
  SUPERBLOCKS_AGENT_REDIS_POOL_SLOW_MAX,
  SUPERBLOCKS_AGENT_REDIS_POOL_SLOW_MIN,
  SUPERBLOCKS_AGENT_REDIS_QUEUE_BATCH_SIZE,
  SUPERBLOCKS_AGENT_STEP_OUTPUT_RETENTION_SECONDS,
  SUPERBLOCKS_WORKER_TLS_INSECURE,
  SUPERBLOCKS_AGENT_REDIS_QUEUE_BLOCK_MS as block,
  SUPERBLOCKS_AGENT_BUCKET as bucket,
  SUPERBLOCKS_AGENT_PLUGIN_EVENTS as events,
  SUPERBLOCKS_AGENT_REDIS_GROUP as group,
  SUPERBLOCKS_WORKER_ID as id,
  SUPERBLOCKS_AGENT_REDIS_KVSTORE_SERVERNAME as kvServername,
  SUPERBLOCKS_AGENT_REDIS_KVSTORE_TOKEN as kvToken,
  SUPERBLOCKS_AGENT_REDIS_KVSTORE_HOST as kvUrl,
  SUPERBLOCKS_AGENT_REDIS_KVSTORE_MAX_SIZE_BYTES as maxBytes,
  SUPERBLOCKS_AGENT_HEALTH_PORT as port,
  SUPERBLOCKS_AGENT_REDIS_SERVERNAME as queueServername,
  SUPERBLOCKS_AGENT_REDIS_TOKEN as queueToken,
  SUPERBLOCKS_AGENT_REDIS_HOST as queueUrl,
  SUPERBLOCKS_TUNNEL_PRIVATE_KEY_ED25519 as secretPrivateKeyEd25519,
  SUPERBLOCKS_TUNNEL_PRIVATE_KEY_RSA as secretPrivateKeyRSA,
  SUPERBLOCKS_AGENT_REDIS_SLOW_CLIENT_THRESHOLD_BYTES as slowThreshold
} from './env';
import logger from './logger';
import { registry } from './metrics';
import { connect } from './redis';
import { Redis } from './store/redis';
import tracer from './tracer';
import { Transport } from './transport';
import { KVStore, RedisConnectionOptions } from './types';

const sanitizeEnvValue = (input) => {
  return input.replaceAll(/\\n/g, '\n');
};

export const secrets = () => {
  const secretStore: Record<string, string> = {};
  secretStore['PRIVATE_KEY_RSA'] = sanitizeEnvValue(secretPrivateKeyRSA);
  secretStore['PRIVATE_KEY_ED25519'] = sanitizeEnvValue(secretPrivateKeyEd25519);
  return secretStore;
};

export const run = async (plugins: Record<string, unknown>): Promise<void> => {
  let transport: Transport;
  let kvstore: KVStore;
  let queue: RedisClientType;

  try {
    const connection: RedisConnectionOptions = {
      name: `kv_${id}`,
      token: kvToken,
      url: kvUrl,
      tls: !SUPERBLOCKS_WORKER_TLS_INSECURE,
      logger,
      servername: kvServername
    };

    kvstore = new Redis({
      client: await connect({
        ...connection,
        ...{
          pool: {
            min: SUPERBLOCKS_AGENT_REDIS_POOL_FAST_MIN,
            max: SUPERBLOCKS_AGENT_REDIS_POOL_FAST_MAX
          }
        }
      }),
      slowClient: await connect({
        ...connection,
        ...{
          delay: true,
          pool: {
            min: SUPERBLOCKS_AGENT_REDIS_POOL_SLOW_MIN,
            max: SUPERBLOCKS_AGENT_REDIS_POOL_SLOW_MAX
          }
        }
      }),
      seconds: SUPERBLOCKS_AGENT_STEP_OUTPUT_RETENTION_SECONDS,
      logger,
      maxBytes,
      slowThreshold
    });
  } catch (err) {
    logger.error({ err }, 'error initializing kvstore');
    process.exit(1);
  }

  try {
    queue = await connect({
      name: `queue_${id}`,
      token: queueToken,
      url: queueUrl,
      tls: !SUPERBLOCKS_WORKER_TLS_INSECURE,
      logger,
      servername: queueServername,
      pool: {
        min: SUPERBLOCKS_AGENT_REDIS_POOL_QUEUE_MIN,
        max: SUPERBLOCKS_AGENT_REDIS_POOL_QUEUE_MAX
      }
    });
  } catch (err) {
    logger.error({ err }, 'error initializing queue');
    process.exit(1);
  }

  try {
    logger.info('starting transport');
    transport = await Transport.init({
      name: id,
      bucket,
      plugins,
      events,
      group,
      agent: 'main',
      batch: SUPERBLOCKS_AGENT_PROCESS_ASYNC ? SUPERBLOCKS_AGENT_REDIS_QUEUE_BATCH_SIZE : 1,
      sync: !SUPERBLOCKS_AGENT_PROCESS_ASYNC,
      kvstore,
      queue,
      block
    });
  } catch (err) {
    logger.error({ err }, 'error initializing transport');
    process.exit(1);
  }

  process.on('uncaughtException', (err: Error) => logger.error({ err }, 'uncaught exception'));

  const router = express.Router();

  const healthHandler = (req: Request, res: Response, next: NextFunction) => {
    res.send({
      uptime: process.uptime(),
      streams: transport ? transport.streams() : []
    });
  };

  router.get('/metrics', async (req: Request, res: Response, next: NextFunction) => {
    res.set('Content-Type', registry.contentType);
    res.send(await registry.metrics());
  });

  router.get('/', healthHandler);
  router.get('/health', healthHandler);

  shutdownHandlers(
    [
      'SIGINT', // CTRL^C
      'SIGTERM', // Kubernetes
      'SIGUSR2' // Nodemon
    ],
    ...[
      transport,
      kvstore,
      {
        close: async (reason?: string): Promise<MaybeError> => {
          if (!queue) {
            return;
          }
          try {
            await queue.quit();
          } catch (err) {
            return err;
          }
        }
      },
      new HttpServer({
        port,
        routes: [
          {
            path: '/',
            handler: router
          }
        ]
      }),
      {
        close: async (reason?: string): Promise<MaybeError> => {
          try {
            await tracer.shutdown();
          } catch (err) {
            return err;
          }
        }
      }
    ]
  );
};

export * from './performance';
export * from './plugin-property';
export * from './tracer';
export * from './types';
