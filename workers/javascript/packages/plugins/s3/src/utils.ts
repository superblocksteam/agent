import { S3ClientConfig } from '@aws-sdk/client-s3';
import { S3DatasourceConfiguration } from '@superblocks/shared';
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
