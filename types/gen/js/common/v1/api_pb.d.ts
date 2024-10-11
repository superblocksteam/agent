// package: common.v1
// file: common/v1/api.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";

export class Links extends jspb.Message { 

    getLinksMap(): jspb.Map<string, Link>;
    clearLinksMap(): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Links.AsObject;
    static toObject(includeInstance: boolean, msg: Links): Links.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Links, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Links;
    static deserializeBinaryFromReader(message: Links, reader: jspb.BinaryReader): Links;
}

export namespace Links {
    export type AsObject = {

        linksMap: Array<[string, Link.AsObject]>,
    }
}

export class LinksV2 extends jspb.Message { 
    clearLinksList(): void;
    getLinksList(): Array<Links>;
    setLinksList(value: Array<Links>): LinksV2;
    addLinks(value?: Links, index?: number): Links;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): LinksV2.AsObject;
    static toObject(includeInstance: boolean, msg: LinksV2): LinksV2.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: LinksV2, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): LinksV2;
    static deserializeBinaryFromReader(message: LinksV2, reader: jspb.BinaryReader): LinksV2;
}

export namespace LinksV2 {
    export type AsObject = {
        linksList: Array<Links.AsObject>,
    }
}

export class Link extends jspb.Message { 
    getUrl(): string;
    setUrl(value: string): Link;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Link.AsObject;
    static toObject(includeInstance: boolean, msg: Link): Link.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Link, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Link;
    static deserializeBinaryFromReader(message: Link, reader: jspb.BinaryReader): Link;
}

export namespace Link {
    export type AsObject = {
        url: string,
    }
}

export class CombinedLinks extends jspb.Message { 

    getLinksMap(): jspb.Map<string, Link>;
    clearLinksMap(): void;
    clearLinksV2List(): void;
    getLinksV2List(): Array<Links>;
    setLinksV2List(value: Array<Links>): CombinedLinks;
    addLinksV2(value?: Links, index?: number): Links;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CombinedLinks.AsObject;
    static toObject(includeInstance: boolean, msg: CombinedLinks): CombinedLinks.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CombinedLinks, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CombinedLinks;
    static deserializeBinaryFromReader(message: CombinedLinks, reader: jspb.BinaryReader): CombinedLinks;
}

export namespace CombinedLinks {
    export type AsObject = {

        linksMap: Array<[string, Link.AsObject]>,
        linksV2List: Array<Links.AsObject>,
    }
}
