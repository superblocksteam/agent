import { randomUUID } from 'crypto';
import { ExecutionContext, ExecutionOutput } from '@superblocks/shared';
import _ from 'lodash';
import { BindingType, KV } from '../types';
import { deepContains } from '../utils';
import { PluginProps } from './plugin-props';

/**
 * How to read the property from the store and parse back to the property value
 */
export type ReadOp = {
  // Store keys to read
  keys: string[];
  // After retriving the values using the keys,
  // parse the store values back to the property key and property value
  build: (values: object[]) => object;
};

/**
 * How to write the property to the remote store
 */
export type WriteOp = KV[];

/**
 * Store handler defines how to store the property to kv store,
 * and how to read the property from kv store.
 */
export abstract class StoreHandler {
  /**
   * Telling {@link PluginPropsWriter} how to write plugin props to store
   * @param executionId
   * @param propertyValue
   */
  abstract prepareWrite(executionId: string, propertyValue: object, version: string): WriteOp;

  /**
   * Telling {@link PluginPropsReader} how to read plugin props from store
   * @param streamProps This is necessary to make the store read on demand
   */
  abstract prepareRead(streamProps: Partial<PluginProps>): ReadOp;
}

enum ContextCategory {
  Global = 'context.global',
  Output = 'context.output',
  OutputV2 = 'context.output.v2',
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  UI = 'context.global'
}

/**
 * We will save the context to the store using multiple keys:
 * 1. context.global.{global_var_name}
 * 2. context.output.{output_var_name}
 * 3. context.global.{ui_var_name}
 */
class ContextHandler extends StoreHandler {
  prepareWrite(executionId: string, propertyValue: ExecutionContext, version: string): WriteOp {
    const writeOp: WriteOp = [];
    // Global bindings, under context.global.{key}
    ContextHandler.loadShallow(propertyValue.globals, executionId, ContextCategory.Global, writeOp);

    if (version === undefined || version === 'v1' || version === '') {
      // Output bindings, under context.output.{key}
      ContextHandler.loadShallow(propertyValue.outputs, executionId, ContextCategory.Output, writeOp);
    } else if (version === 'v2') {
      // Output bindings, under context.output.{key}
      ContextHandler.loadShallow(propertyValue.outputs, executionId, ContextCategory.OutputV2, writeOp);
    } else {
      throw new Error(`Unknown plugin property version ${version}`);
    }

    // UI bindings, under context.global.{key}
    ContextHandler.loadShallow(propertyValue, executionId, ContextCategory.UI, writeOp, ['globals', 'outputs']);

    return writeOp;
  }

  /**
   * Fetch the context bindings on demand. We use a string match on action configuration
   *   to determine which bindings are referenced by our best guess.
   */
  prepareRead({ executionId, bindingKeys, actionConfiguration, variables }: Partial<PluginProps>): ReadOp {
    if (variables !== undefined) {
      const build = (values: object[]) => {
        const ctx = new ExecutionContext();
        return ctx;
      };

      return { keys: [], build };
    }

    const keys = [];
    bindingKeys = bindingKeys.filter(({ key }) => deepContains(actionConfiguration, key));
    for (const { key, type } of bindingKeys) {
      switch (type) {
        case BindingType.Global: {
          keys.push(ContextHandler.storeKey(executionId, ContextCategory.Global, key));
          break;
        }
        case BindingType.Output: {
          keys.push(ContextHandler.storeKey(executionId, ContextCategory.Output, key));
          break;
        }
      }
    }

    const build = (values: object[]) => {
      const ctx = new ExecutionContext();

      for (let i = 0; i < bindingKeys.length; i++) {
        const { type, key } = bindingKeys[i];
        const value = values[i];

        switch (type) {
          case BindingType.Global: {
            ctx.addGlobalVariable(key, value);
            break;
          }
          case BindingType.Output: {
            ctx.addOutput(key, value as ExecutionOutput);
            break;
          }
        }
      }
      return ctx;
    };

    return { keys, build };
  }

  /**
   * Shallow load the object props and parse them into write ops
   * @param obj The object to load
   * @param executionId
   * @param category
   * @param op
   * @param omit
   * @private
   */
  private static loadShallow(obj: object, executionId: string, category: ContextCategory, op: WriteOp, omit: string[] = []) {
    if (!_.isEmpty(obj)) {
      for (const [k, v] of Object.entries(obj)) {
        if (omit.includes(k)) {
          continue;
        }
        op.push({ key: this.storeKey(executionId, category, k), value: v });
      }
    }
  }

  private static storeKey(executionId: string, category: ContextCategory, key: string) {
    const uuid = randomUUID();
    if (category === ContextCategory.OutputV2) {
      return `${executionId}.output.${uuid}`;
    }

    return `${executionId}.${category}.${key}`;
  }
}

export const contextHandler = new ContextHandler();
