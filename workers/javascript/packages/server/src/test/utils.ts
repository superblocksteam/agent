import { RedisClientType } from '@redis/client';
import { ExecutionContext, RelayDelegate } from '@superblocks/shared';
import { randomUUID } from 'crypto';
import pino from 'pino';
import { connect } from '../redis';
import { BindingType, ExecuteRequest, RedisConnectionOptions } from '../types';
import {
    SUPERBLOCKS_AGENT_REDIS_HOST,
    SUPERBLOCKS_AGENT_REDIS_KVSTORE_HOST,
    SUPERBLOCKS_AGENT_REDIS_KVSTORE_PORT,
    SUPERBLOCKS_AGENT_REDIS_KVSTORE_SERVERNAME,
    SUPERBLOCKS_AGENT_REDIS_KVSTORE_TOKEN,
    SUPERBLOCKS_AGENT_REDIS_PORT,
    SUPERBLOCKS_AGENT_REDIS_SERVERNAME,
    SUPERBLOCKS_AGENT_REDIS_TOKEN,
    SUPERBLOCKS_AGENT_TLS_INSECURE
} from './env';

export enum REDIS_CLIENT_TYPE {
  QUEUE,
  KVSTORE
}

export async function client(who: REDIS_CLIENT_TYPE): Promise<RedisClientType> {
  let options: RedisConnectionOptions;

  switch (who) {
    case REDIS_CLIENT_TYPE.KVSTORE:
      options = {
        name: `queue_${randomUUID()}`,
        url: SUPERBLOCKS_AGENT_REDIS_KVSTORE_HOST,
        port: SUPERBLOCKS_AGENT_REDIS_KVSTORE_PORT,
        token: SUPERBLOCKS_AGENT_REDIS_KVSTORE_TOKEN,
        servername: SUPERBLOCKS_AGENT_REDIS_KVSTORE_SERVERNAME,
        tls: !SUPERBLOCKS_AGENT_TLS_INSECURE,
        logger: pino()
      };
      break;
    case REDIS_CLIENT_TYPE.QUEUE:
      options = {
        name: `kv_${randomUUID()}`,
        url: SUPERBLOCKS_AGENT_REDIS_HOST,
        port: SUPERBLOCKS_AGENT_REDIS_PORT,
        token: SUPERBLOCKS_AGENT_REDIS_TOKEN,
        servername: SUPERBLOCKS_AGENT_REDIS_SERVERNAME,
        tls: !SUPERBLOCKS_AGENT_TLS_INSECURE,
        logger: pino()
      };
      break;
    default:
      throw Error("I'm not sure what you're trying to do");
  }

  return await connect(options);
}

export function code(executionId: string, stepName: string, data: string): ExecuteRequest {
  return {
    props: {
      executionId: executionId,
      stepName: stepName,
      bindingKeys: [
        { key: 'coinbase', type: BindingType.Global },
        { key: 'okex', type: BindingType.Global }
      ],
      environment: 'production',
      context: new ExecutionContext(),
      redactedContext: new ExecutionContext(),
      agentCredentials: {},
      redactedDatasourceConfiguration: {},
      actionConfiguration: {
        body: data,
        spreadsheetId: '',
        sheetTitle: ''
      },
      datasourceConfiguration: {},
      files: {},
      recursionContext: {
        executedWorkflowsPath: [],
        isEvaluatingDatasource: false
      },
      relayDelegate: new RelayDelegate({
        body: {
          relays: {}
        }
      })
    }
  };
}
