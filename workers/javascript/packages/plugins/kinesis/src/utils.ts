import { PutRecordsRequestEntry, KinesisClientConfig, GetShardIteratorCommandInput, ShardIteratorType } from '@aws-sdk/client-kinesis';
import { KinesisActionConfiguration, KinesisDatasourceConfiguration, IntegrationError } from '@superblocks/shared';

import { KinesisPluginV1 as Plugin } from '@superblocksteam/types';

// https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/kinesis/command/PutRecordsCommand/
// this will only ever be called for PUT
export function actionConfigurationToRecords(actionConfiguration: KinesisActionConfiguration): PutRecordsRequestEntry[] {
  // const put = actionConfiguration.operation.value as Plugin.Plugin_KinesisPut;
  const partitionKey = actionConfiguration?.put?.partitionKey;
  if (!partitionKey) {
    throw new IntegrationError('partitionKey is required');
  }

  const rawRecordsStr = actionConfiguration?.put?.data;
  if (!rawRecordsStr) {
    throw new IntegrationError('data is required');
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rawRecordsList: Array<any>;

  try {
    rawRecordsList = JSON.parse(rawRecordsStr);
  } catch (err) {
    throw new IntegrationError('could not parse data as JSON');
  }

  if (!Array.isArray(rawRecordsList)) {
    throw new IntegrationError('data must be a JSON array');
  }

  const finalRecords = [];
  for (const rawRecord of rawRecordsList) {
    finalRecords.push({
      Data: new TextEncoder().encode(JSON.stringify(rawRecord)),
      PartitionKey: partitionKey
    });
  }

  return finalRecords;
}

type StreamIdentifierConfig = { StreamARN?: string; StreamName?: string };
export function getStreamIdentifierConfig(
  actionConfiguration: KinesisActionConfiguration,
  operationType: Plugin.Plugin_OperationType
): StreamIdentifierConfig {
  const streamIdentifierConfig: StreamIdentifierConfig = {};
  let obj;

  switch (operationType) {
    case Plugin.Plugin_OperationType.GET:
      obj = actionConfiguration.get;
      break;
    case Plugin.Plugin_OperationType.PUT:
      obj = actionConfiguration.put;
      break;
    default:
      throw new IntegrationError(`unknown operation type ${operationType}`);
  }

  let identifier = '';

  switch (obj.streamIdentifierType) {
    case Plugin.Plugin_StreamIdentifier.STREAM_NAME:
      streamIdentifierConfig.StreamName = obj.streamName;
      identifier = obj.streamName;
      break;
    case Plugin.Plugin_StreamIdentifier.STREAM_ARN:
      streamIdentifierConfig.StreamARN = obj.streamArn;
      identifier = obj.streamArn;
      break;
    default:
      throw new IntegrationError(`unknown stream identifier type ${obj.streamIdentifierType}`);
  }
  if (!identifier) {
    throw new IntegrationError('stream identifier cannot be empty');
  }
  return streamIdentifierConfig;
}

// converts the ac (action configuration) GET object to something AWS can handle
// this will only ever be called for GET
export function acGetToGetShardIteratorCommand(actionConfiguration: KinesisActionConfiguration): GetShardIteratorCommandInput {
  const shardIteratorConfig = configFromShardIteratorType(actionConfiguration);
  const streamIdentifierConfig = getStreamIdentifierConfig(actionConfiguration, Plugin.Plugin_OperationType.GET);
  return { ShardId: actionConfiguration.get.shardId, ...shardIteratorConfig, ...streamIdentifierConfig } as GetShardIteratorCommandInput;
}

// https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/kinesis/command/GetShardIteratorCommand/
type ShardConfig = {
  ShardIteratorType: ShardIteratorType | undefined;
  Timestamp?: Date;
  StartingSequenceNumber?: string;
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// this will only ever be called for GET
export function configFromShardIteratorType(actionConfiguration: KinesisActionConfiguration): ShardConfig {
  switch (actionConfiguration.get.shardIteratorType) {
    case Plugin.Plugin_ShardIteratorType.TRIM_HORIZON:
      return { ShardIteratorType: 'TRIM_HORIZON' };
    case Plugin.Plugin_ShardIteratorType.LATEST:
      return { ShardIteratorType: 'LATEST' };
    case Plugin.Plugin_ShardIteratorType.AT_TIMESTAMP:
      if (!actionConfiguration.get.timestamp) {
        throw new IntegrationError('timestamp required for shardIteratorType AT_TIMESTAMP');
      }
      return { ShardIteratorType: 'AT_TIMESTAMP', Timestamp: new Date(actionConfiguration.get.timestamp) };
    case Plugin.Plugin_ShardIteratorType.AT_SEQUENCE_NUMBER:
      if (!actionConfiguration.get.startingSequenceNumber) {
        throw new IntegrationError('startingSequeceNumber required for shardIteratorType AT_SEQUENCE_NUMBER');
      }
      return { ShardIteratorType: 'AT_SEQUENCE_NUMBER', StartingSequenceNumber: actionConfiguration.get.startingSequenceNumber };
    case Plugin.Plugin_ShardIteratorType.AFTER_SEQUENCE_NUMBER:
      if (!actionConfiguration.get.startingSequenceNumber) {
        throw new IntegrationError('startingSequeceNumber required for shardIteratorType AFTER_SEQUENCE_NUMBER');
      }
      return { ShardIteratorType: 'AFTER_SEQUENCE_NUMBER', StartingSequenceNumber: actionConfiguration.get.startingSequenceNumber };
    default:
      throw new IntegrationError(`unknown shardIteratorType: ${actionConfiguration.get.shardIteratorType}`);
  }
}

export function getKinesisClientConfigFromDatasourceConfig(datasourceConfig: KinesisDatasourceConfiguration): KinesisClientConfig {
  const missingFields: string[] = [];
  if (!datasourceConfig.connection?.awsConfig?.region) {
    missingFields.push('region');
  }
  if (!datasourceConfig.connection?.awsConfig?.auth?.accessKeyId) {
    missingFields.push('accessKeyId');
  }
  if (!datasourceConfig.connection?.awsConfig?.auth?.secretKey) {
    missingFields.push('secretKey');
  }
  if (missingFields.length > 0) {
    throw new IntegrationError(`missing required fields: ${missingFields}`);
  }

  const optionalConfig: Record<string, string> = {};
  if (datasourceConfig.connection?.awsConfig?.endpoint) {
    optionalConfig.endpoint = datasourceConfig.connection.awsConfig.endpoint;
  }

  return {
    region: datasourceConfig.connection.awsConfig.region,
    credentials: {
      accessKeyId: datasourceConfig.connection.awsConfig.auth.accessKeyId,
      secretAccessKey: datasourceConfig.connection.awsConfig.auth.secretKey
    },
    ...optionalConfig
  };
}
