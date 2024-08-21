import { FormComponentType, InputDataType, IntegrationKind, Plugin, PluginResponseType, PluginType, TooltipIconType } from '../../../types';

export const AWSSecretsManagerVersions = {
  V1: '0.0.1'
};

export const AWSSecretsManagerPlugin: Plugin = {
  id: 'awssecretsmanager',
  name: 'AWS Secrets Manager',
  moduleName: 'AWSSecretsManagerPlugin',
  modulePath: '',
  iconLocation: 'https://superblocks.s3.us-west-2.amazonaws.com/img/integrations/aws_secrets_manager.psd.png',
  docsUrl: 'https://docs.superblocks.com/development-lifecycle/secrets/aws-secrets-manager',
  type: PluginType.DB,
  responseType: PluginResponseType.JSON,
  hasRawRequest: false,
  kind: IntegrationKind.SECRET,
  datasourceTemplate: {
    sections: [
      {
        name: 'main',
        items: [
          {
            label: '',
            name: 'provider.config.case',
            startVersion: AWSSecretsManagerVersions.V1,
            componentType: FormComponentType.INPUT_TEXT,
            hidden: true,
            initialValue: 'awsSecretsManager'
          },
          {
            label: 'Prefix (optional)',
            name: 'provider.config.value.prefix',
            startVersion: AWSSecretsManagerVersions.V1,
            placeholder: 'superblocks/production/',
            componentType: FormComponentType.INPUT_TEXT,
            tooltip: {
              markdownText:
                'If your secrets follow [hierarchical naming conventions](https://docs.aws.amazon.com/prescriptive-guidance/latest/secure-sensitive-data-secrets-manager-terraform/naming-convention.html), filter secrets in this store by this prefix. The prefix will be stripped when accessing the secret in Superblocks.'
            }
          },
          {
            label: 'Region',
            name: 'provider.config.value.auth.region',
            placeholder: 'us-west-2',
            startVersion: AWSSecretsManagerVersions.V1,
            rules: [{ required: true, message: 'Region is required' }],
            componentType: FormComponentType.INPUT_TEXT,
            tooltip: {
              markdownText: 'The AWS region where the secrets are stored.'
            }
          }
        ]
      },
      {
        name: 'auth',
        items: [
          {
            label: 'Auth type',
            name: 'provider.config.value.auth.config.case',
            startVersion: AWSSecretsManagerVersions.V1,
            componentType: FormComponentType.DROPDOWN,
            initialValue: 'assumeRole',
            rules: [{ required: true }],
            tooltip: {
              markdownText: 'Assume role authentication is currently only supported for on-premise deployments.',
              iconType: TooltipIconType.INFO
            },
            options: [
              {
                displayName: 'Assume Role',
                key: 'assumeRole',
                value: 'assumeRole'
              },
              {
                displayName: 'Access Key',
                key: 'static',
                value: 'static'
              }
            ]
          },
          {
            label: 'IAM Role ARN',
            name: 'provider.config.value.auth.config.value.roleArn',
            placeholder: 'my_iam_role_arn',
            startVersion: AWSSecretsManagerVersions.V1,
            rules: [{ required: true, message: 'IAM role arn is required' }],
            componentType: FormComponentType.INPUT_TEXT,
            display: {
              show: {
                'provider.config.value.auth.config.case': ['assumeRole']
              }
            }
          },
          {
            label: 'Access key ID',
            name: 'provider.config.value.auth.config.value.accessKeyId',
            placeholder: 'my_access_key_id',
            startVersion: AWSSecretsManagerVersions.V1,
            rules: [{ required: true, message: 'Access key ID is required' }],
            componentType: FormComponentType.INPUT_TEXT,
            display: {
              show: {
                'provider.config.value.auth.config.case': ['static']
              }
            }
          },
          {
            label: 'Secret access key',
            name: 'provider.config.value.auth.config.value.secretAccessKey',
            placeholder: 'my_secret_access_key',
            startVersion: AWSSecretsManagerVersions.V1,
            rules: [{ required: true, message: 'Secret access key is required' }],
            componentType: FormComponentType.INPUT_TEXT,
            dataType: InputDataType.PASSWORD,
            display: {
              show: {
                'provider.config.value.auth.config.case': ['static']
              }
            }
          }
        ]
      },
      {
        name: 'cache',
        items: [
          {
            label: 'Enable caching',
            name: 'cache',
            startVersion: AWSSecretsManagerVersions.V1,
            componentType: FormComponentType.CHECKBOX,
            initialValue: true,
            tooltip: {
              markdownText: 'Superblocks will encrypt the secret values and cache them for the specified TTL.'
            }
          },
          {
            label: 'Cache TTL (seconds)',
            name: 'ttl',
            startVersion: AWSSecretsManagerVersions.V1,
            componentType: FormComponentType.INPUT_TEXT,
            dataType: InputDataType.NUMBER,
            placeholder: 'ttl (i.e. 86400)',
            initialValue: 86400,
            rules: [{ required: true, message: 'If caching is enabled, a TTL is required.' }],
            display: {
              show: {
                cache: ['true']
              }
            },
            tooltip: {
              markdownText: 'When the TTL expires, the next execution will fetch the secret from the store.'
            }
          }
        ]
      }
    ]
  },
  actionTemplate: {
    sections: []
  }
};
