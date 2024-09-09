import { KinesisActionConfiguration, KinesisDatasourceConfiguration } from '@superblocks/shared';
import { expect, it } from '@jest/globals';
import {
  actionConfigurationToRecords,
  acGetToGetShardIteratorCommand,
  getKinesisClientConfigFromDatasourceConfig,
  configFromShardIteratorType
} from './utils';

import { KinesisPluginV1 as Plugin } from '@superblocksteam/types';

describe('actionConfigurationToRecords happy path', () => {
  it.each([
    {
      description: 'converts string data to Uint8Array correctly',
      actionConfiguration: new Plugin.Plugin({
        operation: {
          case: 'put',
          value: { partitionKey: 'pk', data: `[{"foo": "bar"}]` }
        }
      }),
      expectedRecords: [
        {
          Data: new Uint8Array([123, 34, 102, 111, 111, 34, 58, 34, 98, 97, 114, 34, 125]),
          PartitionKey: 'pk'
        }
      ]
    }
  ])('$description', ({ actionConfiguration, expectedRecords }) => {
    expect(actionConfigurationToRecords(actionConfiguration as KinesisActionConfiguration)).toEqual(expectedRecords);
  });
});

describe('actionConfigurationToRecords errors', () => {
  it.each([
    {
      description: 'no partition key',
      actionConfiguration: new Plugin.Plugin({
        operation: {
          case: 'put',
          value: { data: `[{"foo": "bar"}]` }
        }
      }),
      expectedErrorMessage: 'partitionKey is required'
    },
    {
      description: 'no data',
      actionConfiguration: new Plugin.Plugin({
        operation: {
          case: 'put',
          value: { partitionKey: 'pk' }
        }
      }),
      expectedErrorMessage: 'data is required'
    },
    {
      description: 'data is not valid json',
      actionConfiguration: new Plugin.Plugin({
        operation: {
          case: 'put',
          value: { partitionKey: 'pk', data: 'foo' }
        }
      }),
      expectedErrorMessage: 'could not parse data as JSON'
    },
    {
      description: 'data is not an array',
      actionConfiguration: new Plugin.Plugin({
        operation: {
          case: 'put',
          value: { partitionKey: 'pk', data: '{}' }
        }
      }),
      expectedErrorMessage: 'data must be a JSON array'
    }
  ])('$description', ({ actionConfiguration, expectedErrorMessage }) => {
    expect(() => {
      actionConfigurationToRecords(actionConfiguration as KinesisActionConfiguration);
    }).toThrow(expectedErrorMessage);
  });
});

describe('acGetToGetShardIteratorCommand happy path', () => {
  it.each([
    {
      description: 'with stream name',
      acGet: {
        shardIteratorType: Plugin.Plugin_ShardIteratorType.TRIM_HORIZON,
        streamIdentifier: { value: 'sn', case: 'streamName' },
        shardId: 'si'
      },
      expectedOutput: { ShardIteratorType: 'TRIM_HORIZON', ShardId: 'si', StreamName: 'sn' }
    },
    {
      description: 'with stream arn',
      acGet: {
        shardIteratorType: Plugin.Plugin_ShardIteratorType.TRIM_HORIZON,
        streamIdentifier: { value: 'sa', case: 'streamArn' },
        shardId: 'si'
      },
      expectedOutput: { ShardIteratorType: 'TRIM_HORIZON', ShardId: 'si', StreamARN: 'sa' }
    }
  ])('$description', ({ acGet, expectedOutput }) => {
    expect(acGetToGetShardIteratorCommand(acGet as Plugin.Plugin_KinesisGet)).toEqual(expectedOutput);
  });
});

describe('acGetToGetShardIteratorCommand throws', () => {
  it.each([
    {
      description: 'with invalid shard iterator type',
      acGet: {
        shardIteratorType: Plugin.Plugin_ShardIteratorType.UNSPECIFIED,
        streamIdentifier: { value: 'sn', case: 'streamName' },
        shardId: 'si'
      },
      expectedErrorMessage: 'unknown shardIteratorType: 0'
    }
  ])('$description', ({ acGet, expectedErrorMessage }) => {
    expect(() => {
      acGetToGetShardIteratorCommand(acGet as Plugin.Plugin_KinesisGet);
    }).toThrow(expectedErrorMessage);
  });
});

describe('getKinesisClientConfigFromDatasourceConfig happy path', () => {
  it.each([
    {
      description: 'with endpoint',
      datasourceConfiguration: {
        connection: {
          awsConfig: {
            region: 'region',
            endpoint: 'endpoint',
            auth: {
              accessKeyId: 'accessKeyId',
              secretKey: 'secretKey'
            }
          }
        }
      },
      expectedClient: {
        credentials: {
          accessKeyId: 'accessKeyId',
          secretAccessKey: 'secretKey'
        },
        endpoint: 'endpoint',
        region: 'region'
      }
    }
  ])('$description', ({ datasourceConfiguration, expectedClient }) => {
    expect(getKinesisClientConfigFromDatasourceConfig(datasourceConfiguration as KinesisDatasourceConfiguration)).toEqual(expectedClient);
  });
});

describe('getKinesisClientConfigFromDatasourceConfig throws', () => {
  it.each([
    {
      description: 'missing required fields',
      datasourceConfiguration: {
        connection: {
          awsConfig: {
            endpoint: 'endpoint'
          }
        }
      },
      expectedErrorMessage: 'missing required fields: region,accessKeyId,secretKey'
    }
  ])('$description', ({ datasourceConfiguration, expectedErrorMessage }) => {
    expect(() => {
      getKinesisClientConfigFromDatasourceConfig(datasourceConfiguration as KinesisDatasourceConfiguration);
    }).toThrow(expectedErrorMessage);
  });
});

describe('configFromShardIteratorType happy path', () => {
  it.each([
    {
      description: 'trim horizon',
      acGet: { shardIteratorType: Plugin.Plugin_ShardIteratorType.TRIM_HORIZON },
      expectedConfig: { ShardIteratorType: 'TRIM_HORIZON' }
    },
    {
      description: 'latest',
      acGet: { shardIteratorType: Plugin.Plugin_ShardIteratorType.LATEST },
      expectedConfig: { ShardIteratorType: 'LATEST' }
    },
    {
      description: 'at timestamp',
      acGet: { shardIteratorType: Plugin.Plugin_ShardIteratorType.AT_TIMESTAMP, timestamp: '2016-04-04T19:58:46.480-00:00' },
      expectedConfig: { ShardIteratorType: 'AT_TIMESTAMP', Timestamp: new Date('2016-04-04T19:58:46.480-00:00') }
    },
    {
      description: 'at sequence number',
      acGet: { shardIteratorType: Plugin.Plugin_ShardIteratorType.AT_SEQUENCE_NUMBER, startingSequenceNumber: '12345' },
      expectedConfig: { ShardIteratorType: 'AT_SEQUENCE_NUMBER', StartingSequenceNumber: '12345' }
    },
    {
      description: 'after sequence number',
      acGet: { shardIteratorType: Plugin.Plugin_ShardIteratorType.AFTER_SEQUENCE_NUMBER, startingSequenceNumber: '12345' },
      expectedConfig: { ShardIteratorType: 'AFTER_SEQUENCE_NUMBER', StartingSequenceNumber: '12345' }
    }
  ])('$description', ({ acGet, expectedConfig }) => {
    expect(configFromShardIteratorType(acGet as Plugin.Plugin_KinesisGet)).toEqual(expectedConfig);
  });
});

describe('convertShardIteratorType throws', () => {
  it.each([
    {
      description: 'unknown shard iterator type',
      acGet: { shardIteratorType: Plugin.Plugin_ShardIteratorType.UNSPECIFIED },
      expectedErrorMessage: 'unknown shardIteratorType: 0'
    },
    {
      description: 'at timestamp with no timestamp',
      acGet: { shardIteratorType: Plugin.Plugin_ShardIteratorType.AT_TIMESTAMP },
      expectedErrorMessage: 'timestamp required for shardIteratorType AT_TIMESTAMP'
    },
    {
      description: 'at sequence number with no starting sequence number',
      acGet: { shardIteratorType: Plugin.Plugin_ShardIteratorType.AT_SEQUENCE_NUMBER },
      expectedErrorMessage: 'startingSequeceNumber required for shardIteratorType AT_SEQUENCE_NUMBER'
    },
    {
      description: 'after sequence number with no starting sequence number',
      acGet: { shardIteratorType: Plugin.Plugin_ShardIteratorType.AFTER_SEQUENCE_NUMBER },
      expectedErrorMessage: 'startingSequeceNumber required for shardIteratorType AFTER_SEQUENCE_NUMBER'
    }
  ])('$description', ({ acGet, expectedErrorMessage }) => {
    expect(() => {
      configFromShardIteratorType(acGet as Plugin.Plugin_KinesisGet);
    }).toThrow(expectedErrorMessage);
  });
});
