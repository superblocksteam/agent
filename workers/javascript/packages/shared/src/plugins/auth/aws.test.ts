const mockStsSend = jest.fn();

jest.mock('@aws-sdk/client-sts', () => {
  const originalModule = jest.requireActual('@aws-sdk/client-sts');
  return {
    ...originalModule,
    STSClient: jest.fn().mockImplementation(() => ({
      send: mockStsSend
    }))
  };
});

import { getAwsClientConfigWithTempCreds, getRoleSessionName } from './aws';

describe('aws assume role session name getter', () => {
  test('should remove not accepted chars', async () => {
    const ts = Date.now().toString();
    const result = getRoleSessionName('&Test Integration#', ts);
    expect(result).toEqual(`superblocks-${ts}-TestIntegration`);
  });

  test('should not remove accepted chars', async () => {
    const ts = Date.now().toString();
    const result = getRoleSessionName('Test-Integration', ts);
    expect(result).toEqual(`superblocks-${ts}-Test-Integration`);
  });

  test('should limit max length', async () => {
    const ts = Date.now().toString();
    const datasourceName = 'session-name-that-has-more-than-64-characters-should-be-truncated-to-64-chars';
    expect(datasourceName.length).toBeGreaterThan(64);
    const result = getRoleSessionName(datasourceName, ts);
    expect(result.length).toEqual(64);
  });
});

describe('aws temporary role credentials', () => {
  beforeEach(() => {
    mockStsSend.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('sends the bounded session name, duration, and optional inline policy to AssumeRole', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(1_725_000_000_000);
    mockStsSend.mockResolvedValue({
      Credentials: {
        AccessKeyId: 'assumed-access-key',
        SecretAccessKey: 'assumed-secret-key',
        SessionToken: 'assumed-session-token'
      },
      $metadata: {}
    });
    const datasourceName = 'integration-name-that-is-long-enough-to-require-the-existing-bounded-session-name-logic';
    const sessionPolicy = '{"Version":"2012-10-17","Statement":[]}';

    await getAwsClientConfigWithTempCreds(
      { region: 'us-east-1' },
      datasourceName,
      'us-east-1',
      'arn:aws:iam::123456789012:role/postgres',
      sessionPolicy
    );

    const expectedRoleSessionName = getRoleSessionName(datasourceName, '1725000000000');
    expect(expectedRoleSessionName).toHaveLength(64);
    expect(mockStsSend).toHaveBeenCalledWith(
      expect.objectContaining({
        input: {
          DurationSeconds: 900,
          Policy: sessionPolicy,
          RoleArn: 'arn:aws:iam::123456789012:role/postgres',
          RoleSessionName: expectedRoleSessionName
        }
      })
    );
  });

  test('omits Policy when no inline session policy is configured', async () => {
    mockStsSend.mockResolvedValue({
      Credentials: {
        AccessKeyId: 'assumed-access-key',
        SecretAccessKey: 'assumed-secret-key',
        SessionToken: 'assumed-session-token'
      },
      $metadata: {}
    });

    await getAwsClientConfigWithTempCreds(
      { region: 'us-east-1' },
      'integration-name',
      'us-east-1',
      'arn:aws:iam::123456789012:role/postgres'
    );

    expect(mockStsSend).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.not.objectContaining({
          Policy: expect.anything()
        })
      })
    );
  });
});
