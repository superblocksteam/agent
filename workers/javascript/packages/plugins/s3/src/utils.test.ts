import { AWSAuthType } from '@superblocks/shared';
import { getS3ClientConfig } from './utils';

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
