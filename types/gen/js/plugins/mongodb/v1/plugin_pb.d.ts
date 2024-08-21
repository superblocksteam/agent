// package: plugins.mongodb.v1
// file: plugins/mongodb/v1/plugin.proto

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

export class Plugin extends jspb.Message { 
    getResource(): string;
    setResource(value: string): Plugin;
    getAction(): string;
    setAction(value: string): Plugin;
    getPipeline(): string;
    setPipeline(value: string): Plugin;
    getProjection(): string;
    setProjection(value: string): Plugin;
    getQuery(): string;
    setQuery(value: string): Plugin;
    getField(): string;
    setField(value: string): Plugin;
    getSortby(): string;
    setSortby(value: string): Plugin;
    getLimit(): string;
    setLimit(value: string): Plugin;
    getSkip(): string;
    setSkip(value: string): Plugin;
    getDocument(): string;
    setDocument(value: string): Plugin;
    getReplacement(): string;
    setReplacement(value: string): Plugin;
    getFilter(): string;
    setFilter(value: string): Plugin;
    getOptions(): string;
    setOptions(value: string): Plugin;
    getUpdate(): string;
    setUpdate(value: string): Plugin;
    getDistinctkey(): string;
    setDistinctkey(value: string): Plugin;

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
        resource: string,
        action: string,
        pipeline: string,
        projection: string,
        query: string,
        field: string,
        sortby: string,
        limit: string,
        skip: string,
        document: string,
        replacement: string,
        filter: string,
        options: string,
        update: string,
        distinctkey: string,
        superblocksmetadata?: SuperblocksMetadata.AsObject,
    }
}
