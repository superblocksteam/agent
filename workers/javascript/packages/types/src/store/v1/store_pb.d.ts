import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3, Value } from "@bufbuild/protobuf";
import { Store } from "../../secrets/v1/secrets_pb";
/**
 * @generated from message store.v1.Pair
 */
export declare class Pair extends Message<Pair> {
    /**
     * @generated from field: string key = 1;
     */
    key: string;
    /**
     * @generated from field: google.protobuf.Value value = 2;
     */
    value?: Value;
    constructor(data?: PartialMessage<Pair>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "store.v1.Pair";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Pair;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Pair;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Pair;
    static equals(a: Pair | PlainMessage<Pair> | undefined, b: Pair | PlainMessage<Pair> | undefined): boolean;
}
/**
 * @generated from message store.v1.Stores
 */
export declare class Stores extends Message<Stores> {
    /**
     * @generated from field: repeated secrets.v1.Store secrets = 1;
     */
    secrets: Store[];
    constructor(data?: PartialMessage<Stores>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "store.v1.Stores";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Stores;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Stores;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Stores;
    static equals(a: Stores | PlainMessage<Stores> | undefined, b: Stores | PlainMessage<Stores> | undefined): boolean;
}
