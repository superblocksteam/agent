import Ajv, { ValidateFunction } from 'ajv';
import ajvErrors from 'ajv-errors';
import addFormats from 'ajv-formats';
import { BadRequestError } from '../errors';

export const ajv = new Ajv({ coerceTypes: true, allErrors: true, allowUnionTypes: true });
addFormats(ajv);
ajvErrors(ajv);

export function getValidatorFunction<T>(validator: ValidateFunction): (params: unknown) => T {
  return (params: unknown): T => {
    const isValid = validator(params);

    if (!isValid) {
      throw new BadRequestError(ajv.errorsText(validator.errors));
    }
    return params as T;
  };
}
