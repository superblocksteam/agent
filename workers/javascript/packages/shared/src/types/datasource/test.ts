import { Plugin } from '../plugin';
import { DatasourceConfiguration } from '.';

export type DatasourceTestRequest = {
  datasourceConfig: DatasourceConfiguration;
  plugin: Plugin;
};

export type DatasourceTestResult = {
  message: string;
  success: boolean;
  systemError?: string;
};
