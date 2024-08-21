import path from 'path';
import { describe, it } from '@jest/globals';
import {
  AgentCredentials,
  BasePlugin,
  DUMMY_EXECUTION_CONTEXT,
  ErrorCode,
  ExecutionContext,
  ExecutionOutput,
  OPEN_AI_ACTION,
  OPEN_AI_GENERATE_CODE_TYPES,
  OPEN_AI_GENERATE_IMAGE_TYPES,
  OPEN_AI_GENERATE_TEXT_TYPES,
  OPEN_AI_MODEL,
  OPEN_AI_SUPPORTED_IMAGE_SIZES,
  OpenAiActionConfiguration,
  OpenAiDatasourceConfiguration,
  PluginExecutionProps,
  RelayDelegate
} from '@superblocks/shared';
import * as dotenv from 'dotenv';
import { cloneDeep } from 'lodash';
import { default as OpenAiPlugin } from './index';

// RUN: `npm run env:secrets:fetch:plugins` to fetch the latest plugin credentials
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const TEST_TIMEOUT_MS = 10000;
// image gen takes longer
const IMAGE_TEST_TIMEOUT_MS = 15000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY as string;
const OPENAI_ORGANIZATION_ID = process.env.OPENAI_ORGANIZATION_ID as string;

const plugin: OpenAiPlugin = new OpenAiPlugin();

// @ts-ignore
plugin.logger = { debug: (): void => undefined };

export const datasourceConfiguration = {
  bearerToken: OPENAI_API_KEY,
  organizationId: OPENAI_ORGANIZATION_ID,
  name: 'OpenAI Plugin Tests'
} as OpenAiDatasourceConfiguration;

const actionConfiguration = {} as OpenAiActionConfiguration;

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
const props: PluginExecutionProps<OpenAiDatasourceConfiguration, OpenAiActionConfiguration> = {
  context,
  datasourceConfiguration,
  actionConfiguration,
  mutableOutput: new ExecutionOutput(),
  ...DUMMY_EXTRA_PLUGIN_EXECUTION_PROPS
};

describe('Streaming', () => {
  it.each([
    [
      {
        action: OPEN_AI_ACTION.GENERATE_TEXT,
        generateTextType: 'New Text',
        generateTextNewTextPrompt: 'return this text exactly as written: hello world',
        generateTextNewTextAiModel: 'text-davinci-003',
        generateTextNewTextMaxTokens: '256'
      },
      {
        error: 'This action is not streamable'
      }
    ],
    [
      {
        action: OPEN_AI_ACTION.GENERATE_CHATGPT_RESPONSE,
        generateChatGptResponsePrompt: 'return this text exactly as written: hello world',
        generateChatGPTResponseAiModel: OPEN_AI_MODEL.GPT_3_5_TURBO,
        generateChatGptResponseMaxTokens: '256'
      },
      {
        result: ['hello', 'world']
      }
    ]
  ])('stream', async (aConfig: OpenAiActionConfiguration, expected: { result?: string[]; error?: string }) => {
    const plugin: BasePlugin = new OpenAiPlugin();
    const chunks: Array<unknown> = [];

    try {
      await plugin.stream(
        {
          actionConfiguration: aConfig,
          datasourceConfiguration: {
            bearerToken: process.env.OPENAI_API_KEY as string
          },

          // The fact that these aren't optional makes testing a pain.
          files: {},
          mutableOutput: new ExecutionOutput(),
          context: new ExecutionContext(),
          agentCredentials: new AgentCredentials({
            jwt: 'omg'
          }),
          recursionContext: {
            executedWorkflowsPath: [],
            isEvaluatingDatasource: false
          },
          relayDelegate: new RelayDelegate({
            body: {
              relays: {}
            }
          })
        },
        async (chunk: unknown): Promise<void> => {
          chunks.push(chunk);
        }
      );
    } catch (e) {
      if (expected.error) {
        expect(e.message).toContain(expected.error);
        return;
      } else {
        throw e;
      }
    }

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.join('')).toBe('hello world');
  });
});

describe('Connection', () => {
  test(
    'connection succeeds with basic config',
    async () => {
      await plugin.test(datasourceConfiguration);
    },
    TEST_TIMEOUT_MS
  );

  test(
    'connection succeeds without organization id',
    async () => {
      const newDatasourceConfiguration = cloneDeep(datasourceConfiguration);
      newDatasourceConfiguration.organizationId = undefined;
      await plugin.test(newDatasourceConfiguration);
    },
    TEST_TIMEOUT_MS
  );

  test(
    'connection fails with bad bearer token',
    async () => {
      const newDatasourceConfiguration = cloneDeep(datasourceConfiguration);
      newDatasourceConfiguration.bearerToken = 'bad token';
      await plugin
        .test(newDatasourceConfiguration)
        .then((_) => {
          expect('should not pass').toEqual(true);
        })
        .catch((err) => {
          expect(err.message).toMatch('Invalid API Key: ******ken');
          expect(err.code).toBe(ErrorCode.INTEGRATION_AUTHORIZATION);
        });
    },
    TEST_TIMEOUT_MS
  );

  test(
    'connection fails with bad organization id',
    async () => {
      const newDatasourceConfiguration = cloneDeep(datasourceConfiguration);
      newDatasourceConfiguration.organizationId = 'bad organization id';
      await plugin
        .test(newDatasourceConfiguration)
        .then((_) => {
          expect('should not pass').toEqual(true);
        })
        .catch((err) => {
          expect(err.message).toMatch('Invalid Organization ID: bad organization id');
          expect(err.code).toBe(ErrorCode.INTEGRATION_AUTHORIZATION);
        });
    },
    TEST_TIMEOUT_MS
  );
});

describe('GenerateChatGptResponse', () => {
  test(
    'succeeds with basic config',
    async () => {
      const newProps = cloneDeep(props);
      newProps.actionConfiguration.action = OPEN_AI_ACTION.GENERATE_CHATGPT_RESPONSE;
      newProps.actionConfiguration.generateChatGPTResponseAiModel = OPEN_AI_MODEL.GPT_3_5_TURBO;
      newProps.actionConfiguration.generateChatGptResponsePrompt = 'test';
      const resp = await plugin.execute(newProps);
      const request = plugin.getRequest(newProps.actionConfiguration, newProps.datasourceConfiguration);
      expect(request).toContain(`curl --location --request POST 'https://api.openai.com/v1/chat/completions'`);
      expect(request).toContain(`"model": "gpt-3.5-turbo"`);
      expect(request).toContain(`"max_tokens": 256`);
      expect(request).toContain(`"messages": [`);
      expect(request).not.toContain(`"temperature"`);
      expect((resp.output as Record<string, unknown>).openAiReply).toBeTruthy();
    },
    TEST_TIMEOUT_MS
  );

  test(
    'succeeds with temperature',
    async () => {
      const newProps = cloneDeep(props);
      newProps.actionConfiguration.action = OPEN_AI_ACTION.GENERATE_CHATGPT_RESPONSE;
      newProps.actionConfiguration.generateChatGPTResponseAiModel = OPEN_AI_MODEL.GPT_3_5_TURBO;
      newProps.actionConfiguration.generateChatGptResponsePrompt = 'test';
      newProps.actionConfiguration.temperature = '0.5';
      const resp = await plugin.execute(newProps);
      const request = plugin.getRequest(newProps.actionConfiguration, newProps.datasourceConfiguration);
      expect(request).toContain(`curl --location --request POST 'https://api.openai.com/v1/chat/completions'`);
      expect(request).toContain(`"model": "gpt-3.5-turbo"`);
      expect(request).toContain(`"max_tokens": 256`);
      expect(request).toContain(`"messages": [`);
      expect(request).toContain(`"temperature": 0.5`);
      expect((resp.output as Record<string, unknown>).openAiReply).toBeTruthy();
    },
    TEST_TIMEOUT_MS
  );
});

describe('GenerateText [NEW TEXT]', () => {
  test(
    'succeeds with basic config',
    async () => {
      const newProps = cloneDeep(props);
      newProps.actionConfiguration.action = OPEN_AI_ACTION.GENERATE_TEXT;
      newProps.actionConfiguration.generateTextType = OPEN_AI_GENERATE_TEXT_TYPES.NEW_TEXT;
      newProps.actionConfiguration.generateTextNewTextAiModel = OPEN_AI_MODEL.GPT_3_5_TURBO_INSTRUCT;
      newProps.actionConfiguration.generateTextNewTextPrompt = 'test';
      const resp = await plugin.execute(newProps);
      const request = plugin.getRequest(newProps.actionConfiguration, newProps.datasourceConfiguration);
      expect(request).toContain(`curl --location --request POST 'https://api.openai.com/v1/completions'`);
      expect(request).toContain(`"model": "gpt-3.5-turbo-instruct"`);
      expect(request).toContain(`"max_tokens": 256`);
      expect(request).not.toContain(`"temperature"`);
      expect((resp.output as Record<string, unknown>).openAiReply).toBeTruthy();
    },
    TEST_TIMEOUT_MS
  );

  test(
    'succeeds with temperature',
    async () => {
      const newProps = cloneDeep(props);
      newProps.actionConfiguration.action = OPEN_AI_ACTION.GENERATE_TEXT;
      newProps.actionConfiguration.generateTextType = OPEN_AI_GENERATE_TEXT_TYPES.NEW_TEXT;
      newProps.actionConfiguration.generateTextNewTextAiModel = OPEN_AI_MODEL.GPT_3_5_TURBO_INSTRUCT;
      newProps.actionConfiguration.generateTextNewTextPrompt = 'test';
      newProps.actionConfiguration.temperature = '0.5';
      const resp = await plugin.execute(newProps);
      const request = plugin.getRequest(newProps.actionConfiguration, newProps.datasourceConfiguration);
      expect(request).toContain(`curl --location --request POST 'https://api.openai.com/v1/completions'`);
      expect(request).toContain(`"model": "gpt-3.5-turbo-instruct"`);
      expect(request).toContain(`"max_tokens": 256`);
      expect(request).toContain(`"temperature": 0.5`);
      expect((resp.output as Record<string, unknown>).openAiReply).toBeTruthy();
    },
    TEST_TIMEOUT_MS
  );
});

// FIXME: the only model for this is deprecated
describe.skip('GenerateText [EDIT TEXT]', () => {
  test(
    'succeeds with basic config',
    async () => {
      const newProps = cloneDeep(props);
      newProps.actionConfiguration.action = OPEN_AI_ACTION.GENERATE_TEXT;
      newProps.actionConfiguration.generateTextType = OPEN_AI_GENERATE_TEXT_TYPES.EDIT_TEXT;
      newProps.actionConfiguration.generateTextEditTextAiModel = OPEN_AI_MODEL.TEXT_DAVINCI_EDIT_001;
      newProps.actionConfiguration.generateTextEditTextTextToEdit = 'test1';
      newProps.actionConfiguration.generateTextEditTextPrompt = 'test2';
      const resp = await plugin.execute(newProps);
      const request = plugin.getRequest(newProps.actionConfiguration, newProps.datasourceConfiguration);
      expect(request).toContain(`curl --location --request POST 'https://api.openai.com/v1/edits'`);
      expect(request).toContain(`"model": "text-davinci-edit-001"`);
      expect(request).not.toContain(`"temperature"`);
      expect((resp.output as Record<string, unknown>).openAiReply).toBeTruthy();
    },
    TEST_TIMEOUT_MS
  );

  test(
    'succeeds with temperature',
    async () => {
      const newProps = cloneDeep(props);
      newProps.actionConfiguration.action = OPEN_AI_ACTION.GENERATE_TEXT;
      newProps.actionConfiguration.generateTextType = OPEN_AI_GENERATE_TEXT_TYPES.EDIT_TEXT;
      newProps.actionConfiguration.generateTextEditTextAiModel = OPEN_AI_MODEL.TEXT_DAVINCI_EDIT_001;
      newProps.actionConfiguration.generateTextEditTextTextToEdit = 'test1';
      newProps.actionConfiguration.generateTextEditTextPrompt = 'test2';
      newProps.actionConfiguration.temperature = '0.5';
      const resp = await plugin.execute(newProps);
      const request = plugin.getRequest(newProps.actionConfiguration, newProps.datasourceConfiguration);
      expect(request).toContain(`curl --location --request POST 'https://api.openai.com/v1/edits'`);
      expect(request).toContain(`"model": "text-davinci-edit-001"`);
      expect(request).toContain(`"temperature": 0.5`);
      expect((resp.output as Record<string, unknown>).openAiReply).toBeTruthy();
    },
    TEST_TIMEOUT_MS
  );
});

describe('GenerateCode [NEW CODE]', () => {
  test(
    'succeeds with basic config',
    async () => {
      const newProps = cloneDeep(props);
      newProps.actionConfiguration.action = OPEN_AI_ACTION.GENERATE_CODE;
      newProps.actionConfiguration.generateCodeType = OPEN_AI_GENERATE_CODE_TYPES.NEW_CODE;
      newProps.actionConfiguration.generateCodeNewCodeAiModel = OPEN_AI_MODEL.GPT_3_5_TURBO;
      newProps.actionConfiguration.generateCodeNewCodePrompt = 'test';
      const resp = await plugin.execute(newProps);
      const request = plugin.getRequest(newProps.actionConfiguration, newProps.datasourceConfiguration);
      expect(request).toContain(`curl --location --request POST 'https://api.openai.com/v1/chat/completions'`);
      expect(request).toContain(`"model": "gpt-3.5-turbo"`);
      expect(request).not.toContain(`"temperature"`);
      expect((resp.output as Record<string, unknown>).openAiReply).toBeTruthy();
    },
    TEST_TIMEOUT_MS
  );

  test(
    'succeeds with temperature',
    async () => {
      const newProps = cloneDeep(props);
      newProps.actionConfiguration.action = OPEN_AI_ACTION.GENERATE_CODE;
      newProps.actionConfiguration.generateCodeType = OPEN_AI_GENERATE_CODE_TYPES.NEW_CODE;
      newProps.actionConfiguration.generateCodeNewCodeAiModel = OPEN_AI_MODEL.GPT_3_5_TURBO;
      newProps.actionConfiguration.generateCodeNewCodePrompt = 'test';
      newProps.actionConfiguration.temperature = '0.5';
      const resp = await plugin.execute(newProps);
      const request = plugin.getRequest(newProps.actionConfiguration, newProps.datasourceConfiguration);
      expect(request).toContain(`curl --location --request POST 'https://api.openai.com/v1/chat/completions'`);
      expect(request).toContain(`"model": "gpt-3.5-turbo"`);
      expect(request).toContain(`"temperature"`);
      expect((resp.output as Record<string, unknown>).openAiReply).toBeTruthy();
    },
    TEST_TIMEOUT_MS
  );
});

// FIXME: the only model for this is deprecated
describe.skip('GenerateCode [EDIT CODE]', () => {
  test(
    'succeeds with basic config',
    async () => {
      const newProps = cloneDeep(props);
      newProps.actionConfiguration.action = OPEN_AI_ACTION.GENERATE_CODE;
      newProps.actionConfiguration.generateCodeType = OPEN_AI_GENERATE_CODE_TYPES.EDIT_CODE;
      newProps.actionConfiguration.generateCodeEditCodeAiModel = OPEN_AI_MODEL.CODE_DAVINCI_EDIT_001;
      newProps.actionConfiguration.generateCodeEditCodePrompt = 'test1';
      newProps.actionConfiguration.generateCodeEditCodeCodeToEdit = 'test2';
      const resp = await plugin.execute(newProps);
      const request = plugin.getRequest(newProps.actionConfiguration, newProps.datasourceConfiguration);
      expect(request).toContain(`curl --location --request POST 'https://api.openai.com/v1/edits'`);
      expect(request).toContain(`"model": "code-davinci-edit-001"`);
      expect(request).not.toContain(`"temperature"`);
      expect((resp.output as Record<string, unknown>).openAiReply).toBeTruthy();
    },
    TEST_TIMEOUT_MS
  );

  test(
    'succeeds with temperature',
    async () => {
      const newProps = cloneDeep(props);
      newProps.actionConfiguration.action = OPEN_AI_ACTION.GENERATE_CODE;
      newProps.actionConfiguration.generateCodeType = OPEN_AI_GENERATE_CODE_TYPES.EDIT_CODE;
      newProps.actionConfiguration.generateCodeEditCodeAiModel = OPEN_AI_MODEL.CODE_DAVINCI_EDIT_001;
      newProps.actionConfiguration.generateCodeEditCodePrompt = 'test1';
      newProps.actionConfiguration.generateCodeEditCodeCodeToEdit = 'test2';
      newProps.actionConfiguration.temperature = '0.5';
      const resp = await plugin.execute(newProps);
      const request = plugin.getRequest(newProps.actionConfiguration, newProps.datasourceConfiguration);
      expect(request).toContain(`curl --location --request POST 'https://api.openai.com/v1/edits'`);
      expect(request).toContain(`"model": "code-davinci-edit-001"`);
      expect(request).toContain(`"temperature"`);
      expect((resp.output as Record<string, unknown>).openAiReply).toBeTruthy();
    },
    TEST_TIMEOUT_MS
  );
});

describe('GenerateImage [Generate From Prompt]', () => {
  test(
    'succeeds with basic config',
    async () => {
      const newProps = cloneDeep(props);
      newProps.actionConfiguration.action = OPEN_AI_ACTION.GENERATE_IMAGE;
      newProps.actionConfiguration.generateImageGenerateFromPromptPrompt = 'small image';
      newProps.actionConfiguration.generateImageGenerateFromPromptImageImageSize = OPEN_AI_SUPPORTED_IMAGE_SIZES[0];
      newProps.actionConfiguration.generateImageMethod = OPEN_AI_GENERATE_IMAGE_TYPES.GENERATE_FROM_PROMPT;
      const resp = await plugin.execute(newProps);
      const request = plugin.getRequest(newProps.actionConfiguration, newProps.datasourceConfiguration);
      expect(request).toContain("curl --location --request POST 'https://api.openai.com/v1/images/generations'");
      expect(request).toContain('"prompt": "small image"');
      expect((resp.output as Record<string, unknown>).openAiReply).toBeTruthy();
    },
    IMAGE_TEST_TIMEOUT_MS
  );
});

describe('CheckModeration', () => {
  test(
    'succeeds with basic config',
    async () => {
      const newProps = cloneDeep(props);
      newProps.actionConfiguration.action = OPEN_AI_ACTION.CHECK_MODERATION;
      newProps.actionConfiguration.checkModerationText = 'hello';
      newProps.actionConfiguration.checkModerationAiModel = OPEN_AI_MODEL.TEXT_MODERATION_LATEST;
      const resp = await plugin.execute(newProps);
      const request = plugin.getRequest(newProps.actionConfiguration, newProps.datasourceConfiguration);
      expect(request).toContain("curl --location --request POST 'https://api.openai.com/v1/moderations'");
      expect(request).toContain('"model": "text-moderation-latest"');
      expect(request).toContain('"input": "hello"');
      expect((resp.output as Record<string, unknown>).openAiReply).toBeTruthy();
    },
    TEST_TIMEOUT_MS
  );
});

describe('GenerateTextEmbedding', () => {
  test(
    'succeeds with basic config',
    async () => {
      const newProps = cloneDeep(props);
      newProps.actionConfiguration.action = OPEN_AI_ACTION.GENERATE_TEXT_EMBEDDING;
      newProps.actionConfiguration.embeddingText = 'a';
      newProps.actionConfiguration.generateTextEmbeddingAiModel = OPEN_AI_MODEL.TEXT_EMBEDDING_ADA_002;
      const resp = await plugin.execute(newProps);
      const request = plugin.getRequest(newProps.actionConfiguration, newProps.datasourceConfiguration);
      expect(request).toContain("curl --location --request POST 'https://api.openai.com/v1/embeddings'");
      expect(request).toContain('"model": "text-embedding-ada-002"');
      expect(request).toContain('"input": "a"');
      expect((resp.output as Record<string, unknown>).openAiReply).toBeTruthy();
    },
    TEST_TIMEOUT_MS
  );
});

describe('Errors', () => {
  test(
    'fails with invalid low temperature',
    async () => {
      const newProps = cloneDeep(props);
      newProps.actionConfiguration.action = OPEN_AI_ACTION.GENERATE_TEXT;
      newProps.actionConfiguration.generateTextType = OPEN_AI_GENERATE_TEXT_TYPES.NEW_TEXT;
      newProps.actionConfiguration.generateTextNewTextAiModel = OPEN_AI_MODEL.TEXT_DAVINCI_003;
      newProps.actionConfiguration.generateTextNewTextPrompt = 'test';
      newProps.actionConfiguration.temperature = '-0.1';
      await plugin
        .execute(newProps)
        .then((_) => {
          expect('should not pass').toEqual(true);
        })
        .catch((err) => {
          expect(err.message).toMatch('Temperature must be in range [0, 2].');
          expect(err.code).toBe(ErrorCode.INTEGRATION_SYNTAX);
        });
    },
    TEST_TIMEOUT_MS
  );

  test(
    'fails with invalid high temperature',
    async () => {
      const newProps = cloneDeep(props);
      newProps.actionConfiguration.action = OPEN_AI_ACTION.GENERATE_TEXT;
      newProps.actionConfiguration.generateTextType = OPEN_AI_GENERATE_TEXT_TYPES.NEW_TEXT;
      newProps.actionConfiguration.generateTextNewTextAiModel = OPEN_AI_MODEL.TEXT_DAVINCI_003;
      newProps.actionConfiguration.generateTextNewTextPrompt = 'test';
      newProps.actionConfiguration.temperature = '2.1';
      await plugin
        .execute(newProps)
        .then((_) => {
          expect('should not pass').toEqual(true);
        })
        .catch((err) => {
          expect(err.message).toMatch('Temperature must be in range [0, 2].');
          expect(err.code).toBe(ErrorCode.INTEGRATION_SYNTAX);
        });
    },
    TEST_TIMEOUT_MS
  );
});
