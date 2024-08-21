// package: plugins.openai.v1
// file: plugins/openai/v1/plugin.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";

export class SuperblocksMetadata extends jspb.Message { 
    getPluginversion(): string;
    setPluginversion(value: string): SuperblocksMetadata;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SuperblocksMetadata.AsObject;
    static toObject(includeInstance: boolean, msg: SuperblocksMetadata): SuperblocksMetadata.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SuperblocksMetadata, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SuperblocksMetadata;
    static deserializeBinaryFromReader(message: SuperblocksMetadata, reader: jspb.BinaryReader): SuperblocksMetadata;
}

export namespace SuperblocksMetadata {
    export type AsObject = {
        pluginversion: string,
    }
}

export class Property extends jspb.Message { 
    getKey(): string;
    setKey(value: string): Property;
    getValue(): number;
    setValue(value: number): Property;
    getEditable(): boolean;
    setEditable(value: boolean): Property;
    getInternal(): boolean;
    setInternal(value: boolean): Property;
    getDescription(): string;
    setDescription(value: string): Property;
    getMandatory(): boolean;
    setMandatory(value: boolean): Property;
    getType(): string;
    setType(value: string): Property;
    getDefaultvalue(): string;
    setDefaultvalue(value: string): Property;
    getMinrange(): string;
    setMinrange(value: string): Property;
    getMaxrange(): string;
    setMaxrange(value: string): Property;
    clearValueoptionsList(): void;
    getValueoptionsList(): Array<string>;
    setValueoptionsList(value: Array<string>): Property;
    addValueoptions(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Property.AsObject;
    static toObject(includeInstance: boolean, msg: Property): Property.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Property, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Property;
    static deserializeBinaryFromReader(message: Property, reader: jspb.BinaryReader): Property;
}

export namespace Property {
    export type AsObject = {
        key: string,
        value: number,
        editable: boolean,
        internal: boolean,
        description: string,
        mandatory: boolean,
        type: string,
        defaultvalue: string,
        minrange: string,
        maxrange: string,
        valueoptionsList: Array<string>,
    }
}

export class Custom extends jspb.Message { 

    hasPresignedexpiration(): boolean;
    clearPresignedexpiration(): void;
    getPresignedexpiration(): Property | undefined;
    setPresignedexpiration(value?: Property): Custom;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Custom.AsObject;
    static toObject(includeInstance: boolean, msg: Custom): Custom.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Custom, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Custom;
    static deserializeBinaryFromReader(message: Custom, reader: jspb.BinaryReader): Custom;
}

export namespace Custom {
    export type AsObject = {
        presignedexpiration?: Property.AsObject,
    }
}

export class Plugin extends jspb.Message { 
    getAction(): string;
    setAction(value: string): Plugin;

    hasGeneratechatgptresponseprompt(): boolean;
    clearGeneratechatgptresponseprompt(): void;
    getGeneratechatgptresponseprompt(): string | undefined;
    setGeneratechatgptresponseprompt(value: string): Plugin;

    hasGeneratechatgptresponsemessagehistory(): boolean;
    clearGeneratechatgptresponsemessagehistory(): void;
    getGeneratechatgptresponsemessagehistory(): string | undefined;
    setGeneratechatgptresponsemessagehistory(value: string): Plugin;

    hasGeneratechatgptresponsesysteminstruction(): boolean;
    clearGeneratechatgptresponsesysteminstruction(): void;
    getGeneratechatgptresponsesysteminstruction(): string | undefined;
    setGeneratechatgptresponsesysteminstruction(value: string): Plugin;

    hasGeneratetexttype(): boolean;
    clearGeneratetexttype(): void;
    getGeneratetexttype(): string | undefined;
    setGeneratetexttype(value: string): Plugin;

    hasGeneratetextnewtextprompt(): boolean;
    clearGeneratetextnewtextprompt(): void;
    getGeneratetextnewtextprompt(): string | undefined;
    setGeneratetextnewtextprompt(value: string): Plugin;

    hasGeneratetextedittexttexttoedit(): boolean;
    clearGeneratetextedittexttexttoedit(): void;
    getGeneratetextedittexttexttoedit(): string | undefined;
    setGeneratetextedittexttexttoedit(value: string): Plugin;

    hasGeneratetextedittextprompt(): boolean;
    clearGeneratetextedittextprompt(): void;
    getGeneratetextedittextprompt(): string | undefined;
    setGeneratetextedittextprompt(value: string): Plugin;

    hasGeneratecodetype(): boolean;
    clearGeneratecodetype(): void;
    getGeneratecodetype(): string | undefined;
    setGeneratecodetype(value: string): Plugin;

    hasGeneratecodenewcodeprompt(): boolean;
    clearGeneratecodenewcodeprompt(): void;
    getGeneratecodenewcodeprompt(): string | undefined;
    setGeneratecodenewcodeprompt(value: string): Plugin;

    hasGeneratecodeeditcodecodetoedit(): boolean;
    clearGeneratecodeeditcodecodetoedit(): void;
    getGeneratecodeeditcodecodetoedit(): string | undefined;
    setGeneratecodeeditcodecodetoedit(value: string): Plugin;

    hasGeneratecodeeditcodeprompt(): boolean;
    clearGeneratecodeeditcodeprompt(): void;
    getGeneratecodeeditcodeprompt(): string | undefined;
    setGeneratecodeeditcodeprompt(value: string): Plugin;

    hasCheckmoderationtext(): boolean;
    clearCheckmoderationtext(): void;
    getCheckmoderationtext(): string | undefined;
    setCheckmoderationtext(value: string): Plugin;

    hasEmbeddingtext(): boolean;
    clearEmbeddingtext(): void;
    getEmbeddingtext(): string | undefined;
    setEmbeddingtext(value: string): Plugin;

    hasGenerateimagemethod(): boolean;
    clearGenerateimagemethod(): void;
    getGenerateimagemethod(): string | undefined;
    setGenerateimagemethod(value: string): Plugin;

    hasGenerateimagegeneratefrompromptprompt(): boolean;
    clearGenerateimagegeneratefrompromptprompt(): void;
    getGenerateimagegeneratefrompromptprompt(): string | undefined;
    setGenerateimagegeneratefrompromptprompt(value: string): Plugin;

    hasGenerateimagegeneratefrompromptimageimagesize(): boolean;
    clearGenerateimagegeneratefrompromptimageimagesize(): void;
    getGenerateimagegeneratefrompromptimageimagesize(): string | undefined;
    setGenerateimagegeneratefrompromptimageimagesize(value: string): Plugin;

    hasGenerateimageeditimageprompt(): boolean;
    clearGenerateimageeditimageprompt(): void;
    getGenerateimageeditimageprompt(): string | undefined;
    setGenerateimageeditimageprompt(value: string): Plugin;

    hasGenerateimageeditimageimagefiletoedit(): boolean;
    clearGenerateimageeditimageimagefiletoedit(): void;
    getGenerateimageeditimageimagefiletoedit(): string | undefined;
    setGenerateimageeditimageimagefiletoedit(value: string): Plugin;

    hasGenerateimageeditimageimagemask(): boolean;
    clearGenerateimageeditimageimagemask(): void;
    getGenerateimageeditimageimagemask(): string | undefined;
    setGenerateimageeditimageimagemask(value: string): Plugin;

    hasGenerateimageeditimageimagesizes(): boolean;
    clearGenerateimageeditimageimagesizes(): void;
    getGenerateimageeditimageimagesizes(): string | undefined;
    setGenerateimageeditimageimagesizes(value: string): Plugin;

    hasGenerateimagevaryimageimagefile(): boolean;
    clearGenerateimagevaryimageimagefile(): void;
    getGenerateimagevaryimageimagefile(): string | undefined;
    setGenerateimagevaryimageimagefile(value: string): Plugin;

    hasGenerateimagevaryimageimagesize(): boolean;
    clearGenerateimagevaryimageimagesize(): void;
    getGenerateimagevaryimageimagesize(): string | undefined;
    setGenerateimagevaryimageimagesize(value: string): Plugin;

    hasTranscribeaudiototextaudiofile(): boolean;
    clearTranscribeaudiototextaudiofile(): void;
    getTranscribeaudiototextaudiofile(): string | undefined;
    setTranscribeaudiototextaudiofile(value: string): Plugin;

    hasTranscribeaudiototextinputlanguage(): boolean;
    clearTranscribeaudiototextinputlanguage(): void;
    getTranscribeaudiototextinputlanguage(): string | undefined;
    setTranscribeaudiototextinputlanguage(value: string): Plugin;
    getTranscribeaudiototexttranslatetoenglish(): boolean;
    setTranscribeaudiototexttranslatetoenglish(value: boolean): Plugin;

    hasGeneratechatgptresponseaimodel(): boolean;
    clearGeneratechatgptresponseaimodel(): void;
    getGeneratechatgptresponseaimodel(): string | undefined;
    setGeneratechatgptresponseaimodel(value: string): Plugin;

    hasGeneratetextnewtextaimodel(): boolean;
    clearGeneratetextnewtextaimodel(): void;
    getGeneratetextnewtextaimodel(): string | undefined;
    setGeneratetextnewtextaimodel(value: string): Plugin;

    hasGeneratetextedittextaimodel(): boolean;
    clearGeneratetextedittextaimodel(): void;
    getGeneratetextedittextaimodel(): string | undefined;
    setGeneratetextedittextaimodel(value: string): Plugin;

    hasGeneratecodenewcodeaimodel(): boolean;
    clearGeneratecodenewcodeaimodel(): void;
    getGeneratecodenewcodeaimodel(): string | undefined;
    setGeneratecodenewcodeaimodel(value: string): Plugin;

    hasGeneratecodeeditcodeaimodel(): boolean;
    clearGeneratecodeeditcodeaimodel(): void;
    getGeneratecodeeditcodeaimodel(): string | undefined;
    setGeneratecodeeditcodeaimodel(value: string): Plugin;

    hasCheckmoderationaimodel(): boolean;
    clearCheckmoderationaimodel(): void;
    getCheckmoderationaimodel(): string | undefined;
    setCheckmoderationaimodel(value: string): Plugin;

    hasGeneratetextembeddingaimodel(): boolean;
    clearGeneratetextembeddingaimodel(): void;
    getGeneratetextembeddingaimodel(): string | undefined;
    setGeneratetextembeddingaimodel(value: string): Plugin;

    hasTranscribeaudiototextaimodel(): boolean;
    clearTranscribeaudiototextaimodel(): void;
    getTranscribeaudiototextaimodel(): string | undefined;
    setTranscribeaudiototextaimodel(value: string): Plugin;

    hasGeneratechatgptresponsemaxtokens(): boolean;
    clearGeneratechatgptresponsemaxtokens(): void;
    getGeneratechatgptresponsemaxtokens(): string | undefined;
    setGeneratechatgptresponsemaxtokens(value: string): Plugin;

    hasGeneratetextnewtextmaxtokens(): boolean;
    clearGeneratetextnewtextmaxtokens(): void;
    getGeneratetextnewtextmaxtokens(): string | undefined;
    setGeneratetextnewtextmaxtokens(value: string): Plugin;

    hasAimodel(): boolean;
    clearAimodel(): void;
    getAimodel(): string | undefined;
    setAimodel(value: string): Plugin;

    hasSuperblocksmetadata(): boolean;
    clearSuperblocksmetadata(): void;
    getSuperblocksmetadata(): SuperblocksMetadata | undefined;
    setSuperblocksmetadata(value?: SuperblocksMetadata): Plugin;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Plugin.AsObject;
    static toObject(includeInstance: boolean, msg: Plugin): Plugin.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Plugin, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Plugin;
    static deserializeBinaryFromReader(message: Plugin, reader: jspb.BinaryReader): Plugin;
}

export namespace Plugin {
    export type AsObject = {
        action: string,
        generatechatgptresponseprompt?: string,
        generatechatgptresponsemessagehistory?: string,
        generatechatgptresponsesysteminstruction?: string,
        generatetexttype?: string,
        generatetextnewtextprompt?: string,
        generatetextedittexttexttoedit?: string,
        generatetextedittextprompt?: string,
        generatecodetype?: string,
        generatecodenewcodeprompt?: string,
        generatecodeeditcodecodetoedit?: string,
        generatecodeeditcodeprompt?: string,
        checkmoderationtext?: string,
        embeddingtext?: string,
        generateimagemethod?: string,
        generateimagegeneratefrompromptprompt?: string,
        generateimagegeneratefrompromptimageimagesize?: string,
        generateimageeditimageprompt?: string,
        generateimageeditimageimagefiletoedit?: string,
        generateimageeditimageimagemask?: string,
        generateimageeditimageimagesizes?: string,
        generateimagevaryimageimagefile?: string,
        generateimagevaryimageimagesize?: string,
        transcribeaudiototextaudiofile?: string,
        transcribeaudiototextinputlanguage?: string,
        transcribeaudiototexttranslatetoenglish: boolean,
        generatechatgptresponseaimodel?: string,
        generatetextnewtextaimodel?: string,
        generatetextedittextaimodel?: string,
        generatecodenewcodeaimodel?: string,
        generatecodeeditcodeaimodel?: string,
        checkmoderationaimodel?: string,
        generatetextembeddingaimodel?: string,
        transcribeaudiototextaimodel?: string,
        generatechatgptresponsemaxtokens?: string,
        generatetextnewtextmaxtokens?: string,
        aimodel?: string,
        superblocksmetadata?: SuperblocksMetadata.AsObject,
    }
}
