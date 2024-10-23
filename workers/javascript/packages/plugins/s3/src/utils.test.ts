import { AWSAuthType } from '@superblocks/shared';
import { buildListObjectsV2Command, getS3ClientConfig } from './utils';

describe('getS3ClientConfig', () => {
  it.each([
    {
      description: 'without endpoint',
      datasourceConfiguration: { awsAuthType: AWSAuthType.ACCESS_KEY },
      expectedS3ClientConfig: {}
    },
    {
      description: 'with endpoint',
      datasourceConfiguration: { awsAuthType: AWSAuthType.ACCESS_KEY, endpoint: 'foo' },
      expectedS3ClientConfig: { endpoint: 'foo', forcePathStyle: true }
    }
  ])('$description', async ({ datasourceConfiguration, expectedS3ClientConfig }) => {
    const actualS3ClientConfig = getS3ClientConfig(datasourceConfiguration);
    expect(expectedS3ClientConfig).toEqual(actualS3ClientConfig);
  });
});

describe('buildListObjectsV2Command', () => {
  it.each([
    {
      description: 'only bucket',
      actionConfiguration: { resource: 'b' },
      expectedResponse: { Bucket: 'b' }
    },
    {
      description: 'with prefix, without delimiter',
      actionConfiguration: { resource: 'b', listFilesConfig: { prefix: 'foo' } },
      expectedResponse: { Bucket: 'b', Prefix: 'foo' }
    },
    {
      description: 'with delimiter, without prefix',
      actionConfiguration: { resource: 'b', listFilesConfig: { delimiter: 'foo' } },
      expectedResponse: { Bucket: 'b', Delimiter: 'foo' }
    },
    {
      description: 'with delimiter, with prefix',
      actionConfiguration: { resource: 'b', listFilesConfig: { delimiter: 'foo', prefix: 'bar' } },
      expectedResponse: { Bucket: 'b', Delimiter: 'foo', Prefix: 'bar' }
    }
  ])('$description', async ({ actionConfiguration, expectedResponse }) => {
    const actualResponse = buildListObjectsV2Command(actionConfiguration);
    expect(expectedResponse).toEqual(actualResponse);
  });
});
