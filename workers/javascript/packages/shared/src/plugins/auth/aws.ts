import { AssumeRoleCommand, STSClient, STSClientConfig } from '@aws-sdk/client-sts';
import { fromInstanceMetadata, fromTokenFile } from '@aws-sdk/credential-providers';
import { ErrorCode, IntegrationError } from '../../errors';
import { AWSAuthType, AWSDatasourceConfiguration } from '../../types';

// 900 seconds is the minimum allowed duration.
const ROLE_ASSUME_DURATION_IN_SECONDS = 900;
const ROLE_SESSION_NAME_NOT_ACCEPTED = /[^\w+=,.@-]+/g;
const ROLE_SESSION_NAME_MAX_LENGTH = 64;

// TODO [ro] use action configuration identifier as part of session name when it's available in Plugin.execute/metadata/test
// helper function that creates a role session name that removes not accepted characters and limit the length
// see https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRole.html RoleSession Name
export function getRoleSessionName(datasourceName: string, timestamp: string): string {
  return `superblocks-${timestamp}-${datasourceName}`.slice(0, ROLE_SESSION_NAME_MAX_LENGTH).replace(ROLE_SESSION_NAME_NOT_ACCEPTED, '');
}

export async function getAwsClientConfigWithTempCreds(
  stsClientConfig: STSClientConfig,
  name: string | undefined,
  region: string | undefined,
  roleArn: string
): Promise<STSClientConfig> {
  const stsClient = new STSClient(stsClientConfig);
  const params = {
    RoleArn: roleArn,
    RoleSessionName: getRoleSessionName(name ?? '', Date.now().toString()),
    DurationSeconds: ROLE_ASSUME_DURATION_IN_SECONDS
  };
  const command = new AssumeRoleCommand(params);
  try {
    const data = await stsClient.send(command);
    return {
      region: region,
      credentials: {
        accessKeyId: data?.Credentials?.AccessKeyId ?? '',
        secretAccessKey: data?.Credentials?.SecretAccessKey ?? '',
        sessionToken: data?.Credentials?.SessionToken ?? ''
      }
    };
  } catch (err) {
    throw new IntegrationError(
      `Failed to assume role ${roleArn} for datasource ${name}. Error: ${err.message}`,
      ErrorCode.INTEGRATION_AUTHORIZATION
    );
  }
}

export async function getAwsClientConfig(datasourceConfig: AWSDatasourceConfiguration): Promise<STSClientConfig> {
  const stsClientConfig: STSClientConfig = {
    region: datasourceConfig.authentication?.custom?.region?.value
  };
  switch (datasourceConfig.awsAuthType) {
    case AWSAuthType.EC2_INSTANCE_METADATA:
      stsClientConfig.credentials = fromInstanceMetadata();
      break;
    case AWSAuthType.TOKEN_FILE:
      stsClientConfig.credentials = fromTokenFile();
      break;
    case AWSAuthType.ACCESS_KEY:
    default:
      if (datasourceConfig.authentication?.custom?.accessKeyID?.value && datasourceConfig.authentication?.custom?.secretKey?.value) {
        stsClientConfig.credentials = {
          accessKeyId: datasourceConfig.authentication?.custom?.accessKeyID?.value,
          secretAccessKey: datasourceConfig.authentication?.custom?.secretKey?.value
        };
      }
  }
  // assume role if needed
  if (datasourceConfig.authentication?.custom?.iamRoleArn?.value) {
    return await getAwsClientConfigWithTempCreds(
      stsClientConfig,
      datasourceConfig.name,
      datasourceConfig.authentication?.custom?.region?.value,
      datasourceConfig.authentication?.custom?.iamRoleArn?.value
    );
  }
  return stsClientConfig;
}
