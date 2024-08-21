/* eslint-disable @typescript-eslint/no-explicit-any */
import _ from 'lodash';
import { ExecutionContext } from '../types';

/**
 * Convert all objects that represent a bytestring to a node.js Buffer or a Uint8Array.
 * Objects that that represent bytestrings are objects of the form {"type": "Buffer", data: [<array of bytes>]}.
 * This is the kind of object that node.js returns when a Buffer is stringified as JSON.
 * Note that as an optimization, the conversion (potentially) happens in place.
 * @param value           An object that will be converted in place and recursively
 * @param useNodeJSBuffer If true decode to node.js Buffer, otherwise use Uint8Array
 */
export function decodeBytestrings<T>(value: T, useNodeJSBuffer: boolean): T {
  if (_.isObject(value)) {
    if (
      (value as any).type === 'Buffer' &&
      Array.isArray((value as any).data) &&
      (value as any).data.every((x: unknown) => _.isNumber(x))
    ) {
      if (useNodeJSBuffer) {
        return Buffer.from(value as any) as unknown as T;
      } else {
        return new Uint8Array((value as any).data) as unknown as T;
      }
    } else {
      for (const key in value) {
        value[key] = decodeBytestrings(value[key], useNodeJSBuffer);
      }
    }
  } else if (Array.isArray(value)) {
    return value.map((val) => decodeBytestrings(val, useNodeJSBuffer)) as unknown as T;
  }
  return value;
}

export function decodeBytestringsExecutionContext(context: ExecutionContext, useNodeJSBuffer: boolean): void {
  for (const key in context.outputs) {
    context.outputs[key].output = decodeBytestrings(context.outputs[key].output, useNodeJSBuffer);
  }
}
