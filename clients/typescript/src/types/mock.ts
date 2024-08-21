import { JsonValue } from './execution';

export type Mock = {
  filter?: Params;
  predicate?: Predicate;
  ret: Return;
};

export type Params = {
  integration?: string;
  stepName?: string;
  configuration?: object;
};

export type Return = JsonValue | ((params: Params) => JsonValue);

export type Function = (...inputs: any[]) => any;
export type Predicate = (...inputs: any[]) => boolean;
