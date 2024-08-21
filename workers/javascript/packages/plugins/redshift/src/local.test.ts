import path from 'path';
import { RedshiftDatasourceConfiguration } from '@superblocks/shared';
import * as dotenv from 'dotenv';
import RedshiftPlugin from '.';

jest.setTimeout(90000);

const plugin: RedshiftPlugin = new RedshiftPlugin();

// @ts-ignore
plugin.logger = { debug: (): void => undefined };

// RUN: `npm run env:secrets:fetch:plugins` to fetch the latest plugin credentials
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const LOCAL_DEV = process.env.REDSHIFT_LOCAL_DEV; // safeguard to prevent running these tests in CI
const HOST = process.env.REDSHIFT_HOST;
const PORT = process.env.REDSHIFT_PORT;
const USERNAME = process.env.REDSHIFT_USERNAME;
const PASSWORD = process.env.REDSHIFT_PASSWORD;
const DATABASE = process.env.REDSHIFT_DATABASE;

const runTests = LOCAL_DEV ? describe : describe.skip;

export const datasourceConfiguration = {
  connectionType: 'fields',
  endpoint: {
    host: HOST,
    port: PORT
  },
  authentication: {
    username: USERNAME,
    password: PASSWORD,
    custom: {
      databaseName: {
        value: DATABASE
      }
    }
  },
  name: '[Demo] Unit Test'
} as RedshiftDatasourceConfiguration;

export const datasourceConfigurationBasedOnUrl = {
  name: '[Demo] Unit Test',
  connectionType: 'url'
} as RedshiftDatasourceConfiguration;

runTests('MariaDB Test', () => {
  test('test connection with form fields', async () => {
    await plugin.test(datasourceConfiguration);
  });

  test('test connection with url', async () => {
    datasourceConfigurationBasedOnUrl.connectionUrl = `postgres://${USERNAME}:${PASSWORD}@${HOST}:${PORT}/${DATABASE}`;
    await plugin.test(datasourceConfigurationBasedOnUrl);
  });
});
