import { ApiExecutionResponse } from '../../types/api';
import { FetchAndExecuteProps } from '../execution';

export type PluginConfiguration = ConnectionPoolConfiguration &
  JavascriptPluginConfiguration &
  PythonPluginConfiguration &
  WorkflowPluginConfiguration &
  RestApiPluginConfiguration;

export type ConnectionPoolConfiguration = {
  connectionPoolIdleTimeoutMs: number;
};

export type JavascriptPluginConfiguration = {
  javascriptExecutionTimeoutMs: string;
};

export type PythonPluginConfiguration = {
  pythonExecutionTimeoutMs: string;
};

export type WorkflowPluginConfiguration = {
  workflowFetchAndExecuteFunc: (fetchAndExecuteProps: FetchAndExecuteProps) => Promise<ApiExecutionResponse>;
};

export type RestApiPluginConfiguration = {
  restApiExecutionTimeoutMs: number;
  restApiMaxContentLengthBytes: number;
};
