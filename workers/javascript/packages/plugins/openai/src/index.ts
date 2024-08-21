import { Readable } from 'stream';
import {
  ActionConfiguration,
  ActionResponseType,
  ApiPlugin,
  DatasourceConfiguration,
  DatasourceMetadataDto,
  ErrorCode,
  ExecutionContext,
  ExecutionOutput,
  FileMetadataPrivate,
  getFileStream,
  IntegrationError,
  isReadableFile,
  isReadableFileConstructor,
  makeCurlString,
  OPEN_AI_ACTION,
  OPEN_AI_DEFAULT_MAX_TOKENS,
  OPEN_AI_DEFAULT_TEMPERATURE,
  OPEN_AI_ENDPOINT_DATA,
  OPEN_AI_GENERATE_CODE_TYPES,
  OPEN_AI_GENERATE_IMAGE_TYPES,
  OPEN_AI_GENERATE_TEXT_TYPES,
  OPEN_AI_MAX_TEMPERATURE,
  OPEN_AI_MIN_TEMPERATURE,
  OPEN_AI_TRANSCRIBE_LANGUAGES_AND_ISO_639_1_CODES,
  OpenAiActionConfiguration,
  OpenAiData,
  OpenAiDatasourceConfiguration,
  PluginExecutionProps,
  Property,
  RawRequest,
  RequestFiles,
  RestApiBodyDataType,
  StreamOptions
} from '@superblocks/shared';
import axios, { AxiosRequestConfig, Method } from 'axios';
import FormData from 'form-data';
import { isEmpty } from 'lodash';
import 'openai/shims/node';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources';

type MethodOrUndefined = Method | undefined;
type ChatGPTMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

const GENERATE_NEW_CODE_PROMPT =
  "You are a helpful assistant that generates code from a user's prompt. Respond only with code snippets. No extra text.";

export default class OpenAiPlugin extends ApiPlugin {
  pluginName = 'OpenAI';
  REQUEST_TIMEOUT_MS = 90000;
  CHAT_GPT_AVATAR_URL = 'https://superblocks.s3.us-west-2.amazonaws.com/img/integrations/chat_gpt_logo.png';

  dynamicProperties(): Array<string> {
    return [
      'generateChatGptResponsePrompt',
      'generateChatGptResponseMessageHistory',
      'generateChatGptResponseSystemInstruction',
      'generateTextNewTextPrompt',
      'generateTextEditTextTextToEdit',
      'generateTextEditTextPrompt',
      'generateCodeNewCodePrompt',
      'generateCodeEditCodeCodeToEdit',
      'generateCodeEditCodePrompt',
      'checkModerationText',
      'embeddingText',
      'generateImageGenerateFromPromptPrompt',
      'generateImageEditImagePrompt',
      'generateImageEditImageImageFileToEdit',
      'generateImageEditImageImageMask',
      'generateImageVaryImageImageFile',
      'transcribeAudioToTextAudioFile',
      'generateChatGptResponseMaxTokens',
      'generateTextNewTextMaxTokens',
      'generateCodeNewCodeMaxTokens',
      'temperature'
    ];
  }

  public async stream(
    props: PluginExecutionProps<OpenAiDatasourceConfiguration, OpenAiActionConfiguration>,
    send: (_message: unknown) => Promise<void>,
    _options: StreamOptions
  ): Promise<void> {
    const streamableEndpoints = ['https://api.openai.com/v1/chat/completions'];

    const endpoint: string = this.getRequestEndpoint(props.actionConfiguration);

    if (!streamableEndpoints.includes(endpoint)) {
      throw new IntegrationError('This action is not streamable.', ErrorCode.INTEGRATION_LOGIC, { pluginName: this.pluginName });
    }
    const openai = new OpenAI({
      apiKey: props.datasourceConfiguration.bearerToken,
      organization: props.datasourceConfiguration.organizationId
    });

    const body = (await this.getRequestBody(props.context, props.actionConfiguration, props.files)) as {
      messages: ChatCompletionMessageParam[];
      model: string;
    };
    const stream = await openai.chat.completions.create({
      ...{ stream: true },
      ...body
    });

    // Sends each content stream chunk-by-chunk, such that the client
    // ultimately receives a single string.
    for await (const chunk of stream) {
      await send(chunk.choices[0]?.delta.content || '');
    }
  }

  async execute({
    context,
    datasourceConfiguration,
    actionConfiguration,
    files
  }: PluginExecutionProps<OpenAiDatasourceConfiguration, OpenAiActionConfiguration>): Promise<ExecutionOutput> {
    const startTimestampStr = this.getCurrentTimestampString();
    const endpoint = this.getRequestEndpoint(actionConfiguration);
    const data = await this.getRequestBody(context, actionConfiguration, files);
    this.addCommonParams(endpoint, actionConfiguration, data);
    let headers = this.getRequestHeaders(actionConfiguration, datasourceConfiguration);
    if (this.isSendingFiles(actionConfiguration)) {
      headers = {
        ...headers,
        ...(data as FormData).getHeaders()
      };
    }
    const axiosConfig: AxiosRequestConfig = {
      url: endpoint,
      method: 'post' as MethodOrUndefined,
      headers: headers,
      data: data,
      timeout: this.REQUEST_TIMEOUT_MS
    };
    let response = await this.executeRequest(axiosConfig, ActionResponseType.JSON);
    if (actionConfiguration.action?.toUpperCase() === OPEN_AI_ACTION.GENERATE_CHATGPT_RESPONSE.toUpperCase()) {
      response = this.modifyGenerateChatGptResponse(response, actionConfiguration, startTimestampStr);
    } else if (actionConfiguration.action?.toUpperCase() == OPEN_AI_ACTION.GENERATE_CODE.toUpperCase()) {
      response = this.modifyGenerateCodeResponse(response, actionConfiguration);
    }
    response = this.aliasFirstChoice(response, actionConfiguration);
    return response;
  }

  addCommonParams(endpoint: string, actionConfiguration: OpenAiActionConfiguration, data: Record<string, unknown> | FormData): void {
    const endpointData: OpenAiData | undefined = OPEN_AI_ENDPOINT_DATA[endpoint];
    if (endpointData !== undefined) {
      if (endpointData.supportedOptionalParameters.includes('temperature') && actionConfiguration.temperature) {
        data['temperature'] = this.getTemperature(actionConfiguration.temperature);
      }
    }
  }

  aliasFirstChoice(response: ExecutionOutput, actionConfiguration: OpenAiActionConfiguration): ExecutionOutput {
    if (response.output === null || typeof response.output !== 'object') {
      return response;
    }

    switch (actionConfiguration.action?.toUpperCase()) {
      case OPEN_AI_ACTION.GENERATE_TEXT.toUpperCase():
      case OPEN_AI_ACTION.GENERATE_CODE.toUpperCase(): {
        if (response?.output?.['choices'][0]?.text) {
          // for edit code
          response.output['openAiReply'] = response.output['choices'][0].text;
        } else if (response?.output?.['choices'][0]?.message) {
          // for new code
          response.output['openAiReply'] = response.output['choices'][0]['message'].content;
        }
        break;
      }
      case OPEN_AI_ACTION.GENERATE_CHATGPT_RESPONSE.toUpperCase(): {
        if (response?.output?.['choices'][0]?.message) {
          response.output['openAiReply'] = response.output['choices'][0]['message'].content;
        }
        break;
      }
      case OPEN_AI_ACTION.GENERATE_IMAGE.toUpperCase(): {
        if (response?.output?.['data'][0]?.url) {
          response.output['openAiReply'] = response.output['data'][0].url;
        }
        break;
      }
      case OPEN_AI_ACTION.GENERATE_TEXT_EMBEDDING.toUpperCase(): {
        if (response?.output?.['data'][0]?.embedding) {
          response.output['openAiReply'] = response.output['data'][0].embedding;
        }
        break;
      }
      case OPEN_AI_ACTION.TRANSCRIBE_AUDIO_TO_TEXT.toUpperCase(): {
        if (response?.output?.['text']) {
          response.output['openAiReply'] = response.output['text'];
        }
        break;
      }
      case OPEN_AI_ACTION.CHECK_MODERATION.toUpperCase(): {
        if (response?.output?.['results']) {
          response.output['openAiReply'] = response.output['results'];
        }
        break;
      }
    }

    return response;
  }

  modifyGenerateChatGptResponse(
    response: ExecutionOutput,
    actionConfiguration: OpenAiActionConfiguration,
    latestUserMessageTimestampString: string
  ): ExecutionOutput {
    if (response.output !== null && typeof response.output === 'object') {
      // get message history in correct form
      const oldMessageHistory = JSON.parse(actionConfiguration.generateChatGptResponseMessageHistory ?? '[]');
      // make FULL message history
      // add timestamps to new message and reply
      const latestChatGptReply = response.output['choices'][0]?.message;
      latestChatGptReply['timestamp'] = this.getCurrentTimestampString();
      const latestUserMessage = {
        role: 'user',
        content: actionConfiguration.generateChatGptResponsePrompt ?? '',
        timestamp: latestUserMessageTimestampString
      };
      // add the latest user message and latest chat gpt reply to full message history
      const fullMessageHistory = [...oldMessageHistory, latestUserMessage, latestChatGptReply];
      // remove system 'messages'
      const filteredMessageHistory = fullMessageHistory.filter((obj) => obj.role !== 'system');
      // populate name and avatar
      response.output['messageHistory'] = filteredMessageHistory.map((obj) => {
        if (obj.role === 'assistant') {
          return { ...obj, avatar: this.CHAT_GPT_AVATAR_URL, name: 'OpenAI' };
        } else if (obj.role === 'user') {
          return { ...obj, name: 'You' };
        } else {
          return obj;
        }
      });
    }
    return response;
  }

  modifyGenerateCodeResponse(response: ExecutionOutput, actionConfiguration: OpenAiActionConfiguration): ExecutionOutput {
    if (
      response.output !== null &&
      typeof response.output === 'object' &&
      actionConfiguration.generateCodeType === OPEN_AI_GENERATE_CODE_TYPES.NEW_CODE
    ) {
      const responseString = response.output['choices'][0]?.message.content;
      // strip ``` from beginning and end if there
      if (responseString.startsWith('```') && responseString.endsWith('```') && responseString.length >= 7) {
        response.output['choices'][0].message.content = responseString.slice(3, -3);
      }
      // strip leading and trailing whitespace
      response.output['choices'][0].message.content = response.output['choices'][0].message.content.trim();
    }
    return response;
  }

  isSendingFiles(actionConfiguration: OpenAiActionConfiguration): boolean {
    let response = false;
    switch (actionConfiguration.action?.toUpperCase()) {
      case OPEN_AI_ACTION.TRANSCRIBE_AUDIO_TO_TEXT.toUpperCase():
        response = true;
        break;
      case OPEN_AI_ACTION.GENERATE_IMAGE.toUpperCase():
        if (
          [OPEN_AI_GENERATE_IMAGE_TYPES.EDIT_IMAGE, OPEN_AI_GENERATE_IMAGE_TYPES.VARY_IMAGE]
            .map((x) => x.toString())
            .includes(actionConfiguration.generateImageMethod ?? '')
        ) {
          response = true;
        }
        break;
      default:
        break;
    }
    return response;
  }

  getRequestHeaders(
    actionConfiguration: OpenAiActionConfiguration,
    datasourceConfiguration: OpenAiDatasourceConfiguration
  ): AxiosRequestConfig['headers'] {
    let contentType = 'application/json';
    if (this.isSendingFiles(actionConfiguration)) {
      contentType = 'multipart/form-data';
    }
    const headers = {
      'Content-Type': contentType,
      Accept: 'application/json',
      Authorization: `Bearer ${datasourceConfiguration.bearerToken}`
    };
    if (datasourceConfiguration.organizationId) {
      headers['OpenAI-Organization'] = datasourceConfiguration.organizationId;
    }
    return headers;
  }

  getRequestHeadersAsProps(
    actionConfiguration: OpenAiActionConfiguration,
    datasourceConfiguration: OpenAiDatasourceConfiguration
  ): Property[] {
    let contentType = 'application/json';
    if (this.isSendingFiles(actionConfiguration)) {
      contentType = 'multipart/form-data';
    }

    const headersAsProps = [
      { key: 'Content-Type', value: contentType },
      { key: 'Accept', value: 'application/json' },
      { key: 'Authorization', value: 'Bearer <redacted>' }
    ];
    if (datasourceConfiguration.organizationId) {
      headersAsProps.push({ key: 'OpenAI-Organization', value: datasourceConfiguration.organizationId });
    }
    return headersAsProps;
  }

  getRequestEndpoint(actionConfiguration: OpenAiActionConfiguration): string {
    // we need to do a CASE INSENSITIVE search
    switch (actionConfiguration.action?.toUpperCase()) {
      case OPEN_AI_ACTION.GENERATE_CHATGPT_RESPONSE.toUpperCase():
        return 'https://api.openai.com/v1/chat/completions';
      case OPEN_AI_ACTION.GENERATE_TEXT.toUpperCase():
        if (actionConfiguration.generateTextType === OPEN_AI_GENERATE_TEXT_TYPES.NEW_TEXT) {
          return 'https://api.openai.com/v1/completions';
        } else if (actionConfiguration.generateTextType === OPEN_AI_GENERATE_TEXT_TYPES.EDIT_TEXT) {
          return 'https://api.openai.com/v1/edits';
        } else {
          throw new IntegrationError('Invalid type for generate text.', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
            pluginName: this.pluginName
          });
        }
      case OPEN_AI_ACTION.GENERATE_CODE.toUpperCase():
        if (actionConfiguration.generateCodeType === OPEN_AI_GENERATE_CODE_TYPES.NEW_CODE) {
          return 'https://api.openai.com/v1/chat/completions';
        } else if (actionConfiguration.generateCodeType === OPEN_AI_GENERATE_CODE_TYPES.EDIT_CODE) {
          return 'https://api.openai.com/v1/edits';
        } else {
          throw new IntegrationError('Invalid type for generate code.', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
            pluginName: this.pluginName
          });
        }
      case OPEN_AI_ACTION.CHECK_MODERATION.toUpperCase():
        return 'https://api.openai.com/v1/moderations';
      case OPEN_AI_ACTION.GENERATE_TEXT_EMBEDDING.toUpperCase():
        return 'https://api.openai.com/v1/embeddings';
      case OPEN_AI_ACTION.GENERATE_IMAGE.toUpperCase():
        if (actionConfiguration.generateImageMethod === OPEN_AI_GENERATE_IMAGE_TYPES.GENERATE_FROM_PROMPT) {
          return 'https://api.openai.com/v1/images/generations';
        } else if (actionConfiguration.generateImageMethod === OPEN_AI_GENERATE_IMAGE_TYPES.EDIT_IMAGE) {
          return 'https://api.openai.com/v1/images/edits';
        } else if (actionConfiguration.generateImageMethod === OPEN_AI_GENERATE_IMAGE_TYPES.VARY_IMAGE) {
          return 'https://api.openai.com/v1/images/variations';
        } else {
          throw new IntegrationError('Invalid method for generate image.', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
            pluginName: this.pluginName
          });
        }
      case OPEN_AI_ACTION.TRANSCRIBE_AUDIO_TO_TEXT.toUpperCase():
        if (actionConfiguration.transcribeAudioToTextTranslateToEnglish) {
          return 'https://api.openai.com/v1/audio/translations';
        }
        return 'https://api.openai.com/v1/audio/transcriptions';
      default:
        throw new IntegrationError(
          `Invalid action ${actionConfiguration.action}. Valid options are: ${Object.values(OPEN_AI_ACTION).join(', ')}`,
          ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD,
          {
            pluginName: this.pluginName
          }
        );
    }
  }

  async getRequestBody(
    context: ExecutionContext,
    actionConfiguration: OpenAiActionConfiguration,
    files: RequestFiles
  ): Promise<Record<string, unknown> | FormData> {
    switch (actionConfiguration.action?.toUpperCase()) {
      case OPEN_AI_ACTION.GENERATE_CHATGPT_RESPONSE.toUpperCase():
        return this.getGenerateChatGptResponseBody(actionConfiguration);

      case OPEN_AI_ACTION.GENERATE_TEXT.toUpperCase():
        if (actionConfiguration.generateTextType === OPEN_AI_GENERATE_TEXT_TYPES.NEW_TEXT) {
          return this.getGenerateTextNewTextBody(actionConfiguration);
        } else if (actionConfiguration.generateTextType === OPEN_AI_GENERATE_TEXT_TYPES.EDIT_TEXT) {
          return this.getGenerateTextEditTextBody(actionConfiguration);
        } else {
          throw new IntegrationError(
            'Invalid generate code type when getting request body.',
            ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD,
            { pluginName: this.pluginName }
          );
        }

      case OPEN_AI_ACTION.GENERATE_CODE.toUpperCase():
        if (actionConfiguration.generateCodeType === OPEN_AI_GENERATE_CODE_TYPES.NEW_CODE) {
          return this.getGenerateCodeNewCodeBody(actionConfiguration);
        } else if (actionConfiguration.generateCodeType === OPEN_AI_GENERATE_CODE_TYPES.EDIT_CODE) {
          return this.getGenerateCodeEditCodeBody(actionConfiguration);
        } else {
          throw new IntegrationError('Invalid generate code type when getting request body', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
            pluginName: this.pluginName
          });
        }

      case OPEN_AI_ACTION.CHECK_MODERATION.toUpperCase():
        return this.getModerationBody(actionConfiguration);

      case OPEN_AI_ACTION.GENERATE_TEXT_EMBEDDING.toUpperCase():
        return this.getEmbeddingBody(actionConfiguration);

      case OPEN_AI_ACTION.GENERATE_IMAGE.toUpperCase():
        if (actionConfiguration.generateImageMethod === OPEN_AI_GENERATE_IMAGE_TYPES.GENERATE_FROM_PROMPT) {
          return this.getGenerateImageBody(actionConfiguration);
        } else if (actionConfiguration.generateImageMethod === OPEN_AI_GENERATE_IMAGE_TYPES.EDIT_IMAGE) {
          return await this.getEditImageBody(context, actionConfiguration, files);
        } else if (actionConfiguration.generateImageMethod === OPEN_AI_GENERATE_IMAGE_TYPES.VARY_IMAGE) {
          return await this.getVaryImageBody(context, actionConfiguration, files);
        } else {
          throw new IntegrationError('Invalid method for generate image.', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
            pluginName: this.pluginName
          });
        }

      case OPEN_AI_ACTION.TRANSCRIBE_AUDIO_TO_TEXT.toUpperCase():
        if (actionConfiguration.transcribeAudioToTextTranslateToEnglish) {
          return await this.getAudioTranslateBody(context, actionConfiguration, files);
        }
        return await this.getAudioTranscribeBody(context, actionConfiguration, files);

      default:
        throw new IntegrationError(
          `Invalid action ${actionConfiguration.action}. Valid options are: ${Object.values(OPEN_AI_ACTION).join(', ')}`,
          ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD,
          {
            pluginName: this.pluginName
          }
        );
    }
  }

  getDisplayRequestBody(actionConfiguration: OpenAiActionConfiguration): Record<string, unknown> {
    switch (actionConfiguration.action?.toUpperCase()) {
      case OPEN_AI_ACTION.GENERATE_CHATGPT_RESPONSE.toUpperCase():
        return this.getGenerateChatGptResponseBody(actionConfiguration);
      case OPEN_AI_ACTION.GENERATE_TEXT.toUpperCase():
        if (actionConfiguration.generateTextType === OPEN_AI_GENERATE_TEXT_TYPES.NEW_TEXT) {
          return this.getGenerateTextNewTextBody(actionConfiguration);
        } else if (actionConfiguration.generateTextType === OPEN_AI_GENERATE_TEXT_TYPES.EDIT_TEXT) {
          return this.getGenerateTextEditTextBody(actionConfiguration);
        } else {
          throw new IntegrationError(
            'Invalid generate code type when getting request body.',
            ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD,
            { pluginName: this.pluginName }
          );
        }
      case OPEN_AI_ACTION.GENERATE_CODE.toUpperCase():
        if (actionConfiguration.generateCodeType === OPEN_AI_GENERATE_CODE_TYPES.NEW_CODE) {
          return this.getGenerateCodeNewCodeBody(actionConfiguration);
        } else if (actionConfiguration.generateCodeType === OPEN_AI_GENERATE_CODE_TYPES.EDIT_CODE) {
          return this.getGenerateCodeEditCodeBody(actionConfiguration);
        } else {
          throw new IntegrationError('Invalid generate code type when getting request body', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
            pluginName: this.pluginName
          });
        }
      case OPEN_AI_ACTION.CHECK_MODERATION.toUpperCase():
        return this.getModerationBody(actionConfiguration);
      case OPEN_AI_ACTION.GENERATE_TEXT_EMBEDDING.toUpperCase():
        return this.getEmbeddingBody(actionConfiguration);
      case OPEN_AI_ACTION.GENERATE_IMAGE.toUpperCase():
        if (actionConfiguration.generateImageMethod === OPEN_AI_GENERATE_IMAGE_TYPES.GENERATE_FROM_PROMPT) {
          return this.getGenerateImageBody(actionConfiguration);
        } else if (actionConfiguration.generateImageMethod === OPEN_AI_GENERATE_IMAGE_TYPES.EDIT_IMAGE) {
          return this.getEditImageDisplayBody(actionConfiguration);
        } else if (actionConfiguration.generateImageMethod === OPEN_AI_GENERATE_IMAGE_TYPES.VARY_IMAGE) {
          return this.getVaryImageDisplayBody(actionConfiguration);
        } else {
          throw new IntegrationError('Invalid method for generate image.', ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD, {
            pluginName: this.pluginName
          });
        }
      case OPEN_AI_ACTION.TRANSCRIBE_AUDIO_TO_TEXT.toUpperCase():
        if (actionConfiguration.transcribeAudioToTextTranslateToEnglish) {
          return this.getAudioTranslateDisplayBody(actionConfiguration);
        }
        return this.getAudioTranscribeDisplayBody(actionConfiguration);
      default:
        throw new IntegrationError(
          `Invalid action ${actionConfiguration.action}. Valid options are: ${Object.values(OPEN_AI_ACTION).join(', ')}`,
          ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD,
          {
            pluginName: this.pluginName
          }
        );
    }
  }

  getGenerateTextNewTextBody(actionConfiguration: OpenAiActionConfiguration): Record<string, unknown> {
    const data = {
      model: actionConfiguration.generateTextNewTextAiModel,
      prompt: actionConfiguration.generateTextNewTextPrompt
    };
    let maxTokensToUse = OPEN_AI_DEFAULT_MAX_TOKENS;

    if (actionConfiguration.generateTextNewTextMaxTokens) {
      maxTokensToUse = parseInt(actionConfiguration.generateTextNewTextMaxTokens);
      if (isNaN(maxTokensToUse)) {
        throw new IntegrationError(
          `Max Response Length must be a valid integer. '${actionConfiguration.generateTextNewTextMaxTokens}' is not valid.`,
          ErrorCode.INTEGRATION_SYNTAX,
          { pluginName: this.pluginName }
        );
      } else if (maxTokensToUse <= 0) {
        throw new IntegrationError('Max Response Length must be greater than 0.', ErrorCode.INTEGRATION_SYNTAX, {
          pluginName: this.pluginName
        });
      }
    }
    data['max_tokens'] = maxTokensToUse;
    return data;
  }

  getGenerateTextEditTextBody(actionConfiguration: OpenAiActionConfiguration): Record<string, unknown> {
    return {
      model: actionConfiguration.generateTextEditTextAiModel,
      input: actionConfiguration.generateTextEditTextTextToEdit,
      instruction: actionConfiguration.generateTextEditTextPrompt
    };
  }

  getGenerateCodeNewCodeBody(actionConfiguration: OpenAiActionConfiguration): Record<string, unknown> {
    const messages: ChatGPTMessage[] = [
      { role: 'system', content: GENERATE_NEW_CODE_PROMPT },
      { role: 'user', content: actionConfiguration.generateCodeNewCodePrompt ?? '' }
    ];
    return {
      model: actionConfiguration.generateCodeNewCodeAiModel,
      messages: messages
    };
  }

  getGenerateCodeEditCodeBody(actionConfiguration: OpenAiActionConfiguration): Record<string, unknown> {
    return {
      model: actionConfiguration.generateCodeEditCodeAiModel,
      input: actionConfiguration.generateCodeEditCodeCodeToEdit,
      instruction: actionConfiguration.generateCodeEditCodePrompt
    };
  }

  getModerationBody(actionConfiguration: OpenAiActionConfiguration): Record<string, unknown> {
    return {
      model: actionConfiguration.checkModerationAiModel,
      input: actionConfiguration.checkModerationText
    };
  }

  getEmbeddingBody(actionConfiguration: OpenAiActionConfiguration): Record<string, unknown> {
    return {
      model: actionConfiguration.generateTextEmbeddingAiModel,
      input: actionConfiguration.embeddingText
    };
  }

  getGenerateChatGptResponseBody(actionConfiguration: OpenAiActionConfiguration): Record<string, unknown> {
    const messages: ChatGPTMessage[] = [];
    if (!isEmpty(actionConfiguration.generateChatGptResponseSystemInstruction)) {
      messages.push({ role: 'system', content: actionConfiguration.generateChatGptResponseSystemInstruction ?? '' });
    }
    if (!isEmpty(actionConfiguration.generateChatGptResponseMessageHistory)) {
      if (actionConfiguration.generateChatGptResponseMessageHistory) {
        // remove avatar and name from given messages so OpenAI can consume
        const cleanedMessages = JSON.parse(actionConfiguration.generateChatGptResponseMessageHistory).map((message) => ({
          role: message.role,
          content: message.content
        }));
        messages.push(...cleanedMessages);
      }
    }
    if (!isEmpty(actionConfiguration.generateChatGptResponsePrompt)) {
      messages.push({ role: 'user', content: actionConfiguration.generateChatGptResponsePrompt ?? '' });
    }
    let maxTokensToUse = OPEN_AI_DEFAULT_MAX_TOKENS;
    if (actionConfiguration.generateChatGptResponseMaxTokens) {
      maxTokensToUse = parseInt(actionConfiguration.generateChatGptResponseMaxTokens);
      if (isNaN(maxTokensToUse)) {
        throw new IntegrationError(
          `Max Response Length must be a valid integer. '${actionConfiguration.generateChatGptResponseMaxTokens}' is not valid.`,
          ErrorCode.INTEGRATION_SYNTAX,
          { pluginName: this.pluginName }
        );
      } else if (maxTokensToUse <= 0) {
        throw new IntegrationError('Max Response Length must be greater than 0.', ErrorCode.INTEGRATION_SYNTAX, {
          pluginName: this.pluginName
        });
      }
    }

    return {
      model: actionConfiguration.generateChatGPTResponseAiModel,
      messages: messages,
      max_tokens: maxTokensToUse
    };
  }

  getGenerateImageBody(actionConfiguration: OpenAiActionConfiguration): Record<string, unknown> {
    const data = {
      prompt: actionConfiguration.generateImageGenerateFromPromptPrompt
    };
    if (!isEmpty(actionConfiguration.generateImageGenerateFromPromptImageImageSize)) {
      data['size'] = actionConfiguration.generateImageGenerateFromPromptImageImageSize;
    }
    return data;
  }

  async getEditImageBody(
    context: ExecutionContext,
    actionConfiguration: OpenAiActionConfiguration,
    files: RequestFiles
  ): Promise<FormData> {
    const formData = new FormData();
    const file = await this.readFile(context, actionConfiguration.generateImageEditImageImageFileToEdit, files);
    formData.append('image', file, this.getName(actionConfiguration.generateImageEditImageImageFileToEdit));
    if (!isEmpty(actionConfiguration.generateImageEditImagePrompt)) {
      formData.append('prompt', actionConfiguration.generateImageEditImagePrompt ?? '');
    }
    if (!isEmpty(actionConfiguration.generateImageEditImageImageSizes)) {
      formData.append('size', actionConfiguration.generateImageEditImageImageSizes ?? '');
    }
    if (!isEmpty(actionConfiguration.generateImageEditImageImageMask)) {
      const file = await this.readFile(context, actionConfiguration.generateImageEditImageImageMask, files);
      formData.append('mask', file, this.getName(actionConfiguration.generateImageEditImageImageMask));
    }
    return formData;
  }

  getEditImageDisplayBody(actionConfiguration: OpenAiActionConfiguration): Record<string, unknown> {
    const data = {
      image: '<raw bytes>'
    };
    if (!isEmpty(actionConfiguration.generateImageEditImagePrompt)) {
      data['prompt'] = actionConfiguration.generateImageEditImagePrompt;
    }
    if (!isEmpty(actionConfiguration.generateImageEditImageImageSizes)) {
      data['size'] = actionConfiguration.generateImageEditImageImageSizes;
    }
    if (!isEmpty(actionConfiguration.generateImageEditImageImageMask)) {
      data['mask'] = '<raw bytes>';
    }
    return data;
  }

  async getVaryImageBody(
    context: ExecutionContext,
    actionConfiguration: OpenAiActionConfiguration,
    files: RequestFiles
  ): Promise<FormData> {
    const formData = new FormData();
    const file = await this.readFile(context, actionConfiguration.generateImageVaryImageImageFile, files);
    formData.append('image', file, this.getName(actionConfiguration.generateImageVaryImageImageFile));
    if (!isEmpty(actionConfiguration.generateImageVaryImageImageSize)) {
      formData.append('size', actionConfiguration.generateImageVaryImageImageSize ?? '');
    }
    return formData;
  }

  getVaryImageDisplayBody(actionConfiguration: OpenAiActionConfiguration): Record<string, unknown> {
    const data = {
      image: '<raw bytes>'
    };
    if (!isEmpty(actionConfiguration.generateImageVaryImageImageSize)) {
      data['size'] = actionConfiguration.generateImageVaryImageImageSize;
    }
    return data;
  }

  async getAudioTranscribeBody(
    context: ExecutionContext,
    actionConfiguration: OpenAiActionConfiguration,
    files: RequestFiles
  ): Promise<FormData> {
    const formData = new FormData();
    const file = await this.readFile(context, actionConfiguration.transcribeAudioToTextAudioFile, files);
    formData.append('file', file, this.getName(actionConfiguration.transcribeAudioToTextAudioFile));
    formData.append('model', actionConfiguration.transcribeAudioToTextAiModel);
    // Language
    if (
      !isEmpty(actionConfiguration.transcribeAudioToTextInputLanguage) &&
      typeof actionConfiguration.transcribeAudioToTextInputLanguage !== 'undefined' &&
      actionConfiguration.transcribeAudioToTextInputLanguage !== 'Auto Detect'
    ) {
      formData.append('language', OPEN_AI_TRANSCRIBE_LANGUAGES_AND_ISO_639_1_CODES[actionConfiguration.transcribeAudioToTextInputLanguage]);
    }
    return formData;
  }

  getAudioTranscribeDisplayBody(actionConfiguration: OpenAiActionConfiguration): Record<string, unknown> {
    const data = {
      file: '<raw bytes>',
      model: actionConfiguration.transcribeAudioToTextAiModel
    };
    if (
      !isEmpty(actionConfiguration.transcribeAudioToTextInputLanguage) &&
      typeof actionConfiguration.transcribeAudioToTextInputLanguage !== 'undefined' &&
      actionConfiguration.transcribeAudioToTextInputLanguage !== 'Auto Detect'
    ) {
      data['language'] = OPEN_AI_TRANSCRIBE_LANGUAGES_AND_ISO_639_1_CODES[actionConfiguration.transcribeAudioToTextInputLanguage];
    }
    return data;
  }

  async getAudioTranslateBody(
    context: ExecutionContext,
    actionConfiguration: OpenAiActionConfiguration,
    files: RequestFiles
  ): Promise<FormData> {
    const formData = new FormData();
    const file = await this.readFile(context, actionConfiguration.transcribeAudioToTextAudioFile, files);
    formData.append('file', file, this.getName(actionConfiguration.transcribeAudioToTextAudioFile));
    formData.append('model', actionConfiguration.transcribeAudioToTextAiModel);
    return formData;
  }

  getAudioTranslateDisplayBody(actionConfiguration: OpenAiActionConfiguration): Record<string, unknown> {
    return {
      file: '<raw bytes>',
      model: actionConfiguration.transcribeAudioToTextAiModel
    };
  }

  getTemperature(givenTemperature: string | undefined): number {
    let temperatureToUse = OPEN_AI_DEFAULT_TEMPERATURE;
    if (givenTemperature) {
      temperatureToUse = parseFloat(givenTemperature);
      if (isNaN(temperatureToUse)) {
        throw new IntegrationError(
          `Temperature must be a valid integer. '${givenTemperature}' is not valid.`,
          ErrorCode.INTEGRATION_SYNTAX,
          { pluginName: this.pluginName }
        );
      } else if (temperatureToUse < OPEN_AI_MIN_TEMPERATURE || temperatureToUse > OPEN_AI_MAX_TEMPERATURE) {
        throw new IntegrationError(
          `Temperature must be in range [${OPEN_AI_MIN_TEMPERATURE}, ${OPEN_AI_MAX_TEMPERATURE}].`,
          ErrorCode.INTEGRATION_SYNTAX,
          { pluginName: this.pluginName }
        );
      }
    }
    return temperatureToUse;
  }

  metadata(datasourceConfiguration: DatasourceConfiguration, actionConfiguration?: ActionConfiguration): Promise<DatasourceMetadataDto> {
    return Promise.resolve({});
  }

  getRequest(actionConfiguration: OpenAiActionConfiguration, datasourceConfiguration: OpenAiDatasourceConfiguration): RawRequest {
    const reqUrl = this.getRequestEndpoint(actionConfiguration);
    const reqBody = this.getDisplayRequestBody(actionConfiguration);
    this.addCommonParams(reqUrl, actionConfiguration, reqBody);
    return makeCurlString({
      reqMethod: 'POST',
      reqUrl: reqUrl,
      reqHeaders: this.getRequestHeadersAsProps(actionConfiguration, datasourceConfiguration),
      reqBody: JSON.stringify(reqBody),
      reqBodyType: RestApiBodyDataType.JSON
    });
  }

  getName(file: unknown): string {
    if (file && typeof file === 'string') {
      try {
        const obj = JSON.parse(file);
        return obj.name;
        // eslint-disable-next-line no-empty
      } catch (e) {}
    }
    if (!file) {
      throw new IntegrationError('File is null.', ErrorCode.INTEGRATION_SYNTAX, { pluginName: this.pluginName });
    } else if (typeof file !== 'object') {
      throw new IntegrationError('File is not an object.', ErrorCode.INTEGRATION_SYNTAX, { pluginName: this.pluginName });
    } else if (!file['name']) {
      throw new IntegrationError('File does not have a name.', ErrorCode.INTEGRATION_SYNTAX, { pluginName: this.pluginName });
    }
    return file['name'];
  }

  async readFile(context: ExecutionContext, file: unknown, files: RequestFiles): Promise<string | Readable> {
    let fileWithContents = file;
    if (fileWithContents && typeof fileWithContents === 'string') {
      try {
        fileWithContents = JSON.parse(fileWithContents);
      } catch (e) {
        throw new IntegrationError(`Can't parse the file objects. They must be an array of JSON objects.`, ErrorCode.INTEGRATION_SYNTAX, {
          pluginName: this.pluginName
        });
      }
    }
    if (!isReadableFile(fileWithContents)) {
      if (isReadableFileConstructor(fileWithContents)) {
        return fileWithContents.contents;
      }

      throw new IntegrationError(
        `Cannot read files. Files can either be Superblocks files or { name: string; contents: string }.${JSON.stringify(file)}`,
        ErrorCode.INTEGRATION_SYNTAX,
        { pluginName: this.pluginName }
      );
    }

    const match = files.find((f) => f.originalname.startsWith(`${(fileWithContents as FileMetadataPrivate).$superblocksId}`));
    if (!match) {
      throw new IntegrationError(`Could not locate file ${fileWithContents.name}`, ErrorCode.INTEGRATION_SYNTAX, {
        pluginName: this.pluginName
      });
    }

    try {
      return await getFileStream(context, match.path);
    } catch (err) {
      if (err && err?.response?.status === 404) {
        throw new IntegrationError(
          `Could not retrieve file ${fileWithContents.name} from controller: ${err.message}`,
          ErrorCode.INTEGRATION_LOGIC,
          { pluginName: this.pluginName }
        );
      }
      throw new IntegrationError(
        `Could not retrieve file ${fileWithContents.name} from controller: ${err.message}`,
        ErrorCode.INTEGRATION_NETWORK,
        { pluginName: this.pluginName }
      );
    }
  }

  async test(datasourceConfiguration: OpenAiDatasourceConfiguration): Promise<void> {
    const headers = {
      Authorization: `Bearer ${datasourceConfiguration.bearerToken}`
    };
    if (datasourceConfiguration.organizationId) {
      headers['OpenAI-Organization'] = datasourceConfiguration.organizationId;
    }
    const url = 'https://api.openai.com/v1/models';
    try {
      await axios.get(url, { headers });
    } catch (error) {
      if (error.response) {
        // see what error code this is
        if (error.response.data.error.code === 'invalid_organization') {
          throw new IntegrationError(
            `Invalid Organization ID: ${datasourceConfiguration.organizationId}`,
            ErrorCode.INTEGRATION_AUTHORIZATION,
            { pluginName: this.pluginName }
          );
        } else if (error.response.data.error.code === 'invalid_api_key') {
          throw new IntegrationError(
            `Invalid API Key: ${this.getRedactedApiKey(datasourceConfiguration.bearerToken)}`,
            ErrorCode.INTEGRATION_AUTHORIZATION,
            { pluginName: this.pluginName }
          );
        } else {
          throw new IntegrationError(`Error connecting: ${error.response.statusText}`, ErrorCode.UNSPECIFIED, {
            pluginName: this.pluginName
          });
        }
      }
    }
  }

  getRedactedApiKey(originalApiKey: string): string {
    if (originalApiKey.length < 3) {
      return originalApiKey;
    }
    return '*'.repeat(originalApiKey.length - 3) + originalApiKey.slice(-3);
  }

  getCurrentTimestampString(): string {
    // Example output: "03/13/2023 11:50:30 PM UTC"
    const now = new Date();
    return now.toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: true,
      timeZoneName: 'short'
    });
  }
}
