import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";
import { Property, SuperblocksMetadata } from "../../../common/v1/plugin_pb";
/**
 * @generated from message plugins.restapi.v1.Plugin
 */
export declare class Plugin extends Message<Plugin> {
    /**
     * @generated from field: string httpMethod = 1;
     */
    httpMethod: string;
    /**
     * @generated from field: string responseType = 2;
     */
    responseType: string;
    /**
     * @generated from field: repeated common.v1.Property headers = 3;
     */
    headers: Property[];
    /**
     * @generated from field: repeated common.v1.Property params = 4;
     */
    params: Property[];
    /**
     * @generated from field: string bodyType = 5;
     */
    bodyType: string;
    /**
     * @generated from field: string body = 6;
     */
    body: string;
    /**
     * @generated from field: repeated common.v1.Property formData = 7;
     */
    formData: Property[];
    /**
     * @generated from field: string fileFormKey = 8;
     */
    fileFormKey: string;
    /**
     * @generated from field: string fileName = 9;
     */
    fileName: string;
    /**
     * @generated from field: string path = 10;
     */
    path: string;
    /**
     * @generated from field: string jsonBody = 11;
     */
    jsonBody: string;
    /**
     * @generated from field: common.v1.SuperblocksMetadata superblocksMetadata = 12;
     */
    superblocksMetadata?: SuperblocksMetadata;
    constructor(data?: PartialMessage<Plugin>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.restapi.v1.Plugin";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin;
    static equals(a: Plugin | PlainMessage<Plugin> | undefined, b: Plugin | PlainMessage<Plugin> | undefined): boolean;
}
