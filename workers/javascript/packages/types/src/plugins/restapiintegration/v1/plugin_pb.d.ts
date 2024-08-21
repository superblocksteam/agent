import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";
import { Property, SuperblocksMetadata } from "../../../common/v1/plugin_pb";
/**
 * @generated from message plugins.restapiintegration.v1.Plugin
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
     * @generated from field: string jsonBody = 7;
     */
    jsonBody: string;
    /**
     * @generated from field: repeated common.v1.Property formData = 8;
     */
    formData: Property[];
    /**
     * @generated from field: string fileFormKey = 9;
     */
    fileFormKey: string;
    /**
     * @generated from field: string fileName = 10;
     */
    fileName: string;
    /**
     * @generated from field: string urlBase = 11;
     */
    urlBase: string;
    /**
     * @generated from field: string urlPath = 12;
     */
    urlPath: string;
    /**
     * @generated from field: string authType = 13;
     */
    authType: string;
    /**
     * @generated from field: common.v1.SuperblocksMetadata superblocksMetadata = 14;
     */
    superblocksMetadata?: SuperblocksMetadata;
    /**
     * OpenAPI fields
     *
     * @generated from field: string openApiAction = 15;
     */
    openApiAction: string;
    /**
     * @generated from field: string openApiSpecRef = 16;
     */
    openApiSpecRef: string;
    /**
     * @generated from field: optional string openApiTenantName = 17;
     */
    openApiTenantName?: string;
    constructor(data?: PartialMessage<Plugin>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "plugins.restapiintegration.v1.Plugin";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Plugin;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Plugin;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Plugin;
    static equals(a: Plugin | PlainMessage<Plugin> | undefined, b: Plugin | PlainMessage<Plugin> | undefined): boolean;
}
