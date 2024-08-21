import { ExecutionContext, ExecutionOutput } from '@superblocks/shared';
import _ from 'lodash';
import { PluginProps } from '../plugin-props';

export interface PluginPropsBuilder {
  build(): Partial<PluginProps>;
}

export class FullPluginPropsBuilder implements PluginPropsBuilder {
  private _pluginProps = new PluginProps();

  constructor(pluginProps: Partial<PluginProps>) {
    if (_.isEmpty(pluginProps)) {
      throw new Error('Cannot load from empty plugin properties');
    }
    for (const [key, value] of Object.entries(pluginProps)) {
      this._pluginProps[key] = value;
    }
  }

  build(): PluginProps {
    return this._pluginProps;
  }
}

export class ExecutionOutputPropsBuilder implements PluginPropsBuilder {
  private _pluginProps: Partial<PluginProps> = {};

  constructor(executionId: string, stepName: string, output: ExecutionOutput, version: string) {
    if (_.isEmpty(output)) {
      throw new Error('Cannot load from empty plugin properties');
    }
    this._pluginProps.context = new ExecutionContext();
    this._pluginProps.executionId = executionId;
    this._pluginProps.context.addOutput(stepName, output);
    this._pluginProps.version = version;
  }

  build(): Partial<PluginProps> {
    return this._pluginProps;
  }
}
