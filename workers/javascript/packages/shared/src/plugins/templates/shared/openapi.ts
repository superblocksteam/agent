import { isEmpty } from 'lodash';
import {
  ActionResponseType,
  EditorLanguage,
  ExtendedIntegrationPluginId,
  FormComponentType,
  FormItem,
  FormSectionLayout,
  GENERIC_HTTP_REQUEST,
  getMethodColor,
  getRestApiBodyLabel,
  getRestApiDataTypeDisplayName,
  getRestApiFieldDisplayName,
  HttpMethod,
  KVPair,
  Plugin,
  PluginResponseType,
  PluginType,
  RestApiBodyDataType,
  RestApiFields,
  SUPERBLOCKS_OPENAPI_TENANT_KEYWORD,
  TenantInput
} from '../../../types';
import { AuthMethods, authSections } from './auth';
import { RestApiIntegrationPluginMergedFieldNames, RestApiIntegrationPluginVersions } from './restapiintegration';

export const PUBLIC_INTEGRATIONS_CDN_URL = process.env.SUPERBLOCKS_PUBLIC_INTEGRATIONS_CDN_URL ?? 'https://integrations.superblocks.com';

export const getNativeOpenApiPlugin = ({
  id,
  name,
  serverURL,
  authMethods,
  docsURL,
  logoURL,
  openApiSpecURL,
  headers,
  tenantInput,
  isStreamable
}: {
  id: ExtendedIntegrationPluginId;
  name: string;
  serverURL: string;
  authMethods: AuthMethods;
  docsURL?: string;
  logoURL?: string;
  openApiSpecURL?: string;
  headers?: KVPair[];
  tenantInput?: TenantInput;
  isStreamable?: boolean;
}): Plugin => {
  const mainSectionItems: FormItem[] = [
    {
      label: 'Display name',
      name: 'name',
      startVersion: RestApiIntegrationPluginVersions.V1,
      componentType: FormComponentType.INPUT_TEXT,
      placeholder: 'Example API',
      rules: [{ required: true, message: 'Display name is required' }]
    },
    {
      name: 'urlBase',
      label: 'Base URL',
      startVersion: RestApiIntegrationPluginVersions.V1,
      componentType: FormComponentType.INPUT_TEXT,
      rules: [{ required: true, message: 'Base URL is required' }],
      initialValue: serverURL,
      hidden: true
    }
  ];

  if (!isEmpty(serverURL) && serverURL.includes(SUPERBLOCKS_OPENAPI_TENANT_KEYWORD)) {
    mainSectionItems.push({
      name: RestApiFields.OPENAPI_TENANT_NAME,
      label: tenantInput?.label ?? 'Tenant',
      subtitle: tenantInput?.subtitle,
      placeholder: tenantInput?.placeholder ?? 'my-tenant',
      initialValue: tenantInput?.initialValue,
      // TODO: The plugin needs to be able to give a good runtime error saying
      // that it isn't supported. Need to think about this versioning story
      // more.
      startVersion: RestApiIntegrationPluginVersions.V1, // TODO: Should really be a REST version bump.
      componentType: FormComponentType.DYNAMIC_INPUT_TEXT,
      rules: [{ required: true, message: '' }]
    });
  }

  if (!isEmpty(headers)) {
    mainSectionItems.push({
      name: RestApiIntegrationPluginMergedFieldNames.HEADERS,
      label: '',
      startVersion: RestApiIntegrationPluginVersions.V1,
      componentType: FormComponentType.FIELD_LIST,
      initialValue: headers,
      hidden: true
    });
  }

  return {
    id,
    name,
    moduleName: 'RestApiIntegrationPlugin',
    modulePath: 'plugins/restApiIntegration/RestApiIntegrationPlugin',
    iconLocation: logoURL ?? `${PUBLIC_INTEGRATIONS_CDN_URL}/img/${id}.png`,
    openApiSpecRef: openApiSpecURL ?? `${PUBLIC_INTEGRATIONS_CDN_URL}/openapi/${id}.yaml`,
    docsUrl: docsURL ?? `https://docs.superblocks.com/integrations/integrations-library/${id}`,
    type: PluginType.API,
    responseType: PluginResponseType.JSON,
    isStreamable,
    hasRawRequest: true,
    hasTest: true,
    datasourceTemplate: {
      sections: [
        {
          name: 'main',
          items: mainSectionItems
        },
        ...authSections({
          startVersion: RestApiIntegrationPluginVersions.V1,
          pluginId: id,
          pluginName: name,
          enabledMethods: authMethods,
          allowNone: false
        })
      ]
    },
    actionTemplate: {
      sections: [
        {
          name: 'main',
          items: [
            {
              name: 'openApiAction',
              label: 'Action',
              startVersion: RestApiIntegrationPluginVersions.V8,
              componentType: FormComponentType.OPENAPI_ACTION_DROPDOWN,
              initialValue: GENERIC_HTTP_REQUEST
            },
            {
              gridCss: {
                gridTemplateColumns: '120px calc(100% - 130px)'
              },
              rowItems: [
                {
                  name: RestApiFields.HTTP_METHOD,
                  label: '',
                  startVersion: RestApiIntegrationPluginVersions.V1,
                  componentType: FormComponentType.DROPDOWN,
                  initialValue: HttpMethod.GET,
                  rules: [{ required: true }],
                  renderSelectedOptionWithStyles: true,
                  options: [
                    {
                      key: HttpMethod.GET,
                      value: HttpMethod.GET,
                      displayName: HttpMethod.GET,
                      textColor: getMethodColor(HttpMethod.GET)
                    },
                    {
                      key: HttpMethod.POST,
                      value: HttpMethod.POST,
                      displayName: HttpMethod.POST,
                      textColor: getMethodColor(HttpMethod.POST)
                    },
                    {
                      key: HttpMethod.PUT,
                      value: HttpMethod.PUT,
                      displayName: HttpMethod.PUT,
                      textColor: getMethodColor(HttpMethod.PUT)
                    },
                    {
                      key: HttpMethod.DELETE,
                      value: HttpMethod.DELETE,
                      displayName: HttpMethod.DELETE,
                      textColor: getMethodColor(HttpMethod.DELETE)
                    },
                    {
                      key: HttpMethod.PATCH,
                      value: HttpMethod.PATCH,
                      displayName: HttpMethod.PATCH,
                      textColor: getMethodColor(HttpMethod.PATCH)
                    }
                  ]
                },
                {
                  name: RestApiFields.URL_PATH,
                  label: '',
                  startVersion: RestApiIntegrationPluginVersions.V1,
                  componentType: FormComponentType.URL_INPUT_TEXT,
                  placeholder: '/v1/users'
                }
              ]
            }
          ]
        },
        {
          name: 'tabs',
          layout: FormSectionLayout.TABS,
          items: [
            {
              name: RestApiIntegrationPluginMergedFieldNames.HEADERS,
              label: 'Headers',
              startVersion: RestApiIntegrationPluginVersions.V1,
              componentType: FormComponentType.FIELD_LIST,
              collapseValue: 'Hide auto-generated headers'
            },
            {
              name: RestApiIntegrationPluginMergedFieldNames.PARAMS,
              label: 'Query parameters',
              startVersion: RestApiIntegrationPluginVersions.V1,
              componentType: FormComponentType.FIELD_LIST
            },
            {
              name: RestApiFields.BODY_TYPE,
              label: getRestApiFieldDisplayName(RestApiFields.BODY_TYPE),
              startVersion: RestApiIntegrationPluginVersions.V8,
              componentType: FormComponentType.DROPDOWN,
              initialValue: RestApiBodyDataType.JSON,
              options: Object.values(RestApiBodyDataType).map((bodyType) => ({
                displayName: getRestApiDataTypeDisplayName(bodyType),
                value: bodyType,
                key: bodyType
              }))
            },
            {
              name: RestApiFields.BODY,
              label: getRestApiBodyLabel(RestApiBodyDataType.JSON),
              startVersion: RestApiIntegrationPluginVersions.V8,
              componentType: FormComponentType.CODE_EDITOR,
              language: EditorLanguage.JSON,
              display: {
                show: {
                  bodyType: [RestApiBodyDataType.JSON]
                }
              }
            },
            {
              name: RestApiFields.BODY,
              label: getRestApiBodyLabel(RestApiBodyDataType.RAW),
              startVersion: RestApiIntegrationPluginVersions.V8,
              componentType: FormComponentType.CODE_EDITOR,
              language: EditorLanguage.TEXT,
              display: {
                show: {
                  bodyType: [RestApiBodyDataType.RAW]
                }
              }
            },
            {
              name: RestApiFields.FORM_DATA,
              label: getRestApiBodyLabel(RestApiBodyDataType.FORM),
              startVersion: RestApiIntegrationPluginVersions.V8,
              componentType: FormComponentType.FIELD_LIST_FORM,
              display: {
                show: {
                  bodyType: [RestApiBodyDataType.FORM]
                }
              }
            },
            {
              name: RestApiFields.FILE_FORM_KEY,
              label: getRestApiFieldDisplayName(RestApiFields.FILE_FORM_KEY),
              startVersion: RestApiIntegrationPluginVersions.V8,
              componentType: FormComponentType.INPUT_TEXT,
              initialValue: 'file',
              display: {
                show: {
                  bodyType: [RestApiBodyDataType.FILE_FORM]
                }
              }
            },
            {
              name: RestApiFields.FILE_NAME,
              label: getRestApiFieldDisplayName(RestApiFields.FILE_NAME),
              startVersion: RestApiIntegrationPluginVersions.V8,
              componentType: FormComponentType.INPUT_TEXT,
              display: {
                show: {
                  bodyType: [RestApiBodyDataType.FILE_FORM]
                }
              }
            },
            {
              name: RestApiFields.BODY,
              label: getRestApiBodyLabel(RestApiBodyDataType.FILE_FORM),
              startVersion: RestApiIntegrationPluginVersions.V8,
              componentType: FormComponentType.CODE_EDITOR,
              language: EditorLanguage.TEXT,
              display: {
                show: {
                  bodyType: [RestApiBodyDataType.FILE_FORM]
                }
              }
            }
          ]
        },
        {
          name: 'bottom',
          items: [
            {
              name: RestApiFields.RESPONSE_TYPE,
              label: getRestApiFieldDisplayName(RestApiFields.RESPONSE_TYPE),
              startVersion: RestApiIntegrationPluginVersions.V1,
              componentType: FormComponentType.DROPDOWN,
              initialValue: ActionResponseType.AUTO,
              rules: [{ required: true }],
              options: [
                {
                  key: ActionResponseType.AUTO,
                  value: ActionResponseType.AUTO,
                  displayName: 'Auto'
                },
                {
                  key: ActionResponseType.JSON,
                  value: ActionResponseType.JSON,
                  displayName: 'JSON'
                },
                {
                  key: ActionResponseType.TEXT,
                  value: ActionResponseType.TEXT,
                  displayName: 'Text'
                },
                {
                  key: ActionResponseType.BINARY,
                  value: ActionResponseType.BINARY,
                  displayName: 'Binary'
                },
                {
                  key: ActionResponseType.RAW,
                  value: ActionResponseType.RAW,
                  displayName: 'Raw'
                }
              ]
            }
          ]
        }
      ]
    }
  };
};
