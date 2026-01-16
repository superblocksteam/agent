import { BindingKeyAndType, KVStore } from '../types';
import { StoreProperty, StreamProperty } from './decorators';
import { contextHandler } from './handlers';

export class PluginProps {
  @StreamProperty()
  actionConfiguration;

  @StreamProperty()
  agentCredentials;

  @StreamProperty()
  bindingKeys: BindingKeyAndType[];

  @StoreProperty(contextHandler)
  context;

  @StreamProperty()
  datasourceConfiguration;

  @StreamProperty()
  environment: string;

  @StreamProperty()
  executionId: string;

  @StreamProperty()
  files;

  @StreamProperty()
  recursionContext;

  redactedContext;

  @StreamProperty()
  redactedDatasourceConfiguration;

  @StreamProperty()
  relayDelegate;

  @StreamProperty()
  stepName: string;

  @StreamProperty()
  forwardedCookies?;

  @StreamProperty()
  $fileServerUrl: string;

  @StreamProperty()
  $flagWorker: boolean;

  @StreamProperty()
  quotas?;

  @StreamProperty()
  variables?: object;

  @StreamProperty()
  render?: boolean;

  @StreamProperty()
  useWasmBindingsSandbox?: boolean;

  store?: KVStore;

  version?: string;
}
