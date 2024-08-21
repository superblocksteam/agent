import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";
/**
 * @generated from message plugins.openai.v1.SuperblocksMetadata
 */
export declare class SuperblocksMetadata extends Message<SuperblocksMetadata> {
    /**
     * @generated from field: string pluginVersion = 1;
     */
    pluginVersion: string;
    constructor(data?: PartialMessage<SuperblocksMetadata>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.openai.v1.SuperblocksMetadata";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): SuperblocksMetadata;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): SuperblocksMetadata;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): SuperblocksMetadata;
    static equals(a: SuperblocksMetadata | PlainMessage<SuperblocksMetadata> | undefined, b: SuperblocksMetadata | PlainMessage<SuperblocksMetadata> | undefined): boolean;
}
/**
 * @generated from message plugins.openai.v1.Property
 */
export declare class Property extends Message<Property> {
    /**
     * @generated from field: string key = 1;
     */
    key: string;
    /**
     * @generated from field: int32 value = 2;
     */
    value: number;
    /**
     * @generated from field: bool editable = 3;
     */
    editable: boolean;
    /**
     * @generated from field: bool internal = 4;
     */
    internal: boolean;
    /**
     * @generated from field: string description = 5;
     */
    description: string;
    /**
     * @generated from field: bool mandatory = 6;
     */
    mandatory: boolean;
    /**
     * @generated from field: string type = 7;
     */
    type: string;
    /**
     * @generated from field: string defaultValue = 8;
     */
    defaultValue: string;
    /**
     * @generated from field: string minRange = 9;
     */
    minRange: string;
    /**
     * @generated from field: string maxRange = 10;
     */
    maxRange: string;
    /**
     * @generated from field: repeated string valueOptions = 11;
     */
    valueOptions: string[];
    constructor(data?: PartialMessage<Property>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.openai.v1.Property";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Property;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Property;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Property;
    static equals(a: Property | PlainMessage<Property> | undefined, b: Property | PlainMessage<Property> | undefined): boolean;
}
/**
 * @generated from message plugins.openai.v1.Custom
 */
export declare class Custom extends Message<Custom> {
    /**
     * @generated from field: plugins.openai.v1.Property presignedExpiration = 1;
     */
    presignedExpiration?: Property;
    constructor(data?: PartialMessage<Custom>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.openai.v1.Custom";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Custom;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Custom;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Custom;
    static equals(a: Custom | PlainMessage<Custom> | undefined, b: Custom | PlainMessage<Custom> | undefined): boolean;
}
/**
 * @generated from message plugins.openai.v1.Plugin
 */
export declare class Plugin extends Message<Plugin> {
    /**
     * @generated from field: string action = 1;
     */
    action: string;
    /**
     * @generated from field: optional string generateChatGptResponsePrompt = 2;
     */
    generateChatGptResponsePrompt?: string;
    /**
     * @generated from field: optional string generateChatGptResponseMessageHistory = 3;
     */
    generateChatGptResponseMessageHistory?: string;
    /**
     * @generated from field: optional string generateChatGptResponseSystemInstruction = 4;
     */
    generateChatGptResponseSystemInstruction?: string;
    /**
     * @generated from field: optional string generateTextType = 5;
     */
    generateTextType?: string;
    /**
     * @generated from field: optional string generateTextNewTextPrompt = 6;
     */
    generateTextNewTextPrompt?: string;
    /**
     * @generated from field: optional string generateTextEditTextTextToEdit = 7;
     */
    generateTextEditTextTextToEdit?: string;
    /**
     * @generated from field: optional string generateTextEditTextPrompt = 8;
     */
    generateTextEditTextPrompt?: string;
    /**
     * @generated from field: optional string generateCodeType = 9;
     */
    generateCodeType?: string;
    /**
     * @generated from field: optional string generateCodeNewCodePrompt = 10;
     */
    generateCodeNewCodePrompt?: string;
    /**
     * @generated from field: optional string generateCodeEditCodeCodeToEdit = 11;
     */
    generateCodeEditCodeCodeToEdit?: string;
    /**
     * @generated from field: optional string generateCodeEditCodePrompt = 12;
     */
    generateCodeEditCodePrompt?: string;
    /**
     * @generated from field: optional string checkModerationText = 13;
     */
    checkModerationText?: string;
    /**
     * @generated from field: optional string embeddingText = 14;
     */
    embeddingText?: string;
    /**
     * @generated from field: optional string generateImageMethod = 15;
     */
    generateImageMethod?: string;
    /**
     * @generated from field: optional string generateImageGenerateFromPromptPrompt = 16;
     */
    generateImageGenerateFromPromptPrompt?: string;
    /**
     * @generated from field: optional string generateImageGenerateFromPromptImageImageSize = 17;
     */
    generateImageGenerateFromPromptImageImageSize?: string;
    /**
     * @generated from field: optional string generateImageEditImagePrompt = 18;
     */
    generateImageEditImagePrompt?: string;
    /**
     * @generated from field: optional string generateImageEditImageImageFileToEdit = 19;
     */
    generateImageEditImageImageFileToEdit?: string;
    /**
     * @generated from field: optional string generateImageEditImageImageMask = 20;
     */
    generateImageEditImageImageMask?: string;
    /**
     * @generated from field: optional string generateImageEditImageImageSizes = 21;
     */
    generateImageEditImageImageSizes?: string;
    /**
     * @generated from field: optional string generateImageVaryImageImageFile = 22;
     */
    generateImageVaryImageImageFile?: string;
    /**
     * @generated from field: optional string generateImageVaryImageImageSize = 23;
     */
    generateImageVaryImageImageSize?: string;
    /**
     * @generated from field: optional string transcribeAudioToTextAudioFile = 24;
     */
    transcribeAudioToTextAudioFile?: string;
    /**
     * @generated from field: optional string transcribeAudioToTextInputLanguage = 25;
     */
    transcribeAudioToTextInputLanguage?: string;
    /**
     * This is not a string because it is not a binding! Yay!
     *
     * @generated from field: bool transcribeAudioToTextTranslateToEnglish = 26;
     */
    transcribeAudioToTextTranslateToEnglish: boolean;
    /**
     * @generated from field: optional string generateChatGPTResponseAiModel = 27;
     */
    generateChatGPTResponseAiModel?: string;
    /**
     * @generated from field: optional string generateTextNewTextAiModel = 28;
     */
    generateTextNewTextAiModel?: string;
    /**
     * @generated from field: optional string generateTextEditTextAiModel = 29;
     */
    generateTextEditTextAiModel?: string;
    /**
     * @generated from field: optional string generateCodeNewCodeAiModel = 30;
     */
    generateCodeNewCodeAiModel?: string;
    /**
     * @generated from field: optional string generateCodeEditCodeAiModel = 31;
     */
    generateCodeEditCodeAiModel?: string;
    /**
     * @generated from field: optional string checkModerationAiModel = 32;
     */
    checkModerationAiModel?: string;
    /**
     * @generated from field: optional string generateTextEmbeddingAiModel = 33;
     */
    generateTextEmbeddingAiModel?: string;
    /**
     * @generated from field: optional string transcribeAudioToTextAiModel = 34;
     */
    transcribeAudioToTextAiModel?: string;
    /**
     * Super confusing - these fields might be bindings
     * Otherwise, they should be ints
     *
     * @generated from field: optional string generateChatGptResponseMaxTokens = 35;
     */
    generateChatGptResponseMaxTokens?: string;
    /**
     * @generated from field: optional string generateTextNewTextMaxTokens = 36;
     */
    generateTextNewTextMaxTokens?: string;
    /**
     * @generated from field: optional string aiModel = 37;
     */
    aiModel?: string;
    /**
     * @generated from field: plugins.openai.v1.SuperblocksMetadata superblocksMetadata = 38;
     */
    superblocksMetadata?: SuperblocksMetadata;
    constructor(data?: PartialMessage<Plugin>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.openai.v1.Plugin";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin;
    static equals(a: Plugin | PlainMessage<Plugin> | undefined, b: Plugin | PlainMessage<Plugin> | undefined): boolean;
}
