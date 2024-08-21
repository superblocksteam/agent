import { BadRequestError } from '../errors';
import { DatasourceEnvironments, ENVIRONMENT_PRODUCTION, ENVIRONMENT_STAGING, VALID_DATASOURCE_ENVIRONMENTS } from '../types';

export function getDefaultEnvironment(isPublished: boolean): string {
  return isPublished ? ENVIRONMENT_PRODUCTION : ENVIRONMENT_STAGING;
}

export function getDefaultDatasourceEnvironment(isPublished: boolean): DatasourceEnvironments {
  return isPublished ? DatasourceEnvironments.PRODUCTION : DatasourceEnvironments.STAGING;
}

export function checkEnvironment(environment: string): string {
  if (!environment) {
    throw new BadRequestError(
      `Environment is missing. Please choose one of the following environments: '${VALID_DATASOURCE_ENVIRONMENTS}'`
    );
  }
  if (!VALID_DATASOURCE_ENVIRONMENTS.find((valid) => environment === valid)) {
    throw new BadRequestError(
      `An unsupported environment - '${environment}' - was provided. Please choose one of the following environments: '${VALID_DATASOURCE_ENVIRONMENTS}'`
    );
  }
  return environment;
}
