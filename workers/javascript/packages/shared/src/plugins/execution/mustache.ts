import Mustache from 'mustache';
import { TokenLocation } from '../../types/api';

// All variables are HTML-escaped by default in Mustache,
// override escape to disable it https://github.com/janl/mustache.js/#variables
Mustache.escape = function (text) {
  return text;
};

export class FlatContext extends Mustache.Context {
  cache: Record<string, unknown>;

  constructor(view: Record<string, unknown>, parentContext?: FlatContext & { view }) {
    super(view, parentContext);

    this.cache = parentContext ? parentContext.view : view;
  }
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const renderFieldValues = (object: any, context: any): void => {
  const flatContext = new FlatContext(context);

  Object.keys(object).forEach((key) => {
    const value = object[key];

    if (value instanceof Object) {
      renderFieldValues(value, context);
    }

    if (typeof value === 'string') {
      object[key] = Mustache.render(value, flatContext);
    }
  });
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const renderValue = (val: string, context: any): string => {
  const flatContext = new FlatContext(context);
  return Mustache.render(val, flatContext);
};

// map a bind to list of locations
// we need to use a list because the same binding might appear multiple times
export type BindingLocations = Record<string, TokenLocation[]>;

export interface RenderedValueWithLoc {
  renderedStr: string;
  bindingLocations: BindingLocations;
}

// like renderValue but includes location information for the values included in the output
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export const renderValueWithLoc = (val: string, context: any): RenderedValueWithLoc => {
  const flatContext = new FlatContext(context);
  const renderedStr: string = Mustache.render(val, flatContext);

  const bindingLocations: BindingLocations = {};
  const valTokens: [string, string, number, number][] = Mustache.parse(val);
  let offset = 0;
  for (const [type, payload, start, end] of valTokens) {
    if (type === 'name') {
      // payload is the string inside the mustache curly braces
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const v = (flatContext as any).lookup(payload);
      if (v !== null && v !== undefined) {
        (bindingLocations[payload] ?? (bindingLocations[payload] = [])).push({
          startOffset: offset,
          length: v.length
        });
        offset += v.length;
        continue;
      }
    }
    offset += end - start;
  }

  return { renderedStr, bindingLocations };
};

export const extractMustacheStrings = (input: string): Array<string> => {
  // 'name' refers to the value extracted out of mustache curly braces {{ }}
  return Mustache.parse(input)
    .filter((item) => item[0] === 'name')
    .map((item) => item[1]);
};
