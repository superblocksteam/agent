export const SQL_INITIAL_TEXT = `-- You can use SQL to query data (ex. SELECT * FROM orders;)

`;

export const SERVICE_ACCOUNT_GHOST_TEXT = `{
  "type": "service_account",
  "project_id": "project-id",
  "private_key_id": "key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\\nprivate-key\\n-----END PRIVATE KEY-----\\n",
  "client_email": "service-account-email",
  "client_id": "client-id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://accounts.google.com/o/oauth2/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/service-account-email"
}`;

// An enum of all models.
export enum OPEN_AI_MODEL {
  CODE_CUSHMAN_001 = 'code-cushman-001',
  CODE_DAVINCI_EDIT_001 = 'code-davinci-edit-001',
  CODE_DAVINCI_002 = 'code-davinci-002',
  GPT_3_5_TURBO = 'gpt-3.5-turbo',
  GPT_3_5_TURBO_INSTRUCT = 'gpt-3.5-turbo-instruct',
  GPT_3_5_TURBO_16K = 'gpt-3.5-turbo-16k',
  GPT_4 = 'gpt-4',
  GPT_4O = 'gpt-4o',
  GPT_4O_MINI = 'gpt-4o-mini',
  GPT_4_TURBO = 'gpt-4-turbo',
  TEXT_ADA_001 = 'text-ada-001',
  TEXT_BABBAGE_001 = 'text-babbage-001',
  TEXT_CURIE_001 = 'text-curie-001',
  TEXT_DAVINCI_EDIT_001 = 'text-davinci-edit-001',
  TEXT_DAVINCI_003 = 'text-davinci-003',
  TEXT_EMBEDDING_ADA_002 = 'text-embedding-ada-002',
  TEXT_EMBEDDING_3_LARGE = 'text-embedding-3-large',
  TEXT_EMBEDDING_3_SMALL = 'text-embedding-3-small',
  TEXT_MODERATION_LATEST = 'text-moderation-latest',
  TEXT_MODERATION_STABLE = 'text-moderation-stable',
  WHISPER_1 = 'whisper-1'
}

// superblocks openai actions
// these are used for a case insensitive comparison in openai/src/index.ts
// so before modifying these, check the logic there to prevent a breaking
// change
export enum OPEN_AI_ACTION {
  GENERATE_CHATGPT_RESPONSE = 'Generate ChatGPT Response',
  GENERATE_TEXT = 'Generate Text',
  GENERATE_CODE = 'Generate Code',
  GENERATE_IMAGE = 'Generate Image',
  CHECK_MODERATION = 'Check Moderation',
  TRANSCRIBE_AUDIO_TO_TEXT = 'Transcribe Audio to Text',
  GENERATE_TEXT_EMBEDDING = 'Generate Text Embedding'
}

// https://platform.openai.com/docs/deprecations
export const DEPRECATED_MODELS_AND_RECOMMENDED_REPLACEMENT_MODELS = {
  [OPEN_AI_MODEL.TEXT_ADA_001]: OPEN_AI_MODEL.GPT_3_5_TURBO_INSTRUCT,
  [OPEN_AI_MODEL.TEXT_BABBAGE_001]: OPEN_AI_MODEL.GPT_3_5_TURBO_INSTRUCT,
  [OPEN_AI_MODEL.TEXT_CURIE_001]: OPEN_AI_MODEL.GPT_3_5_TURBO_INSTRUCT,
  [OPEN_AI_MODEL.TEXT_DAVINCI_003]: OPEN_AI_MODEL.GPT_3_5_TURBO_INSTRUCT,
  [OPEN_AI_MODEL.CODE_DAVINCI_002]: OPEN_AI_MODEL.GPT_3_5_TURBO_INSTRUCT,
  [OPEN_AI_MODEL.TEXT_DAVINCI_EDIT_001]: OPEN_AI_MODEL.GPT_4,
  [OPEN_AI_MODEL.CODE_DAVINCI_EDIT_001]: OPEN_AI_MODEL.GPT_4,
  [OPEN_AI_MODEL.CODE_CUSHMAN_001]: OPEN_AI_MODEL.GPT_4
};

export type OpenAiData = {
  supportedOptionalParameters: string[];
};
// stores all OpenAI endpoints and data about them
export const OPEN_AI_ENDPOINT_DATA = {
  'https://api.openai.com/v1/chat/completions': { supportedOptionalParameters: ['temperature'] } as OpenAiData,
  'https://api.openai.com/v1/completions': { supportedOptionalParameters: ['temperature'] } as OpenAiData,
  'https://api.openai.com/v1/edits': { supportedOptionalParameters: ['temperature'] } as OpenAiData,
  'https://api.openai.com/v1/moderations': { supportedOptionalParameters: [] } as OpenAiData,
  'https://api.openai.com/v1/images/generations': { supportedOptionalParameters: [] } as OpenAiData,
  'https://api.openai.com/v1/images/edits': { supportedOptionalParameters: [] } as OpenAiData,
  'https://api.openai.com/v1/audio/translations': { supportedOptionalParameters: ['temperature'] } as OpenAiData,
  'https://api.openai.com/v1/audio/transcriptions': { supportedOptionalParameters: ['temperature'] } as OpenAiData
};

// https://platform.openai.com/docs/models
const MODEL_DESCRIPTIONS = getUpdatedDescriptions({
  [OPEN_AI_MODEL.TEXT_DAVINCI_003]:
    'Can do any language task with better quality, longer output, and consistent instruction-following than the curie, babbage, or ada models. Also supports inserting completions within text.',
  [OPEN_AI_MODEL.TEXT_CURIE_001]: 'Very capable, faster and lower cost than Davinci.',
  [OPEN_AI_MODEL.TEXT_BABBAGE_001]: 'Capable of straightforward tasks, very fast, and lower cost.',
  [OPEN_AI_MODEL.TEXT_ADA_001]: 'Capable of very simple tasks, usually the fastest model in the GPT-3 series, and lowest cost.',
  [OPEN_AI_MODEL.CODE_CUSHMAN_001]: 'Capable of simple tasks, usually the fastest model in the GPT-3 series, and lowest cost.',
  [OPEN_AI_MODEL.CODE_DAVINCI_002]: 'Capable of simple tasks, usually the fastest model in the GPT-3 series, and lowest cost.',
  [OPEN_AI_MODEL.TEXT_DAVINCI_EDIT_001]:
    'Can do any language task with better quality, longer output, and consistent instruction-following than the curie, babbage, or ada models. Also supports inserting completions within text.',
  [OPEN_AI_MODEL.CODE_DAVINCI_EDIT_001]: 'Capable of simple tasks, usually the fastest model in the GPT-3 series, and lowest cost.',
  [OPEN_AI_MODEL.TEXT_EMBEDDING_ADA_002]:
    'Designed to replace the previous 16 first-generation embedding models at a fraction of the cost.',
  [OPEN_AI_MODEL.GPT_3_5_TURBO]:
    'Most capable GPT-3.5 model and optimized for chat at 1/10th the cost of text-davinci-003. Will be updated with our latest model iteration.',
  [OPEN_AI_MODEL.GPT_3_5_TURBO_INSTRUCT]: 'Similar capabilities to the GPT-3 era models.',
  [OPEN_AI_MODEL.GPT_3_5_TURBO_16K]: 'Same capabilities as the standard gpt-3.5-turbo model but with 4 times the context.',
  [OPEN_AI_MODEL.GPT_4]: 'A model that improved on GPT-3.5 and can understand as well as generate natural language or code.',
  [OPEN_AI_MODEL.GPT_4O]: 'Multimodal flagship model that is cheaper and faster than GPT-4 Turbo.',
  [OPEN_AI_MODEL.GPT_4O_MINI]:
    'Affordable and intelligent small model that’s significantly smarter, cheaper, and just as fast as GPT-3.5 Turbo',
  [OPEN_AI_MODEL.GPT_4_TURBO]: 'A faster model that improved on GPT-3.5 and can understand as well as generate natural language or code.',
  [OPEN_AI_MODEL.WHISPER_1]: 'A text-to-speech model that can generate whispers.',
  [OPEN_AI_MODEL.TEXT_MODERATION_LATEST]: 'The latest version of our text moderation model.',
  [OPEN_AI_MODEL.TEXT_MODERATION_STABLE]: 'The stable version of our text moderation model.',
  [OPEN_AI_MODEL.TEXT_EMBEDDING_3_LARGE]: 'Most capable embedding model for both english and non-english tasks.',
  [OPEN_AI_MODEL.TEXT_EMBEDDING_3_SMALL]: 'Increased performance over 2nd generation ada embedding model.'
});

export const CHAT_COMPLETION_AI_MODELS_AND_DESCRIPTIONS = {
  [OPEN_AI_MODEL.GPT_3_5_TURBO]: MODEL_DESCRIPTIONS[OPEN_AI_MODEL.GPT_3_5_TURBO],
  [OPEN_AI_MODEL.GPT_3_5_TURBO_INSTRUCT]: MODEL_DESCRIPTIONS[OPEN_AI_MODEL.GPT_3_5_TURBO_INSTRUCT],
  [OPEN_AI_MODEL.GPT_3_5_TURBO_16K]: MODEL_DESCRIPTIONS[OPEN_AI_MODEL.GPT_3_5_TURBO_16K],
  [OPEN_AI_MODEL.GPT_4]: MODEL_DESCRIPTIONS[OPEN_AI_MODEL.GPT_4],
  [OPEN_AI_MODEL.GPT_4O]: MODEL_DESCRIPTIONS[OPEN_AI_MODEL.GPT_4O],
  [OPEN_AI_MODEL.GPT_4O_MINI]: MODEL_DESCRIPTIONS[OPEN_AI_MODEL.GPT_4O_MINI],
  [OPEN_AI_MODEL.GPT_4_TURBO]: MODEL_DESCRIPTIONS[OPEN_AI_MODEL.GPT_4_TURBO]
};

export const TEXT_COMPLETION_AI_MODELS_AND_DESCRIPTIONS = {
  [OPEN_AI_MODEL.GPT_3_5_TURBO]: MODEL_DESCRIPTIONS[OPEN_AI_MODEL.GPT_3_5_TURBO],
  [OPEN_AI_MODEL.GPT_3_5_TURBO_INSTRUCT]: MODEL_DESCRIPTIONS[OPEN_AI_MODEL.GPT_3_5_TURBO_INSTRUCT],
  [OPEN_AI_MODEL.GPT_4]: MODEL_DESCRIPTIONS[OPEN_AI_MODEL.GPT_4],
  [OPEN_AI_MODEL.GPT_4O_MINI]: MODEL_DESCRIPTIONS[OPEN_AI_MODEL.GPT_4O_MINI],
  [OPEN_AI_MODEL.TEXT_DAVINCI_003]: MODEL_DESCRIPTIONS[OPEN_AI_MODEL.TEXT_DAVINCI_003],
  [OPEN_AI_MODEL.TEXT_CURIE_001]: MODEL_DESCRIPTIONS[OPEN_AI_MODEL.TEXT_CURIE_001],
  [OPEN_AI_MODEL.TEXT_BABBAGE_001]: MODEL_DESCRIPTIONS[OPEN_AI_MODEL.TEXT_BABBAGE_001],
  [OPEN_AI_MODEL.TEXT_ADA_001]: MODEL_DESCRIPTIONS[OPEN_AI_MODEL.TEXT_ADA_001]
};

export const EDIT_TEXT_AI_MODELS_AND_DESCRIPTIONS = {
  [OPEN_AI_MODEL.TEXT_DAVINCI_EDIT_001]: MODEL_DESCRIPTIONS[OPEN_AI_MODEL.TEXT_DAVINCI_EDIT_001]
};

export const EDIT_CODE_AI_MODELS_AND_DESCRIPTIONS = {
  [OPEN_AI_MODEL.CODE_DAVINCI_EDIT_001]: MODEL_DESCRIPTIONS[OPEN_AI_MODEL.CODE_DAVINCI_EDIT_001]
};
export const EMBEDDING_AI_MODELS_AND_DESCRIPTIONS = {
  [OPEN_AI_MODEL.TEXT_EMBEDDING_ADA_002]: MODEL_DESCRIPTIONS[OPEN_AI_MODEL.TEXT_EMBEDDING_ADA_002],
  [OPEN_AI_MODEL.TEXT_EMBEDDING_3_LARGE]: MODEL_DESCRIPTIONS[OPEN_AI_MODEL.TEXT_EMBEDDING_3_LARGE],
  [OPEN_AI_MODEL.TEXT_EMBEDDING_3_SMALL]: MODEL_DESCRIPTIONS[OPEN_AI_MODEL.TEXT_EMBEDDING_3_SMALL]
};
export const AUDIO_AI_MODELS_AND_DESCRIPTIONS = {
  [OPEN_AI_MODEL.WHISPER_1]: MODEL_DESCRIPTIONS[OPEN_AI_MODEL.WHISPER_1]
};
export const MODERATION_AI_MODELS_AND_DESCRIPTIONS = {
  [OPEN_AI_MODEL.TEXT_MODERATION_LATEST]: MODEL_DESCRIPTIONS[OPEN_AI_MODEL.TEXT_MODERATION_LATEST],
  [OPEN_AI_MODEL.TEXT_MODERATION_STABLE]: MODEL_DESCRIPTIONS[OPEN_AI_MODEL.TEXT_MODERATION_STABLE]
};

export const OPEN_AI_SUPPORTED_IMAGE_SIZES = ['256x256', '512x512', '1024x1024'];

export enum OPEN_AI_GENERATE_TEXT_TYPES {
  NEW_TEXT = 'New Text',
  EDIT_TEXT = 'Edit Text'
}

export const OPEN_AI_GENERATE_TEXT_TYPES_AND_DESCRIPTIONS = {
  [OPEN_AI_GENERATE_TEXT_TYPES.NEW_TEXT]: 'Given a prompt, the model will return a predicted text completion',
  [OPEN_AI_GENERATE_TEXT_TYPES.EDIT_TEXT]: 'Given text, the model will edit the text based on the prompt.'
};

export enum OPEN_AI_GENERATE_CODE_TYPES {
  NEW_CODE = 'New Code',
  EDIT_CODE = 'Edit Code'
}

export const OPEN_AI_GENERATE_CODE_TYPES_AND_DESCRIPTIONS = {
  [OPEN_AI_GENERATE_CODE_TYPES.NEW_CODE]: 'Given a prompt, the model will return code completion.',
  [OPEN_AI_GENERATE_CODE_TYPES.EDIT_CODE]: 'Given a code snippet, the model will edit the code based on the prompt.'
};

export enum OPEN_AI_GENERATE_IMAGE_TYPES {
  GENERATE_FROM_PROMPT = 'Generate from Prompt',
  EDIT_IMAGE = 'Edit Image',
  VARY_IMAGE = 'Vary Image'
}

export const OPEN_AI_GENERATE_IMAGE_TYPES_AND_DESCRIPTIONS = {
  [OPEN_AI_GENERATE_IMAGE_TYPES.GENERATE_FROM_PROMPT]: 'Given a prompt, the model will generate a new image.',
  [OPEN_AI_GENERATE_IMAGE_TYPES.EDIT_IMAGE]: 'Given an original image and a prompt, the model will create an edited or extended image.',
  [OPEN_AI_GENERATE_IMAGE_TYPES.VARY_IMAGE]: 'Given an original image, the model will create a variation of the image.'
};

// source: https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
export const OPEN_AI_TRANSCRIBE_LANGUAGES_AND_ISO_639_1_CODES = {
  'Auto Detect': '',
  Afrikaans: 'af',
  Arabic: 'ar',
  Armenian: 'hy',
  Azerbaijani: 'az',
  Belarusian: 'be',
  Bosnian: 'bs',
  Bulgarian: 'bg',
  'Catalan, Valencian': 'ca',
  Chinese: 'zh',
  Croatian: 'hr',
  Czech: 'cs',
  Danish: 'da',
  'Dutch, Flemish': 'nl',
  English: 'en',
  Estonian: 'et',
  Finnish: 'fi',
  French: 'fr',
  Galician: 'gl',
  German: 'de',
  'Greek, Modern (1453–)': 'el',
  Hebrew: 'he',
  Hindi: 'hi',
  Hungarian: 'hu',
  Icelandic: 'is',
  Indonesian: 'id',
  Italian: 'it',
  Japanese: 'ja',
  Kannada: 'kn',
  Kazakh: 'kk',
  Korean: 'ko',
  Latvian: 'lv',
  Lithuanian: 'lt',
  Macedonian: 'mk',
  Malay: 'ms',
  Maori: 'mi',
  Marathi: 'mr',
  Nepali: 'ne',
  Norwegian: 'no',
  Persian: 'fa',
  Polish: 'pl',
  Portuguese: 'pt',
  'Romanian, Moldavian, Moldovan': 'ro',
  Russian: 'ru',
  Serbian: 'sr',
  Slovak: 'sk',
  Slovenian: 'sl',
  'Spanish, Castilian': 'es',
  Swahili: 'sw',
  Swedish: 'sv',
  Tagalog: 'tl',
  Tamil: 'ta',
  Thai: 'th',
  Turkish: 'tr',
  Ukrainian: 'uk',
  Urdu: 'ur',
  Vietnamese: 'vi',
  Welsh: 'cy'
};

export const OPEN_AI_DEFAULT_MAX_TOKENS = 256;

export const OPEN_AI_DEFAULT_TEMPERATURE = 1;
export const OPEN_AI_MIN_TEMPERATURE = 0;
export const OPEN_AI_MAX_TEMPERATURE = 2;

export const OPEN_AI_DOC_LINKS = {
  GENERATE_CHATGPT_RESPONSE: 'https://platform.openai.com/docs/guides/chat/chat-completions-beta',
  GENERATE_TEXT_NEW: 'https://platform.openai.com/docs/guides/completion/introduction',
  GENERATE_TEXT_EDIT: 'https://platform.openai.com/docs/guides/completion/editing-text',
  GENERATE_CODE_NEW: 'https://platform.openai.com/docs/guides/code',
  GENERATE_CODE_EDIT: 'https://platform.openai.com/docs/guides/code/editing-code',
  GENERATE_IMAGE_NEW: 'https://platform.openai.com/docs/guides/images/generations',
  GENERATE_IMAGE_EDIT: 'https://platform.openai.com/docs/guides/images/edits',
  GENERATE_IMAGE_VARY: 'https://platform.openai.com/docs/guides/images/variations',
  MODERATION: 'https://platform.openai.com/docs/guides/moderation',
  TRANSCRIBE_AUDIO: 'https://platform.openai.com/docs/guides/speech-to-text/transcriptions',
  TRANSCRIBE_AUDIO_TRANSLATE: 'https://platform.openai.com/docs/guides/speech-to-text/translations',
  EMBEDDINGS: 'https://platform.openai.com/docs/guides/embeddings/what-are-embeddings'
};

function getUpdatedDescriptions(modelsAndDescriptions: Record<string, string>): Record<string, string> {
  const newModelsAndDescriptions: Record<string, string> = {};
  for (const [model, description] of Object.entries(modelsAndDescriptions)) {
    let newDescription = description;
    if (Object.keys(DEPRECATED_MODELS_AND_RECOMMENDED_REPLACEMENT_MODELS).includes(model)) {
      // deprecated model
      const replacementModel = DEPRECATED_MODELS_AND_RECOMMENDED_REPLACEMENT_MODELS[model];
      newDescription = `This model has been deprecated, use '${replacementModel}' instead.`;
    }
    newModelsAndDescriptions[model] = newDescription;
  }
  return newModelsAndDescriptions;
}

// REDIS
export const REDIS_DEFAULT_DATABASE_NUMBER = 0;

// SQL
export const PARAMETERIZED_SQL_DESCRIPTION =
  'Using parameterized SQL provides SQL injection protection but inhibits the use of JavaScript to generate SQL.';
