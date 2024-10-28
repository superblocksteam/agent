import { S3ClientConfig, ListObjectsV2CommandInput } from '@aws-sdk/client-s3';
import { S3ActionConfiguration, S3DatasourceConfiguration, S3ActionType } from '@superblocks/shared';
export function getS3ClientConfig(datasourceConfig: S3DatasourceConfiguration): S3ClientConfig {
  const config: S3ClientConfig = {};
  if (datasourceConfig?.endpoint) {
    // force path style forces urls to be like http://{host}/{bucket}/{key} instead of http://{bucket}.{host}/{key}
    // https://sdk.amazonaws.com/swift/api/awss3/0.35.0/documentation/awss3/endpointparams/forcepathstyle
    // https://stackoverflow.com/questions/20305877/how-to-configure-aws-s3-sdk-for-node-js-to-be-used-with-localhost
    // so if we get an endpoint, use it and force path style
    config.endpoint = datasourceConfig.endpoint;
    config.forcePathStyle = true;
  }
  return config;
}

export function buildListObjectsV2Command(actionConfig: S3ActionConfiguration): ListObjectsV2CommandInput {
  const commandInput: ListObjectsV2CommandInput = {
    Bucket: actionConfig.resource
  };
  if (actionConfig.listFilesConfig?.prefix) {
    commandInput.Prefix = actionConfig.listFilesConfig.prefix;
  }
  if (actionConfig.listFilesConfig?.delimiter) {
    commandInput.Delimiter = actionConfig.listFilesConfig.delimiter;
  }
  return commandInput;
}

export function validateS3Action(action: string) {
  if (!Object.values(S3ActionType).includes(action as S3ActionType)) {
    throw new Error(`Invalid S3 action type: ${action}`);
  }
}
