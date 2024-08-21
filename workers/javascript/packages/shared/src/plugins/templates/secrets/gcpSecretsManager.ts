import {
  EditorLanguage,
  FormComponentType,
  FormItemTransformation,
  InputDataType,
  IntegrationKind,
  Plugin,
  PluginResponseType,
  PluginType
} from '../../../types';
import { SERVICE_ACCOUNT_GHOST_TEXT } from '../constants';

export const GCPSecretsManagerVersions = {
  V1: '0.0.1'
};

export const GCPSecretsManagerPlugin: Plugin = {
  id: 'gcpsecretsmanager',
  name: 'GCP Secrets Manager',
  moduleName: 'GCPSecretsManagerPlugin',
  modulePath: '',
  iconLocation: 'https://superblocks.s3.us-west-2.amazonaws.com/img/integrations/secret_manager_1.png',
  docsUrl: 'https://docs.superblocks.com/development-lifecycle/secrets/google-secrets-manager',
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
            label: 'Project ID',
            name: 'provider.config.value.projectId',
            placeholder: 'project-12345',
            startVersion: GCPSecretsManagerVersions.V1,
            rules: [{ required: true, message: 'Project ID is required' }],
            componentType: FormComponentType.INPUT_TEXT,
            tooltip: {
              markdownText: 'The project where the secrets are stored.'
            }
          },
          {
            label: 'Service account key',
            name: 'provider.config.value.auth.config.value',
            startVersion: GCPSecretsManagerVersions.V1,
            // INPUT_AREA is broken (cannot be udpated after unfocus). Using
            // code editor for now.
            componentType: FormComponentType.CODE_EDITOR,
            language: EditorLanguage.JSON,
            placeholder: SERVICE_ACCOUNT_GHOST_TEXT,
            rules: [{ required: true, message: 'Service account key is required' }],
            transformation: FormItemTransformation.BYTE_ARRAY
          },
          {
            label: 'Enable caching',
            name: 'cache',
            startVersion: GCPSecretsManagerVersions.V1,
            componentType: FormComponentType.CHECKBOX,
            initialValue: true,
            tooltip: {
              markdownText: 'Superblocks will encrypt the secret values and cache them for the specified TTL.'
            }
          },
          {
            label: 'Cache TTL (seconds)',
            name: 'ttl',
            startVersion: GCPSecretsManagerVersions.V1,
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
          },
          {
            label: '',
            name: 'provider.config.value.auth.config.case',
            startVersion: GCPSecretsManagerVersions.V1,
            componentType: FormComponentType.INPUT_TEXT,
            hidden: true,
            initialValue: 'serviceAccount'
          },
          {
            label: '',
            name: 'provider.config.case',
            startVersion: GCPSecretsManagerVersions.V1,
            componentType: FormComponentType.INPUT_TEXT,
            hidden: true,
            initialValue: 'gcpSecretManager'
          }
        ]
      }
    ]
  },
  actionTemplate: {
    sections: []
  }
};
