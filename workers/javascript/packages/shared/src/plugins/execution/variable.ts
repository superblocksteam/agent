import { toVmValue, hostFunction } from '@superblocks/wasm-sandbox-js';
import { decodeBytestrings } from '../../utils';
import { VariableClient } from './utils';

export enum VariableType {
  Simple = 'TYPE_SIMPLE',
  Advanced = 'TYPE_ADVANCED',
  Native = 'TYPE_NATIVE'
}

export enum VariableMode {
  ReadWrite = 'MODE_READWRITE',
  Read = 'MODE_READ'
}

export const buildVariables = async (
  variableSpec: Record<string, { key: string; type: string; mode?: string }>,
  variableClient: VariableClient
): Promise<{ [key: string]: unknown }> => {
  const isObject = (thing) => {
    return thing !== null && thing !== undefined && typeof thing === 'object';
  };

  if (!isObject(variableSpec)) {
    throw new Error('Failed to build the variable: invalid variableSpec.');
  }

  const ret: Record<string, unknown> = {};
  const variablesReadInAdvance: Array<{ variableName: string; key: string; mode?: string; type: string }> = [];
  for (const [variableName, variableProperty] of Object.entries(variableSpec)) {
    if (!isObject(variableProperty)) {
      throw new Error(`Failed to build the variable: ${variableName}`);
    }

    const { key, type, mode } = variableProperty;

    const allowWrite = mode === VariableMode.ReadWrite;

    if (type === VariableType.Simple || type === VariableType.Native) {
      variablesReadInAdvance.push({ variableName, ...variableProperty });
    } else if (type === VariableType.Advanced) {
      ret[variableName] = new AdvancedVariable(key, variableClient, allowWrite);
    }
  }

  const values = (await variableClient.read(variablesReadInAdvance.map((variable) => variable.key))).data;

  for (let i = 0; i < variablesReadInAdvance.length; i++) {
    const { variableName, key, mode, type } = variablesReadInAdvance[i];
    const value = values[i];

    const allowWrite = mode === VariableMode.ReadWrite;

    if (type === VariableType.Simple) {
      ret[variableName] = new SimpleVariable(key, value, variableClient, allowWrite);
    } else {
      // adapt to the buffer type output
      if ((value as { output: unknown })?.output) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (value as any).output = decodeBytestrings((value as any).output, true);
      }
      ret[variableName] = value;
    }
  }

  return ret;
};

export class SimpleVariable {
  key;
  value;
  private variableClient;
  private allowWrite;

  constructor(key: string, initialValue: unknown, variableClient: VariableClient, allowWrite: boolean) {
    this.key = key;
    this.value = initialValue;
    this.variableClient = variableClient;
    this.allowWrite = allowWrite;
  }

  set(value: unknown): void {
    if (!this.allowWrite) {
      throw new Error('Write is not allowed.');
    }

    this.value = value;
    this.variableClient.writeBuffer(this.key, this.value);
  }

  [toVmValue]() {
    return {
      key: this.key,
      value: this.value,
      set: hostFunction(this.set.bind(this))
    };
  }
}

export class AdvancedVariable {
  key;
  private variableClient;
  private allowWrite;

  constructor(key: string, variableClient: VariableClient, allowWrite: boolean) {
    this.key = key;
    this.variableClient = variableClient;
    this.allowWrite = allowWrite;
  }

  async get(): Promise<unknown> {
    const raw = (await this.variableClient.read([this.key])).data;
    if (!raw || !raw.length) {
      throw new Error('Variable does not exist.');
    }

    try {
      return raw[0];
    } catch (e) {
      throw new Error('failed to parse the store value into object');
    }
  }

  async set(value: unknown): Promise<void> {
    if (!this.allowWrite) {
      throw new Error('Write is not allowed.');
    }

    try {
      await this.variableClient.write(this.key, value);
    } catch (e) {
      throw new Error(`failed to write to variable store: ${e}`);
    }
  }

  [toVmValue]() {
    return {
      key: this.key,
      get: hostFunction(this.get.bind(this)),
      set: hostFunction(this.set.bind(this))
    };
  }
}
