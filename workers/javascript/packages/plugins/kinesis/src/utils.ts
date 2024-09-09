import { PutRecordsRequestEntry, KinesisClientConfig, GetShardIteratorCommandInput, ShardIteratorType } from '@aws-sdk/client-kinesis';
import { KinesisActionConfiguration, KinesisDatasourceConfiguration, IntegrationError } from '@superblocks/shared';

import { KinesisPluginV1 as Plugin } from '@superblocksteam/types';

// https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/kinesis/command/PutRecordsCommand/
export function actionConfigurationToRecords(actionConfiguration: KinesisActionConfiguration): PutRecordsRequestEntry[] {
  const put = actionConfiguration.operation.value as Plugin.Plugin_KinesisPut;
  const partitionKey = put.partitionKey;
  if (!partitionKey) {
    throw new IntegrationError('partitionKey is required');
  }

  const rawRecordsStr = put.data;
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getStreamIdentifierConfig(streamIdentifier: any): StreamIdentifierConfig {
  const streamIdentifierConfig: StreamIdentifierConfig = {};
  switch (streamIdentifier.case) {
    case 'streamArn':
      streamIdentifierConfig.StreamARN = streamIdentifier.value;
      break;
    case 'streamName':
      streamIdentifierConfig.StreamName = streamIdentifier.value;
      break;
    default:
      throw new IntegrationError('stream identifier must be given');
  }
  return streamIdentifierConfig;
}

// converts the ac (action configuration) GET object to something AWS can handle
export function acGetToGetShardIteratorCommand(acGet: Plugin.Plugin_KinesisGet): GetShardIteratorCommandInput {
  const shardIteratorConfig = configFromShardIteratorType(acGet);
  const streamIdentifierConfig = getStreamIdentifierConfig(acGet.streamIdentifier);
  return { ShardId: acGet.shardId, ...shardIteratorConfig, ...streamIdentifierConfig } as GetShardIteratorCommandInput;
}

// https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/kinesis/command/GetShardIteratorCommand/
type ShardConfig = {
  ShardIteratorType: ShardIteratorType | undefined;
  Timestamp?: Date;
  StartingSequenceNumber?: string;
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function configFromShardIteratorType(acGet: Plugin.Plugin_KinesisGet): ShardConfig {
  switch (acGet.shardIteratorType) {
    case Plugin.Plugin_ShardIteratorType.TRIM_HORIZON:
      return { ShardIteratorType: 'TRIM_HORIZON' };
    case Plugin.Plugin_ShardIteratorType.LATEST:
      return { ShardIteratorType: 'LATEST' };
    case Plugin.Plugin_ShardIteratorType.AT_TIMESTAMP:
      if (!acGet.timestamp) {
        throw new IntegrationError('timestamp required for shardIteratorType AT_TIMESTAMP');
      }
      return { ShardIteratorType: 'AT_TIMESTAMP', Timestamp: new Date(acGet.timestamp) };
    case Plugin.Plugin_ShardIteratorType.AT_SEQUENCE_NUMBER:
      if (!acGet.startingSequenceNumber) {
        throw new IntegrationError('startingSequeceNumber required for shardIteratorType AT_SEQUENCE_NUMBER');
      }
      return { ShardIteratorType: 'AT_SEQUENCE_NUMBER', StartingSequenceNumber: acGet.startingSequenceNumber };
    case Plugin.Plugin_ShardIteratorType.AFTER_SEQUENCE_NUMBER:
      if (!acGet.startingSequenceNumber) {
        throw new IntegrationError('startingSequeceNumber required for shardIteratorType AFTER_SEQUENCE_NUMBER');
      }
      return { ShardIteratorType: 'AFTER_SEQUENCE_NUMBER', StartingSequenceNumber: acGet.startingSequenceNumber };
    default:
      throw new IntegrationError(`unknown shardIteratorType: ${acGet.shardIteratorType}`);
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
