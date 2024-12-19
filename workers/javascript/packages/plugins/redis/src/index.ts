import {
  CreateConnection,
  DatabasePlugin,
  DatasourceMetadataDto,
  DestroyConnection,
  ErrorCode,
  ExecutionOutput,
  IntegrationError,
  PluginExecutionProps,
  RawRequest,
  REDIS_DEFAULT_DATABASE_NUMBER,
  RedisActionConfiguration,
  RedisDatasourceConfiguration
} from '@superblocks/shared';
import { RedisPluginV1 } from '@superblocksteam/types';
// NOTE: (joey) idk why the linter is whining about the Create/DestroyConnection import
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Redis from 'ioredis';

export default class RedisPlugin extends DatabasePlugin {
  pluginName = 'Redis';
  protected readonly TEST_CONNECTION_TIMEOUT_MS = 3000;

  private getRedisClient(datasourceConfiguration: RedisDatasourceConfiguration) {
    switch (datasourceConfiguration.connection?.connectionType.case) {
      case 'url':
        return new Redis(datasourceConfiguration.connection?.connectionType.value.urlString);
      case 'fields': {
        const connectionInfo = {
          host: datasourceConfiguration.connection?.connectionType.value.host,
          port: datasourceConfiguration.connection?.connectionType.value.port,
          db: REDIS_DEFAULT_DATABASE_NUMBER
        };

        if (datasourceConfiguration.connection?.connectionType.value.username) {
          connectionInfo['username'] = datasourceConfiguration.connection?.connectionType.value.username;
        }

        if (datasourceConfiguration.connection?.connectionType.value.password) {
          connectionInfo['password'] = datasourceConfiguration.connection?.connectionType.value.password;
        }

        if (datasourceConfiguration.connection?.connectionType.value.databaseNumber) {
          const databaseNumber = Number(datasourceConfiguration.connection?.connectionType.value.databaseNumber);
          if (isNaN(databaseNumber)) {
            throw new IntegrationError(
              `Invalid Database Number (got '${datasourceConfiguration.connection?.connectionType.value.databaseNumber}')`,
              ErrorCode.INTEGRATION_SYNTAX,
              { pluginName: this.pluginName }
            );
          }
          connectionInfo['db'] = databaseNumber;
        }

        if (datasourceConfiguration.connection?.connectionType.value.enableSsl) {
          connectionInfo['tls'] = true;
        }

        return new Redis(connectionInfo);
      }
      default:
        throw new IntegrationError(
          // @ts-ignore
          `No valid connection type received. (got '${datasourceConfiguration.connection?.connectionType.case}')`,
          ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD,
          { pluginName: this.pluginName }
        );
    }
  }

  @CreateConnection
  private async createConnection(datasourceConfiguration: RedisDatasourceConfiguration): Promise<Redis> {
    return this.getRedisClient(datasourceConfiguration);
  }

  @DestroyConnection
  protected async destroyConnection(connection: Redis): Promise<void> {
    connection.disconnect();
  }

  public async execute({
    datasourceConfiguration,
    actionConfiguration,
    mutableOutput,
    context
  }: PluginExecutionProps<RedisDatasourceConfiguration, RedisActionConfiguration>): Promise<ExecutionOutput> {
    const client = await this.createConnection(datasourceConfiguration);
    let response: ExecutionOutput;
    try {
      switch (actionConfiguration.commandType?.case) {
        case 'raw':
          response = await this._handleRawCommand(client, actionConfiguration.commandType.value as RedisPluginV1.Plugin_Raw, mutableOutput);
          break;
        case 'structured':
          response = await this._handleStructuredCommand(client, actionConfiguration.commandType.value as RedisPluginV1.Plugin_Structured);
          break;
        default:
          throw new IntegrationError(
            // @ts-ignore
            `No valid command received. (got '${actionConfiguration.commandType?.case}')`,
            ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD,
            { pluginName: this.pluginName }
          );
      }
    } catch (err) {
      await this.destroyConnection(client);
      if (err instanceof IntegrationError) {
        throw err;
      }
      throw new IntegrationError(err, ErrorCode.UNSPECIFIED, { pluginName: this.pluginName, stack: err.stack });
    }
    await this.destroyConnection(client);
    return response;
  }

  private async _handleRawCommand(client: Redis, raw: RedisPluginV1.Plugin_Raw, mutableOutput: ExecutionOutput): Promise<ExecutionOutput> {
    const ret = new ExecutionOutput();
    const rawAction = raw.action;
    let query;
    switch (rawAction.case) {
      case 'singleton': {
        const rawActionValue = rawAction.value as RedisPluginV1.Plugin_Raw_Singleton;
        query = rawActionValue.query;
        break;
      }
      default:
        // @ts-ignore
        throw new IntegrationError(`Unsupported raw action received: '${rawAction.case}'`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
          pluginName: this.pluginName
        });
    }
    const trimmedCommand = query.trim();

    if (!trimmedCommand) {
      return ret;
    }

    try {
      const parts = trimmedCommand.split(/\s+/);

      // Take the first part as the command and the rest as args
      const command = parts.shift();
      const args = parts;

      // If no command exists after splitting, it means the input was not structured correctly.
      if (!command) {
        throw new IntegrationError(`Invalid command. Received '${trimmedCommand}'`, ErrorCode.INTEGRATION_SYNTAX, {
          pluginName: this.pluginName
        });
      }

      const commandDisplayString = `${command.toUpperCase()}${args.length ? ' ' + args.join(' ') : ''}`;

      mutableOutput.logInfo(`Running command: ${commandDisplayString}`);
      const response = await client.sendCommand(new Redis.Command(command, args));

      // in some cases, we can format the response to make the output easier to consume
      let formattedResponse = response;
      if (response instanceof Buffer) {
        formattedResponse = response.toString('utf8');
      } else if (
        response instanceof Array &&
        response.every((val) => {
          return val instanceof Buffer;
        })
      ) {
        const strValues: string[] = [];
        for (const foo of response) {
          strValues.push(foo.toString('utf8'));
        }
        formattedResponse = strValues;
      }

      ret.output = { response: formattedResponse };
    } catch (error) {
      throw this._handleError(error, 'Error executing command');
    }

    return ret;
  }

  private async _handleStructuredCommand(client: Redis, structured: RedisPluginV1.Plugin_Structured): Promise<ExecutionOutput> {
    const ret = new ExecutionOutput();
    let response;
    const verbAction = structured.action;

    switch (verbAction.case) {
      case 'get':
        response = await client.get((verbAction.value as RedisPluginV1.Plugin_Get).key);
        break;

      case 'set': {
        const setCmd = verbAction.value as RedisPluginV1.Plugin_Set;
        if (setCmd.expirationMs) {
          response = await client.set(setCmd.key, setCmd.value, 'PX', setCmd.expirationMs);
        } else {
          response = await client.set(setCmd.key, setCmd.value);
        }
        break;
      }
      case 'del':
        response = await client.del((verbAction.value as RedisPluginV1.Plugin_Del).key);
        break;

      case 'keys':
        response = await client.keys((verbAction.value as RedisPluginV1.Plugin_Keys).pattern);
        break;

      case 'mget':
        response = await client.mget(this._getListFromString((verbAction.value as RedisPluginV1.Plugin_Mget).keys));
        break;

      case 'hget': {
        const hgetCmd = verbAction.value as RedisPluginV1.Plugin_Hget;
        response = await client.hget(hgetCmd.key, hgetCmd.field);
        break;
      }
      case 'hmget': {
        const hmgetCmd = verbAction.value as RedisPluginV1.Plugin_Hmget;
        response = await client.hmget(hmgetCmd.key, ...this._getListFromString(hmgetCmd.fields));
        break;
      }
      case 'hgetall':
        response = await client.hgetall((verbAction.value as RedisPluginV1.Plugin_Hgetall).key);
        break;

      case 'hset': {
        const hsetCmd = verbAction.value as RedisPluginV1.Plugin_Hset;
        response = await client.hset(hsetCmd.key, hsetCmd.field, hsetCmd.value);
        break;
      }
      case 'hsetnx': {
        const hsetnxCmd = verbAction.value as RedisPluginV1.Plugin_Hsetnx;
        response = await client.hsetnx(hsetnxCmd.key, hsetnxCmd.field, hsetnxCmd.value);
        break;
      }
      case 'hlen':
        response = await client.hlen((verbAction.value as RedisPluginV1.Plugin_Hlen).key);
        break;

      case 'hdel': {
        const hdelCmd = verbAction.value as RedisPluginV1.Plugin_Hdel;
        response = await client.hdel(hdelCmd.key, hdelCmd.field);
        break;
      }
      case 'hkeys':
        response = await client.hkeys((verbAction.value as RedisPluginV1.Plugin_Hkeys).key);
        break;

      case 'hvals':
        response = await client.hvals((verbAction.value as RedisPluginV1.Plugin_Hvals).key);
        break;

      case 'lindex': {
        const lindexCmd = verbAction.value as RedisPluginV1.Plugin_Lindex;
        response = await client.lindex(lindexCmd.key, lindexCmd.index);
        break;
      }
      case 'llen':
        response = await client.llen((verbAction.value as RedisPluginV1.Plugin_Llen).key);
        break;

      case 'lpush':
        response = await client.lpush(
          (verbAction.value as RedisPluginV1.Plugin_Lpush).key,
          (verbAction.value as RedisPluginV1.Plugin_Lpush).value
        );
        break;

      case 'lrem': {
        const lremCmd = verbAction.value as RedisPluginV1.Plugin_Lrem;
        response = await client.lrem(lremCmd.key, lremCmd.count, lremCmd.value);
        break;
      }
      case 'lrange': {
        const lrangeCmd = verbAction.value as RedisPluginV1.Plugin_Lrange;
        response = await client.lrange(lrangeCmd.key, lrangeCmd.start, lrangeCmd.stop);
        break;
      }
      case 'sadd':
        response = await client.sadd(
          (verbAction.value as RedisPluginV1.Plugin_Sadd).key,
          (verbAction.value as RedisPluginV1.Plugin_Sadd).member
        );
        break;

      case 'scard':
        response = await client.scard((verbAction.value as RedisPluginV1.Plugin_Scard).key);
        break;

      case 'smembers':
        response = await client.smembers((verbAction.value as RedisPluginV1.Plugin_Smembers).key);
        break;

      case 'sismember':
        response = await client.sismember(
          (verbAction.value as RedisPluginV1.Plugin_Sismember).key,
          (verbAction.value as RedisPluginV1.Plugin_Sismember).member
        );
        break;

      case 'srandmember': {
        const srandmemberCmd = verbAction.value as RedisPluginV1.Plugin_Srandmember;
        if (srandmemberCmd.count) {
          response = await client.srandmember(srandmemberCmd.key, srandmemberCmd.count);
        } else {
          response = await client.srandmember(srandmemberCmd.key);
        }
        break;
      }
      case 'srem':
        response = await client.srem(
          (verbAction.value as RedisPluginV1.Plugin_Srem).key,
          (verbAction.value as RedisPluginV1.Plugin_Srem).member
        );
        break;

      case 'zadd': {
        const zaddCmd = verbAction.value as RedisPluginV1.Plugin_Zadd;
        response = await client.zadd(zaddCmd.key, zaddCmd.score, zaddCmd.member);
        break;
      }
      case 'zcard':
        response = await client.zcard((verbAction.value as RedisPluginV1.Plugin_Zcard).key);
        break;

      case 'zcount': {
        const zcountCmd = verbAction.value as RedisPluginV1.Plugin_Zcount;
        response = await client.zcount(zcountCmd.key, zcountCmd.min, zcountCmd.max);
        break;
      }
      case 'zrange': {
        const zrangeCmd = verbAction.value as RedisPluginV1.Plugin_Zrange;
        response = await client.zrange(zrangeCmd.key, zrangeCmd.start, zrangeCmd.stop);
        break;
      }
      case 'zrank':
        response = await client.zrank(
          (verbAction.value as RedisPluginV1.Plugin_Zrank).key,
          (verbAction.value as RedisPluginV1.Plugin_Zrank).member
        );
        break;

      case 'zrem':
        response = await client.zrem(
          (verbAction.value as RedisPluginV1.Plugin_Zrem).key,
          (verbAction.value as RedisPluginV1.Plugin_Zrem).member
        );
        break;

      case 'zscore':
        response = await client.zscore(
          (verbAction.value as RedisPluginV1.Plugin_Zscore).key,
          (verbAction.value as RedisPluginV1.Plugin_Zscore).member
        );
        break;

      case 'expire': {
        const expireCmd = verbAction.value as RedisPluginV1.Plugin_Expire;
        switch (expireCmd.option) {
          case RedisPluginV1.Plugin_Expire_Option.NX:
            response = await client.expire(expireCmd.key, expireCmd.seconds, 'NX');
            break;
          case RedisPluginV1.Plugin_Expire_Option.XX:
            response = await client.expire(expireCmd.key, expireCmd.seconds, 'XX');
            break;
          case RedisPluginV1.Plugin_Expire_Option.GT:
            response = await client.expire(expireCmd.key, expireCmd.seconds, 'GT');
            break;
          case RedisPluginV1.Plugin_Expire_Option.LT:
            response = await client.expire(expireCmd.key, expireCmd.seconds, 'LT');
            break;
          default:
            response = await client.expire(expireCmd.key, expireCmd.seconds);
        }
        break;
      }
      case 'ttl':
        response = await client.ttl((verbAction.value as RedisPluginV1.Plugin_Ttl).key);
        break;

      default:
        // @ts-ignore
        throw new IntegrationError(`Unsupported command received: '${verbAction.case}'`, ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
          pluginName: this.pluginName
        });
    }

    ret.output = response;
    return ret;
  }

  private _getListFromString(str: string): string[] {
    // "foo,bar" -> ["foo", "bar"]
    // "foo,   bar" -> ["foo", "bar"]
    return str.split(',').map((item) => item.trim());
  }

  public getRequest(actionConfiguration: RedisActionConfiguration): RawRequest {
    return ''; // NOTE: (joey) do we need this?
  }

  public dynamicProperties(): string[] {
    return [
      'commandType.value.command',
      'commandType.value.verbAction.value.key',
      'commandType.value.verbAction.value.value',
      // 'commandType.value.verbAction.value.expirationMs',
      'commandType.value.verbAction.value.pattern',
      // 'commandType.value.verbAction.value.seconds',
      'commandType.value.verbAction.value.option',
      'commandType.value.verbAction.value.keys',
      'commandType.value.verbAction.value.field',
      'commandType.value.verbAction.value.fields',
      // 'commandType.value.verbAction.value.index',
      // 'commandType.value.verbAction.value.count',
      // 'commandType.value.verbAction.value.start',
      'commandType.value.verbAction.value.member'
      // 'commandType.value.verbAction.value.score',
      // 'commandType.value.verbAction.value.min',
      // 'commandType.value.verbAction.value.max'
    ];
  }

  public async metadata(datasourceConfiguration: RedisDatasourceConfiguration): Promise<DatasourceMetadataDto> {
    return Promise.resolve({});
  }

  public async test(datasourceConfiguration: RedisDatasourceConfiguration): Promise<void> {
    let client;

    try {
      client = await this.createConnection(datasourceConfiguration);
      await Promise.race([
        client.ping(),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error(`Connection timed out after ${this.TEST_CONNECTION_TIMEOUT_MS}ms.`)),
            this.TEST_CONNECTION_TIMEOUT_MS
          )
        )
      ]);

      await this.destroyConnection(client);
    } catch (error) {
      await this.destroyConnection(client);
      throw this._handleError(error, 'Test connection failed');
    }
  }

  private _handleError(error: Error, initialMessage: string): IntegrationError {
    if (error instanceof IntegrationError) {
      return new IntegrationError(`${initialMessage}: ${error.message}`, (error as IntegrationError).code);
    }

    const message = `${initialMessage}: ${error.message}`;

    const errorMap: Record<string, ErrorCode> = {
      ['connect']: ErrorCode.INTEGRATION_NETWORK,
      ['invalid username']: ErrorCode.INTEGRATION_AUTHORIZATION,
      ['wrong number']: ErrorCode.INTEGRATION_SYNTAX,
      ['unknown command']: ErrorCode.INTEGRATION_SYNTAX
    };

    for (const key of Object.keys(errorMap)) {
      if (error.message.toLowerCase().includes(key)) {
        return new IntegrationError(message, errorMap[key], { pluginName: this.pluginName });
      }
    }

    return new IntegrationError(message, ErrorCode.UNSPECIFIED, { pluginName: this.pluginName, stack: error.stack });
  }
}
