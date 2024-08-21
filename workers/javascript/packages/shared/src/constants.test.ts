import { CosmosDbPluginV1, RedisPluginV1, SalesforcePluginV1 } from '@superblocksteam/types/src/plugins';
import {
  PLUGIN_ID_TO_PROTO_ACTION_CONFIGURATION_OBJECT_CALLABLE,
  PLUGIN_ID_TO_PROTO_DATASOURCE_CONFIGURATION_OBJECT_CALLABLE
} from './constants';

describe('redis plugin de-serialize', () => {
  test('redis action config', () => {
    const noCommand = {
      connection: {
        url: {
          urlString: 'this.is.test.url'
        }
      }
    };
    const protoNoCommand = PLUGIN_ID_TO_PROTO_ACTION_CONFIGURATION_OBJECT_CALLABLE['redis'](noCommand);
    expect(protoNoCommand.commandType.case).toBeUndefined();

    const withCommand = {
      structured: {
        get: {
          key: 'awef'
        }
      }
    };
    const protoWithCommand = PLUGIN_ID_TO_PROTO_ACTION_CONFIGURATION_OBJECT_CALLABLE['redis'](withCommand);
    expect(protoWithCommand.commandType.case).toEqual('structured');

    const pluginStructured = protoWithCommand.commandType.value as RedisPluginV1.Plugin_Structured;
    expect(pluginStructured.action.case).toEqual('get');
  });

  test('redis datasource config', () => {
    const config = {
      connection: {
        url: {
          urlString: 'this.is.test.url'
        }
      }
    };
    const proto = PLUGIN_ID_TO_PROTO_DATASOURCE_CONFIGURATION_OBJECT_CALLABLE['redis'](config);
    const connectionProto = proto.connection as RedisPluginV1.Plugin_Connection;
    expect(connectionProto.connectionType.case).toEqual('url');
  });
});
describe('salesforce plugin de-serialize', () => {
  test('salesforce datasource config', () => {
    const config = {
      authConfig: {
        useFixedPasswordCreds: true,
        authToken: '{{oauth.token}}',
        authType: 'password'
      },
      connection: {
        auth: {
          passwordGrantFlow: {
            clientId: 'client id',
            clientSecret: 'client secret',
            tokenUrl: 'url',
            password: 'password',
            username: 'username'
          }
        },
        instanceUrl: 'https://domain.sandbox.my.salesforce.com/'
      },
      name: 'test sfdc plugin'
    };
    const proto = PLUGIN_ID_TO_PROTO_DATASOURCE_CONFIGURATION_OBJECT_CALLABLE['salesforce'](config) as SalesforcePluginV1.Plugin;

    expect(proto.connection?.auth).toBeDefined();
    expect(proto.connection?.instanceUrl).toEqual('https://domain.sandbox.my.salesforce.com/');
  });

  test('salesforce action config', () => {
    const config = {
      authConfig: {
        useFixedPasswordCreds: true,
        authToken: '{{oauth.token}}',
        authType: 'password'
      },
      soql: {
        sqlBody: 'select Id from Contact limit 200'
      }
    };
    const proto = PLUGIN_ID_TO_PROTO_ACTION_CONFIGURATION_OBJECT_CALLABLE['salesforce'](config) as SalesforcePluginV1.Plugin;
    expect(proto.salesforceAction.case).toEqual('soql');
  });
});

describe('cosmosdb plugin de-serialize', () => {
  test('cosmosdb action config', () => {
    const noCommand = {
      connection: {
        host: 'this.is.test.url',
        port: 443,
        databaseId: 'this.is.a.test.db',
        auth: {
          key: {
            masterKey: 'this.is.a.test.key'
          }
        }
      }
    };
    const protoNoCommand = PLUGIN_ID_TO_PROTO_ACTION_CONFIGURATION_OBJECT_CALLABLE['cosmosdb'](noCommand);
    expect(protoNoCommand.cosmosdbAction.case).toBeUndefined();

    const withCommand = {
      sql: {
        singleton: {
          containerId: 'this.is.a.test.container',
          query: 'this.is.a.test.query',
          crossPartition: true,
          partitionKey: 'this.is.a.test.partition.key'
        }
      }
    };
    const protoWithCommand = PLUGIN_ID_TO_PROTO_ACTION_CONFIGURATION_OBJECT_CALLABLE['cosmosdb'](withCommand);
    expect(JSON.parse(JSON.stringify(protoWithCommand))).toEqual({
      cosmosdbAction: {
        case: 'sql',
        value: {
          singleton: {
            containerId: 'this.is.a.test.container',
            query: 'this.is.a.test.query',
            crossPartition: true,
            partitionKey: 'this.is.a.test.partition.key'
          }
        }
      }
    });
    expect(protoWithCommand.cosmosdbAction.case).toEqual('sql');

    const pluginStructured = protoWithCommand.cosmosdbAction.value as CosmosDbPluginV1.Plugin_Sql;
    expect(pluginStructured.action.case).toEqual('singleton');
  });

  test('cosmosdb datasource config', () => {
    const config = {
      connection: {
        host: 'this.is.test.url',
        port: 443,
        databaseId: 'this.is.a.test.db',
        auth: {
          key: {
            masterKey: 'this.is.a.test.key'
          }
        }
      }
    };
    const proto = PLUGIN_ID_TO_PROTO_DATASOURCE_CONFIGURATION_OBJECT_CALLABLE['cosmosdb'](config);
    const connectionProto = proto.connection as CosmosDbPluginV1.Plugin_CosmosDbConnection;
    expect(JSON.parse(JSON.stringify(connectionProto))).toEqual({
      host: 'this.is.test.url',
      port: 443,
      databaseId: 'this.is.a.test.db',
      auth: {
        key: {
          masterKey: 'this.is.a.test.key'
        }
      }
    });
  });
});
