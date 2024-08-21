import {
  EditorLanguage,
  ExtendedIntegrationPluginId,
  FormComponentType,
  GoogleSheetsAuthType,
  Plugin,
  PluginResponseType,
  PluginType
} from '../../types';
import { SERVICE_ACCOUNT_GHOST_TEXT } from './constants';
import { authSections } from './shared/auth';

export const GoogleSheetsPluginVersions = {
  V1: '0.0.1',
  V2: '0.0.2',
  V3: '0.0.3',
  V4: '0.0.4',
  V5: '0.0.5',
  V6: '0.0.6',
  V7: '0.0.7',
  V14: '0.0.14',
  V15: '0.0.15'
};

export enum GoogleSheetsFormatType {
  EFFECTIVE_VALUE = 'EFFECTIVE_VALUE',
  USER_ENTERED_VALUE = 'USER_ENTERED_VALUE',
  FORMATTED_VALUE = 'FORMATTED_VALUE'
}

export enum GoogleSheetsActionType {
  READ_SPREADSHEET = 'READ_SPREADSHEET',
  READ_SPREADSHEET_RANGE = 'READ_SPREADSHEET_RANGE',
  APPEND_SPREADSHEET = 'APPEND_SPREADSHEET',
  CREATE_SPREADSHEET_ROWS = 'CREATE_SPREADSHEET_ROWS',
  CLEAR_SPREADSHEET = 'CLEAR_SPREADSHEET'
}

export const GOOGLE_SHEETS_ACTION_DISPLAY_NAMES: Record<GoogleSheetsActionType, string> = {
  [GoogleSheetsActionType.READ_SPREADSHEET]: 'Read the whole spreadsheet',
  [GoogleSheetsActionType.READ_SPREADSHEET_RANGE]: 'Read from a range (e.g. A1:D100)',
  [GoogleSheetsActionType.APPEND_SPREADSHEET]: 'Append rows to the spreadsheet (deprecated)',
  [GoogleSheetsActionType.CREATE_SPREADSHEET_ROWS]: 'Create spreadsheet row(s)',
  [GoogleSheetsActionType.CLEAR_SPREADSHEET]: 'Clear the spreadsheet'
};

export const GOOGLE_SHEETS_PLUGIN_ID = 'gsheets';

export const GOOGLE_SHEETS_FORMAT_DISPLAY_NAMES: Record<GoogleSheetsFormatType, string> = {
  [GoogleSheetsFormatType.EFFECTIVE_VALUE]: 'Effective value',
  [GoogleSheetsFormatType.FORMATTED_VALUE]: 'Formatted value',
  [GoogleSheetsFormatType.USER_ENTERED_VALUE]: 'User entered value'
};

export enum GOOGLE_SHEETS_SCOPE {
  READ = 'email https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/spreadsheets.readonly https://www.googleapis.com/auth/userinfo.email openid',
  WRITE = 'email https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/userinfo.email openid'
}

export const getGsheetsAuthDisplayName = (authType: GoogleSheetsAuthType): string => {
  switch (authType) {
    case GoogleSheetsAuthType.OAUTH2_CODE:
      return 'Connect using Google Account';
    case GoogleSheetsAuthType.SERVICE_ACCOUNT:
      return 'Connect using Service Account';
    default:
      return 'None';
  }
};

export enum GoogleSheetsDestinationType {
  ROW_NUMBER = 'ROW_NUMBER',
  APPEND = 'APPEND'
}

export const GoogleSheetsPlugin = (googleSheetsClientId: string): Plugin => {
  return {
    id: GOOGLE_SHEETS_PLUGIN_ID,
    name: 'Google Sheets',
    moduleName: 'GoogleSheetsPlugin',
    modulePath: 'plugins/gsheets/GoogleSheetsPlugin',
    iconLocation: 'https://superblocks.s3-us-west-2.amazonaws.com/img/integrations/gsheets.png',
    docsUrl: 'https://docs.superblocks.com/integrations/integrations-library/google-sheets',
    type: PluginType.API,
    responseType: PluginResponseType.TABLE,
    hasRawRequest: false,
    hasTest: true,
    hasMetadata: true,
    datasourceTemplate: {
      sections: [
        {
          name: 'main',
          items: [
            {
              label: 'Display name',
              name: 'name',
              startVersion: GoogleSheetsPluginVersions.V1,
              componentType: FormComponentType.INPUT_TEXT,
              rules: [{ required: true, message: 'Display name is required' }]
            }
          ]
        },
        ...authSections({
          startVersion: GoogleSheetsPluginVersions.V1,
          pluginId: ExtendedIntegrationPluginId.GOOGLE_SHEETS_PLUGIN_ID,
          pluginName: 'Google Sheets',
          enabledMethods: {
            oauth2SuperblocksClient: {
              tokenUrl: 'https://accounts.google.com/o/oauth2/token',
              authorizationUrl: 'https://accounts.google.com/o/oauth2/auth',
              revokeTokenUrl: 'https://oauth2.googleapis.com/revoke',
              userInfoUrl: 'https://openidconnect.googleapis.com/v1/userinfo',
              clientId: googleSheetsClientId,
              iconUrl: 'https://superblocks.s3.us-west-2.amazonaws.com/img/integrations/google-login.svg',
              authorizationExtraParams: {
                responseType: 'code',
                accessType: 'offline'
              }
            }
          },
          defaultMethod: 'oauth2SuperblocksClient',
          allowNone: false,
          fieldNamesToHide: [
            'oauth-callback-alert',
            'authConfig.clientId',
            'authConfig.audience',
            'authConfig.scope',
            'authConfig.tokenScope',
            'oauth-revoke-shared-tokens-button'
          ],
          prependItems: [
            {
              label: 'Authentication',
              name: 'authType',
              startVersion: GoogleSheetsPluginVersions.V4,
              componentType: FormComponentType.DROPDOWN,
              initialValue: GoogleSheetsAuthType.OAUTH2_CODE,
              options: Object.values(GoogleSheetsAuthType).map((authType) => ({
                displayName: getGsheetsAuthDisplayName(authType),
                value: authType,
                key: authType
              })),
              immutable: true
            },
            {
              label: 'Access level',
              name: 'authConfig.scope',
              startVersion: GoogleSheetsPluginVersions.V1,
              componentType: FormComponentType.RADIO,
              initialValue: GOOGLE_SHEETS_SCOPE.WRITE,
              options: [
                {
                  key: GOOGLE_SHEETS_SCOPE.WRITE,
                  value: GOOGLE_SHEETS_SCOPE.WRITE,
                  displayName: 'Read and write'
                },
                {
                  key: GOOGLE_SHEETS_SCOPE.READ,
                  value: GOOGLE_SHEETS_SCOPE.READ,
                  displayName: 'Read only'
                }
              ],
              rules: [{ required: true, message: 'Access level is required' }],
              immutable: true
            },
            {
              label: 'Service account key',
              name: 'authConfig.googleServiceAccount.value',
              startVersion: GoogleSheetsPluginVersions.V4,
              componentType: FormComponentType.CODE_EDITOR,
              language: EditorLanguage.JSON,
              placeholder: SERVICE_ACCOUNT_GHOST_TEXT,
              rules: [{ required: true, message: 'Service account key is required' }],
              display: {
                show: {
                  authType: [GoogleSheetsAuthType.SERVICE_ACCOUNT]
                }
              }
            }
          ]
        })
      ]
    },
    actionTemplate: {
      sections: [
        {
          name: 'main',
          items: [
            {
              label: 'Action',
              name: 'action',
              startVersion: GoogleSheetsPluginVersions.V15,
              componentType: FormComponentType.DROPDOWN,
              initialValue: GoogleSheetsActionType.READ_SPREADSHEET,
              rules: [{ required: true }],
              options: [
                {
                  key: GoogleSheetsActionType.READ_SPREADSHEET,
                  value: GoogleSheetsActionType.READ_SPREADSHEET,
                  displayName: GOOGLE_SHEETS_ACTION_DISPLAY_NAMES[GoogleSheetsActionType.READ_SPREADSHEET]
                },
                {
                  key: GoogleSheetsActionType.READ_SPREADSHEET_RANGE,
                  value: GoogleSheetsActionType.READ_SPREADSHEET_RANGE,
                  displayName: GOOGLE_SHEETS_ACTION_DISPLAY_NAMES[GoogleSheetsActionType.READ_SPREADSHEET_RANGE]
                },
                {
                  key: GoogleSheetsActionType.CREATE_SPREADSHEET_ROWS,
                  value: GoogleSheetsActionType.CREATE_SPREADSHEET_ROWS,
                  displayName: GOOGLE_SHEETS_ACTION_DISPLAY_NAMES[GoogleSheetsActionType.CREATE_SPREADSHEET_ROWS]
                },
                {
                  key: GoogleSheetsActionType.CLEAR_SPREADSHEET,
                  value: GoogleSheetsActionType.CLEAR_SPREADSHEET,
                  displayName: GOOGLE_SHEETS_ACTION_DISPLAY_NAMES[GoogleSheetsActionType.CLEAR_SPREADSHEET]
                },
                {
                  key: GoogleSheetsActionType.APPEND_SPREADSHEET,
                  value: GoogleSheetsActionType.APPEND_SPREADSHEET,
                  displayName: GOOGLE_SHEETS_ACTION_DISPLAY_NAMES[GoogleSheetsActionType.APPEND_SPREADSHEET]
                }
              ]
            }
          ]
        },
        {
          name: 'Spreadsheet information',
          borderThreshold: 0,
          items: [
            {
              label: 'Spreadsheet',
              name: 'spreadsheetId',
              startVersion: GoogleSheetsPluginVersions.V1,
              componentType: FormComponentType.METADATA_DROPDOWN,
              keyAccessor: 'id',
              valueAccessor: 'id',
              displayNameAccessor: 'name',
              triggerGetMetadata: true,
              gSheetsPagination: true,
              display: {
                show: {
                  action: [
                    GoogleSheetsActionType.READ_SPREADSHEET,
                    GoogleSheetsActionType.READ_SPREADSHEET_RANGE,
                    GoogleSheetsActionType.APPEND_SPREADSHEET,
                    GoogleSheetsActionType.CREATE_SPREADSHEET_ROWS,
                    GoogleSheetsActionType.CLEAR_SPREADSHEET
                  ]
                }
              },
              rules: [{ required: true, message: 'Spreadsheet is required' }],
              showSearch: true,
              optionFilterProp: 'label'
            },
            {
              label: 'Sheet name',
              name: 'sheetTitle',
              startVersion: GoogleSheetsPluginVersions.V1,
              componentType: FormComponentType.METADATA_DROPDOWN,
              dependencyFieldName: 'spreadsheetId',
              childIteratorAccessor: 'columns',
              keyAccessor: 'name',
              valueAccessor: 'name',
              displayNameAccessor: 'name',
              display: {
                show: {
                  action: [
                    GoogleSheetsActionType.READ_SPREADSHEET,
                    GoogleSheetsActionType.READ_SPREADSHEET_RANGE,
                    GoogleSheetsActionType.APPEND_SPREADSHEET,
                    GoogleSheetsActionType.CREATE_SPREADSHEET_ROWS,
                    GoogleSheetsActionType.CLEAR_SPREADSHEET
                  ]
                }
              },
              rules: [{ required: true, message: 'Sheet name is required' }],
              showSearch: true,
              optionFilterProp: 'label'
            },
            {
              label: 'Use first row of the sheet as the header',
              name: 'extractFirstRowHeader',
              startVersion: GoogleSheetsPluginVersions.V1,
              componentType: FormComponentType.CHECKBOX,
              initialValue: true,
              display: {
                show: {
                  action: [GoogleSheetsActionType.READ_SPREADSHEET, GoogleSheetsActionType.READ_SPREADSHEET_RANGE]
                }
              },
              tooltip: {
                markdownText: 'Use first row of the sheet as the header'
              }
            },
            {
              label: 'Include a header row in this sheet',
              name: 'includeHeaderRow',
              startVersion: GoogleSheetsPluginVersions.V15,
              componentType: FormComponentType.SWITCH,
              initialValue: true,
              display: {
                show: {
                  action: [GoogleSheetsActionType.CREATE_SPREADSHEET_ROWS]
                }
              }
            },
            {
              label: 'Preserve table header',
              name: 'preserveHeaderRow',
              startVersion: GoogleSheetsPluginVersions.V15,
              componentType: FormComponentType.SWITCH,
              initialValue: true,
              display: {
                show: {
                  action: [GoogleSheetsActionType.CLEAR_SPREADSHEET]
                }
              }
            },
            {
              label: 'Header row number',
              name: 'headerRowNumber',
              startVersion: GoogleSheetsPluginVersions.V15,
              componentType: FormComponentType.CODE_EDITOR,
              language: EditorLanguage.TEXT,
              initialValue: '1',
              display: {
                show: {
                  action: [GoogleSheetsActionType.CLEAR_SPREADSHEET],
                  preserveHeaderRow: ['true']
                }
              }
            },
            {
              label: 'Header row number',
              name: 'headerRowNumber',
              startVersion: GoogleSheetsPluginVersions.V15,
              componentType: FormComponentType.CODE_EDITOR,
              language: EditorLanguage.TEXT,
              initialValue: '1',
              display: {
                show: {
                  action: [GoogleSheetsActionType.CREATE_SPREADSHEET_ROWS],
                  includeHeaderRow: ['true']
                }
              }
            }
          ]
        },
        {
          name: 'Read options',
          borderThreshold: 0,
          items: [
            {
              label: 'Data range',
              name: 'range',
              startVersion: GoogleSheetsPluginVersions.V1,
              componentType: FormComponentType.DYNAMIC_INPUT_TEXT,
              initialValue: 'A1:D100',
              display: {
                show: {
                  action: [GoogleSheetsActionType.READ_SPREADSHEET_RANGE]
                }
              },
              tooltip: {
                markdownText: 'Range of cells to read from'
              }
            }
          ]
        },
        {
          name: 'Write options',
          borderThreshold: 0,
          items: [
            {
              label: 'Write location',
              name: 'writeToDestinationType',
              startVersion: GoogleSheetsPluginVersions.V15,
              componentType: FormComponentType.DROPDOWN,
              display: {
                show: {
                  action: [GoogleSheetsActionType.CREATE_SPREADSHEET_ROWS]
                }
              },
              options: [
                {
                  key: GoogleSheetsDestinationType.APPEND,
                  value: GoogleSheetsDestinationType.APPEND,
                  displayName: 'Append data starting at the first empty row'
                },
                {
                  key: GoogleSheetsDestinationType.ROW_NUMBER,
                  value: GoogleSheetsDestinationType.ROW_NUMBER,
                  displayName: 'Replace data starting at a specific row'
                }
              ],
              initialValue: GoogleSheetsDestinationType.APPEND,
              rules: [{ required: true, message: 'Write location is required' }]
            },
            {
              label: 'Starting row number',
              name: 'rowNumber',
              startVersion: GoogleSheetsPluginVersions.V15,
              componentType: FormComponentType.CODE_EDITOR,
              placeholder: '2',
              language: EditorLanguage.TEXT,
              rules: [{ required: true, message: 'Starting row number is required' }],
              display: {
                show: {
                  action: [GoogleSheetsActionType.CREATE_SPREADSHEET_ROWS],
                  writeToDestinationType: [GoogleSheetsDestinationType.ROW_NUMBER]
                }
              }
            }
          ]
        },
        {
          name: 'Data to write',
          items: [
            {
              label: 'Rows to append',
              name: 'data',
              startVersion: GoogleSheetsPluginVersions.V15,
              componentType: FormComponentType.CODE_EDITOR,
              language: EditorLanguage.JSON,
              placeholder: `[
  {
    "name": "Billie Eilish",
    "email": "bad_guy@gmail.com",
    "date_joined": "2019-01-06"
  },
  {
    "name": "Katy Perry",
    "email": "kaycat@hotmail.com",
    "date_joined": "2019-01-06"
  }
]`,
              style: {
                minHeight: '350px'
              },
              display: {
                show: {
                  action: [GoogleSheetsActionType.APPEND_SPREADSHEET, GoogleSheetsActionType.CREATE_SPREADSHEET_ROWS]
                }
              },
              tooltip: {
                markdownText:
                  'Write rows either at the end of the spreadsheet or at the specified row number. [See an example in docs](https://docs.superblocks.com/integrations/integrations-library/google-sheets)'
              },
              rules: [{ required: true, message: 'An array of one or more row objects is required' }]
            }
          ]
        }
      ]
    }
  };
};
