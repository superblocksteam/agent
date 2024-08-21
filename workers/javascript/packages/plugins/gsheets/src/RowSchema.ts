/* eslint-disable */
// This is a generated file, do not modify
import { getValidatorFunction } from '@superblocks/shared';
import type { ValidateFunction } from 'ajv';
import validate from './RowSchemaValidator';

export type RowsSchema = Record<string, unknown>[];

export const validateRowsSchema = getValidatorFunction<RowsSchema>(validate as ValidateFunction);
