import { AuthorizationExtraParams, AuthorizationStateConfig, ClientAuthMethod } from '../../plugins';
import { AuthConfig, AuthType, DynamicWorkflowConfig, TokenScope } from '../datasource';
import { AgentType } from '../organization';

export interface FormTemplate {
  sections: FormSection[];
}

// TODO Support multi-level nesting
export interface FormSection {
  name: string;
  sectionHeader?: string;
  items: (FormItem | FormRow)[];
  display?: FormItemDisplay;
  layout?: FormSectionLayout;
  borderThreshold?: number;
  isCollapsible?: boolean;
  defaultCollapsed?: boolean;
  asTitle?: boolean;
}

export enum FormSectionLayout {
  TABS = 'TABS'
}

// this follows the css grid spec
// we can extend this to support more grid layouts
type GridDisplay = {
  // css for grid-template-columns, e.g. "20% 1fr 1fr" to let the first column take 20% of the width and the rest of the columns take equal space
  gridTemplateColumns?: string;
  gridTemplateGap?: number;
};
export interface FormRow {
  rowItems: FormItem[];
  gridCss?: GridDisplay;
  subtitle?: string;
}

export const isFormItem = (item: FormItem | FormRow): item is FormItem => {
  return (item as FormRow).rowItems === undefined;
};

export const getRowItemsFromSectionItem = (sectionItem: FormItem | FormRow): FormItem[] => {
  const isRow = !isFormItem(sectionItem);
  const rowItems = isRow ? (sectionItem as FormRow).rowItems : [sectionItem];
  return rowItems as FormItem[];
};

export type FormItem =
  | DefaultFormItem // Fallback case
  | AlertFormItem
  | InputFormItem
  | DynamicInputFormItem
  | CodeEditorFormItem
  | DropdownFormItem
  | DynamicDropdownFormItem
  | MetadataDropdownFormItem
  | FieldListFormItem
  | ButtonFormItem
  | RadioFormItem
  | CheckboxFormItem
  | DynamicInputWithMetadataOptionsFormItem
  | UrlInputFormItem
  | SwitchFormItem;

export enum FormComponentType {
  ALERT = 'ALERT',
  INPUT_TEXT = 'INPUT_TEXT',
  INPUT_AREA = 'INPUT_AREA',
  DYNAMIC_INPUT_TEXT = 'DYNAMIC_INPUT_TEXT',
  CODE_EDITOR = 'CODE_EDITOR',
  FIELD_LIST = 'FIELD_LIST',
  FIELD_LIST_FORM = 'FIELD_LIST_FORM',
  DYNAMIC_FIELD_LIST = 'DYNAMIC_FIELD_LIST',
  DROPDOWN = 'DROPDOWN',
  DYNAMIC_DROPDOWN = 'DYNAMIC_DROPDOWN',
  METADATA_DROPDOWN = 'METADATA_DROPDOWN',
  CHECKBOX = 'CHECKBOX',
  SWITCH = 'SWITCH',
  RADIO = 'RADIO',
  PRIMARY_KEY_DISPLAY = 'PRIMARY_KEY_DISPLAY',
  KEY_MAPPING = 'KEY_MAPPING',
  FILTER_COLUMNS = 'FILTER_COLUMNS',
  SQL_PREVIEW = 'SQL_PREVIEW',
  SQL_PREVIEW_WITH_INSERT_DELETE = 'SQL_PREVIEW_WITH_INSERT_DELETE',
  // for openAPI
  OPENAPI_ACTION_DROPDOWN = 'OPENAPI_ACTION_DROPDOWN',
  // enable the dynamic text to autocomplete with a set of options from metadata
  DYNAMIC_INPUT_WITH_METADATA_OPTIONS = 'DYNAMIC_INPUT_WITH_METADATA_OPTIONS',
  // combines base url and relative path
  URL_INPUT_TEXT = 'URL_INPUT_TEXT',
  BUTTON = 'BUTTON',
  ONEOF_ACTION_DROPDOWN = 'ONEOF_ACTION_DROPDOWN',
  COPY_BOX = 'COPY_BOX'
}

export enum DisplayUnsupportedState {
  // TODO(taha) We can potentially add mixed states
  // for when incompatibilty occurs due to a not yet
  // supported field vs a deprecated field
  HIDE = 'hide',
  DISABLE = 'disable'
}

export enum TooltipIconType {
  WARNING = 'warning',
  INFO = 'info'
}

export type FormItemTooltip = {
  markdownText: string;
  icon?: string;
  iconType?: TooltipIconType;
};

export enum FormItemTransformation {
  BYTE_ARRAY = 'BYTE_ARRAY'
}

export interface BaseFormItem {
  name: string;
  secondaryName?: string;
  label: string;
  // startVersion and endVersion are inclusive.
  // For example, {startVersion=1, endVersion=3} indicates that the field is valid at version 1 and version 2.
  startVersion: string;
  endVersion?: string;
  agentVersion?: string;
  display?: FormItemDisplay;
  // If true, the form item value will not be cleared when dependencies (decided by display field) change
  doNotClearOnDependenciesChange?: boolean;
  initialValue?: InitialValue;
  secondaryInitialValue?: InitialValue;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rules?: any[];
  style?: FormItemStyle;
  disabled?: boolean;
  disabledPairCount?: number;
  tooltip?: FormItemTooltip;
  subHeading?: string;
  singleLine?: boolean;
  displayUnsupported?: DisplayUnsupportedState;
  hidden?: boolean;
  triggerGetMetadata?: boolean;
  immutable?: boolean;
  agentType?: AgentType;
  actionOptions?: { label?: string; value: string; children: { label: string; value: string; description?: string }[] }[];
  transformation?: FormItemTransformation;
  ldFlag?: string;
}

export type InitialValue = string | number | boolean | KVPair[];

// Shortcut to avoid creating a type for each component type
export interface DefaultFormItem extends BaseFormItem {
  componentType: Exclude<
    FormComponentType,
    | FormComponentType.ALERT
    | FormComponentType.BUTTON
    | FormComponentType.INPUT_TEXT
    | FormComponentType.DYNAMIC_INPUT_TEXT
    | FormComponentType.DROPDOWN
    | FormComponentType.DYNAMIC_DROPDOWN
    | FormComponentType.METADATA_DROPDOWN
    | FormComponentType.CODE_EDITOR
    | FormComponentType.FIELD_LIST
    | FormComponentType.FIELD_LIST_FORM
    | FormComponentType.DYNAMIC_FIELD_LIST
    | FormComponentType.RADIO
    | FormComponentType.CHECKBOX
    | FormComponentType.DYNAMIC_INPUT_WITH_METADATA_OPTIONS
    | FormComponentType.URL_INPUT_TEXT
    | FormComponentType.SWITCH
    | FormComponentType.COPY_BOX
  >;
  placeholder?: string;
}

export interface FormItemDisplay {
  show?: Record<string, string[]>;
}

export interface FormItemStyle {
  minHeight?: string;
}

export interface SwitchFormItem extends BaseFormItem {
  componentType: FormComponentType.SWITCH;
  showConfirm?: boolean;
  confirmTitle?: string;
  subtitle?: string;
  renderIconFirst?: boolean;
}

export interface InputFormItem extends BaseFormItem {
  componentType: FormComponentType.INPUT_TEXT;
  placeholder?: string;
  dataType?: InputDataType;
  minNumber?: number;
  subtitle?: string;
  enableCopy?: boolean;
  // load value from an environment variable, useful for displaying environment-specific values
  initialValueFromEnv?: string;
  // use TEXT_INPUT instead of using dynamic forms, needed for certain features e.g. copy button
  forcedStatic?: boolean;
}

export interface DynamicInputFormItem extends BaseFormItem {
  componentType: FormComponentType.DYNAMIC_INPUT_TEXT;
  placeholder?: string;
  dataType?: InputDataType;
  subtitle?: string;
  showHideIcon?: boolean;
}

export interface UrlInputFormItem extends BaseFormItem {
  componentType: FormComponentType.URL_INPUT_TEXT;
  placeholder?: string;
  subtitle?: string;
}

export enum InputDataType {
  NUMBER = 'NUMBER',
  PASSWORD = 'PASSWORD'
}

export interface KVPair {
  key: string;
  value: string;
  editable?: boolean;
  // indicates that the value must be treated like a file
  // we use an object in case we have to add more metadata to the file in the future
  file?: {
    filename: string;
  };
  system?: boolean;
}

export interface TenantInput {
  label?: string;
  placeholder?: string;
  initialValue?: string;
  subtitle?: string;
}

export interface FieldListFormItem extends BaseFormItem {
  componentType: FormComponentType.FIELD_LIST | FormComponentType.FIELD_LIST_FORM | FormComponentType.DYNAMIC_FIELD_LIST;
  secretsNames?: string[];
  collapseValue?: string;
}

export interface CodeEditorFormItem extends BaseFormItem {
  componentType: FormComponentType.CODE_EDITOR;
  placeholder?: string;
  language: EditorLanguage;
}

export enum EditorLanguage {
  TEXT = 'TEXT',
  SQL = 'SQL',
  JSON = 'JSON',
  JAVASCRIPT = 'JAVASCRIPT',
  PYTHON = 'PYTHON'
}

export interface DropdownFormItem extends BaseFormItem {
  componentType: FormComponentType.DROPDOWN;
  options: DropdownOption[];
  showSearch?: boolean;
  optionFilterProp?: string;
  subtitle?: string;
  // this property decides if we want to render the selected option with the same styles shown in options instead of the pure text in input
  renderSelectedOptionWithStyles?: boolean;
}

export interface AlertFormItem extends BaseFormItem {
  componentType: FormComponentType.ALERT;
  messageTemplate?: string; // supports ERB template, see http://underscorejs.org/#template
  type?: 'success' | 'warning' | 'info' | 'error';
  showIcon?: boolean;
}

export interface DynamicDropdownFormItem extends BaseFormItem {
  componentType: FormComponentType.DYNAMIC_DROPDOWN;
  fetchOptions: () => Promise<DropdownOption[]>;
  extraOptions?: Record<string, DropdownOption & { onClick: () => void }>;
}

export interface MetadataDropdownFormItem extends BaseFormItem {
  componentType: FormComponentType.METADATA_DROPDOWN;
  dependencyFieldName?: string;
  childIteratorAccessor?: string;
  keyAccessor: string;
  valueAccessor: string;
  displayNameAccessor: string;
  listAccessor?: string;
  defaultToFirstOption?: boolean;
  clearDependentFieldsOnChange?: string[];
  filterDependency?: string;
  filterFieldName?: string;
  showSearch?: boolean;
  optionFilterProp?: string;
  placeholder?: string;
  gSheetsPagination?: boolean;
}

export interface DynamicInputWithMetadataOptionsFormItem extends BaseFormItem {
  componentType: FormComponentType.DYNAMIC_INPUT_WITH_METADATA_OPTIONS;
  dependencyFieldName?: string;
  valueAccessor: string;
  listAccessor?: string;
  defaultToFirstOption?: boolean;
  clearDependentFieldsOnChange?: string[];
  filterDependency?: string;
  filterFieldName?: string;
  optionFilterProp?: string;
  placeholder?: string;
  dataType?: InputDataType;
  subtitle?: string;
}

export type ButtonType = 'revokeOAuthTokens' | 'connectOAuth';

export type RevokeOAuthTokensPayload = {
  buttonType: 'revokeOAuthTokens';
  eventAttributes: {
    integrationId: string;
    configurationId: string;
    authType?: AuthType;
    authConfig?: {
      tokenScope: TokenScope;
      revokeTokenUrl: string;
    };
  };
};

export type ConnectOAuthPayload = {
  buttonType: 'connectOAuth';
  eventAttributes: {
    integrationId: string;
    configurationId: string;
    pluginId: string;
    accessType?: string;
    responseType?: string;
    stateConfigExclude?: AuthorizationStateConfig[];
    owner?: string;
    authType?: AuthType;
    authConfig?: {
      clientId: string;
      clientSecret: string;
      scope: string;
      tokenUrl: string;
      authorizationUrl: string;
      userInfoUrl?: string;
      refreshTokenFromServer?: boolean;
      tokenScope: TokenScope;
      clientAuthMethod?: ClientAuthMethod;
    };
    dynamicWorkflowConfiguration?: DynamicWorkflowConfig;
  };
};

export type ButtonClickPayload = RevokeOAuthTokensPayload | ConnectOAuthPayload;

export type ButtonClickErrorPayload = {
  buttonType: ButtonType;
  error: string | undefined;
};

export type LoadButtonPayloadInit = {
  buttonType: ButtonType;
  eventAttributes: {
    integrationId: string;
    integrationConfigurationId: string;
    authType?: AuthType;
    authConfig?: AuthConfig;
  };
};

export type LoadButtonPayloadSuccess = {
  buttonType: ButtonType;
  disabled: boolean;
};

export type ExtraValues = {
  pluginId: string;
} & AuthorizationExtraParams;

export interface ButtonFormItem extends BaseFormItem {
  componentType: FormComponentType.BUTTON;
  buttonType: ButtonType;
  valuesFromContext?: string[];
  extraValues?: ExtraValues;
  iconUrl?: string;
  dependencies?: string[];
}

export interface RadioFormItem extends BaseFormItem {
  componentType: FormComponentType.RADIO;
  options: DropdownOption[];
}

export type MapBooleansTo = {
  true: string;
  false: string;
};

export type ValidateReduxPathItem = {
  selector: 'selectHasConnectedTokens';
  validValue: unknown;
  errorMessage: string;
};

export type ValidateReduxPath = {
  true?: ValidateReduxPathItem;
  false?: ValidateReduxPathItem;
};

export interface CheckboxFormItem extends BaseFormItem {
  componentType: FormComponentType.CHECKBOX;
  mapBooleansTo?: MapBooleansTo;
  validateReduxPath?: ValidateReduxPath;
}

export interface DropdownOption {
  key: string;
  value: string;
  enumValue?: number;
  displayName?: string;
  subText?: string;
  subTextPosition?: 'bottom' | 'right';
  parentKey?: string;
  isGroupHeader?: boolean;
  groupName?: string;
  textColor?: string;
  prefixText?: string;
  prefixColor?: string;
  prefixWidth?: number;
  hasDivider?: boolean;
}
