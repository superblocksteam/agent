import _ from 'lodash';
import { FieldListFormItem, FormComponentType, FormItem, InputFormItem, Plugin, Property, getRowItemsFromSectionItem } from '../types';

import { DatasourceConfiguration, InputDataType } from '../types';

export const MASKED_SECRET = '<redacted>';

export function maskSecrets(datasourceConfig: DatasourceConfiguration, plugin: Plugin): void {
  plugin?.datasourceTemplate?.sections.forEach((section) => {
    section.items.forEach((sectionItem) => {
      const rowItems = getRowItemsFromSectionItem(sectionItem);
      rowItems.forEach((item: FormItem) => {
        if ((item as InputFormItem).dataType === InputDataType.PASSWORD) {
          maskPassword(datasourceConfig, item);
        } else if (item.componentType === FormComponentType.FIELD_LIST) {
          maskFieldList(datasourceConfig, item);
        }
      });
    });
  });
}

function maskFieldList(datasourceConfig: DatasourceConfiguration, section: FieldListFormItem): void {
  section.secretsNames?.forEach((secret) => {
    (datasourceConfig[section.name] as Property[]).forEach((item) => {
      if (item.key?.toUpperCase() === secret?.toUpperCase()) {
        item.value = MASKED_SECRET;
      }
    });
  });
}

function maskPassword(datasourceConfig: DatasourceConfiguration, section: FormItem): void {
  _.set(datasourceConfig, section.name, MASKED_SECRET);
}

export function unmaskSecrets(
  datasourceConfig: DatasourceConfiguration,
  plugin: Plugin,
  originalConfiguration: DatasourceConfiguration
): void {
  plugin?.datasourceTemplate?.sections.forEach((section) => {
    section.items.forEach((sectionItem) => {
      const rowItems = getRowItemsFromSectionItem(sectionItem);
      rowItems.forEach((item: FormItem) => {
        if ((item as InputFormItem).dataType === InputDataType.PASSWORD) {
          unmaskPassword(datasourceConfig, item, originalConfiguration);
        }
        if (item.componentType === FormComponentType.FIELD_LIST) {
          unmaskFieldList(datasourceConfig, item, originalConfiguration);
        }
      });
    });
  });
}

function unmaskFieldList(
  datasourceConfig: DatasourceConfiguration,
  fieldList: FieldListFormItem,
  originalConfiguration: DatasourceConfiguration
) {
  if (fieldList.secretsNames) {
    (fieldList.secretsNames as string[]).forEach((secret) => {
      (datasourceConfig[fieldList.name] as Property[]).forEach((config) => {
        if (config.key === secret) {
          const originalValue: Property | undefined = _.find(
            originalConfiguration[fieldList.name] as Property[],
            (element) => element.key === secret,
            0
          );
          if (originalValue) {
            config.value = originalValue.value;
          }
        }
      });
    });
  }
}

function unmaskPassword(datasourceConfig: DatasourceConfiguration, item: FormItem, originalConfiguration: DatasourceConfiguration) {
  if (_.get(datasourceConfig, item.name) === MASKED_SECRET) {
    _.set(datasourceConfig, item.name, _.get(originalConfiguration, item.name));
  }
}
