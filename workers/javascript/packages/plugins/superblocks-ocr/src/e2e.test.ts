import path from 'path';
import {
  DUMMY_EXECUTION_CONTEXT,
  ExecutionOutput,
  IntegrationError,
  PluginExecutionProps,
  RelayDelegate,
  SUPERBLOCKS_OCR_ACTION,
  SuperblocksOcrActionConfiguration,
  SuperblocksOcrDatasourceConfiguration
} from '@superblocks/shared';
import * as dotenv from 'dotenv';
import { cloneDeep } from 'lodash';
import SuperblocksOcrPlugin from '.';

// RUN: `npm run env:secrets:fetch:plugins` to fetch the latest plugin credentials
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const VALID_IMAGE_URL = 'https://cdn.graciousquotes.com/wp-content/uploads/2020/05/Aspire-to-inspire-before-we-expire..jpg';
const MICROSOFT_COMPUTER_VISION_API_KEY = process.env.MICROSOFT_COMPUTER_VISION_API_KEY;
const MICROSOFT_COMPUTER_VISION_BASE_URL = process.env.MICROSOFT_COMPUTER_VISION_BASE_URL;

const plugin = new SuperblocksOcrPlugin();

// @ts-ignore
plugin.logger = { debug: (): void => undefined };

const TEST_TIMEOUT_MS = 15000;

export const datasourceConfiguration = {
  microsoftComputerVisionApiKey: MICROSOFT_COMPUTER_VISION_API_KEY,
  microsoftComputerVisionResourceBaseUrl: MICROSOFT_COMPUTER_VISION_BASE_URL,
  name: 'SuperblocksOCR Plugin Tests'
} as SuperblocksOcrDatasourceConfiguration;

const actionConfiguration = {
  action: 'invalid',
  file: undefined,
  fileUrl: undefined
} as SuperblocksOcrActionConfiguration;

export const DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS = {
  files: [],
  agentCredentials: {},
  recursionContext: {
    executedWorkflowsPath: [],
    isEvaluatingDatasource: false
  },
  environment: 'dev',
  relayDelegate: new RelayDelegate({
    body: {},
    headers: {},
    query: {}
  })
};

const context = DUMMY_EXECUTION_CONTEXT;
const props: PluginExecutionProps<SuperblocksOcrDatasourceConfiguration, SuperblocksOcrActionConfiguration> = {
  context,
  datasourceConfiguration,
  actionConfiguration,
  mutableOutput: new ExecutionOutput(),
  ...DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS
};

describe('connection', () => {
  test(
    'connection succeeds with any config',
    async () => {
      await plugin.test({
        microsoftComputerVisionApiKey: 'im not real',
        microsoftComputerVisionResourceBaseUrl: 'im not real',
        name: 'SuperblocksOCR Plugin Tests'
      });
    },
    TEST_TIMEOUT_MS
  );
});

describe('execute', () => {
  test(
    'succeeds with url',
    async () => {
      const newProps = cloneDeep(props);
      newProps.actionConfiguration.action = SUPERBLOCKS_OCR_ACTION.FROM_URL;
      newProps.actionConfiguration.fileUrl = VALID_IMAGE_URL;
      const resp = await plugin.execute(newProps);
      expect(resp.output).toEqual('Aspire to inspire before\nwe expire.\nGRACIOUSQUOTES.COM');
    },
    TEST_TIMEOUT_MS
  );

  test(
    'fails with invalid extension',
    async () => {
      const newProps = cloneDeep(props);
      newProps.actionConfiguration.action = SUPERBLOCKS_OCR_ACTION.FROM_URL;
      newProps.actionConfiguration.fileUrl = 'https://foo.bad.extension.bad';
      await expect(async () => {
        await plugin.execute(newProps);
      }).rejects.toThrow(new IntegrationError('File type is not supported. Supported file types are: jpg, jpeg, png, bmp, pdf, tiff'));
    },
    TEST_TIMEOUT_MS
  );

  test(
    'fails with non-existing url',
    async () => {
      const newProps = cloneDeep(props);
      newProps.actionConfiguration.action = SUPERBLOCKS_OCR_ACTION.FROM_URL;
      newProps.actionConfiguration.fileUrl = 'https://i.dont.exist.jpg';
      await expect(async () => {
        await plugin.execute(newProps);
      }).rejects.toThrow(new IntegrationError('Error uploading file: Request failed with status code 400'));
    },
    TEST_TIMEOUT_MS
  );

  test(
    'fails with invalid computer vision url',
    async () => {
      const newProps = cloneDeep(props);
      newProps.actionConfiguration.action = SUPERBLOCKS_OCR_ACTION.FROM_URL;
      newProps.actionConfiguration.fileUrl = VALID_IMAGE_URL;
      newProps.datasourceConfiguration.microsoftComputerVisionResourceBaseUrl = 'https://invalid.cognitiveservices.azure.com/';

      await expect(async () => {
        await plugin.execute(newProps);
      }).rejects.toThrow(new IntegrationError('Error uploading file: getaddrinfo ENOTFOUND invalid.cognitiveservices.azure.com'));
    },
    TEST_TIMEOUT_MS
  );

  test(
    'fails with invalid computer vision api key',
    async () => {
      const newProps = cloneDeep(props);
      newProps.actionConfiguration.action = SUPERBLOCKS_OCR_ACTION.FROM_URL;
      newProps.actionConfiguration.fileUrl = VALID_IMAGE_URL;
      newProps.datasourceConfiguration.microsoftComputerVisionApiKey = 'invalid api key';

      await expect(async () => {
        await plugin.execute(newProps);
      }).rejects.toThrow(new IntegrationError('Error uploading file: Request failed with status code 401'));
    },
    TEST_TIMEOUT_MS
  );
});
