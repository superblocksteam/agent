import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3, Value } from "@bufbuild/protobuf";
/**
 * @generated from enum cache.v1.Operation
 */
export declare enum Operation {
    /**
     * @generated from enum value: OPERATION_UNSPECIFIED = 0;
     */
    UNSPECIFIED = 0,
    /**
     * @generated from enum value: OPERATION_UPSERT = 1;
     */
    UPSERT = 1,
    /**
     * @generated from enum value: OPERATION_DELETE = 2;
     */
    DELETE = 2
}
/**
 * @generated from message cache.v1.Mutation
 */
export declare class Mutation extends Message<Mutation> {
    /**
     * @generated from field: string resource = 1;
     */
    resource: string;
    /**
     * @generated from field: string id = 2;
     */
    id: string;
    /**
     * @generated from field: google.protobuf.Value data = 3;
     */
    data?: Value;
    /**
     * @generated from field: string organization_id = 4;
     */
    organizationId: string;
    /**
     * @generated from field: bool tombstone = 5;
     */
    tombstone: boolean;
    /**
     * this is an edge case that needs to be addressed and removed
     *
     * @generated from field: string rbac_role = 6;
     */
    rbacRole: string;
    constructor(data?: PartialMessage<Mutation>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "cache.v1.Mutation";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Mutation;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Mutation;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Mutation;
    static equals(a: Mutation | PlainMessage<Mutation> | undefined, b: Mutation | PlainMessage<Mutation> | undefined): boolean;
}
/**
 * @generated from message cache.v1.MutationBatch
 */
export declare class MutationBatch extends Message<MutationBatch> {
    /**
     * @generated from field: cache.v1.Operation operation = 1;
     */
    operation: Operation;
    /**
     * @generated from field: repeated cache.v1.Mutation batch = 2;
     */
    batch: Mutation[];
    constructor(data?: PartialMessage<MutationBatch>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "cache.v1.MutationBatch";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): MutationBatch;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MutationBatch;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MutationBatch;
    static equals(a: MutationBatch | PlainMessage<MutationBatch> | undefined, b: MutationBatch | PlainMessage<MutationBatch> | undefined): boolean;
}
