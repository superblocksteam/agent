import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";
/**
 * @generated from message auth.v1.Claims
 */
export declare class Claims extends Message<Claims> {
    /**
     * @generated from field: string user_email = 1;
     */
    userEmail: string;
    /**
     * @generated from field: string org_id = 2;
     */
    orgId: string;
    /**
     * @generated from field: string org_type = 3;
     */
    orgType: string;
    /**
     * @generated from field: string rbac_role = 4;
     */
    rbacRole: string;
    /**
     * @generated from field: repeated string rbac_groups = 5;
     */
    rbacGroups: string[];
    /**
     * @generated from field: string user_type = 6;
     */
    userType: string;
    constructor(data?: PartialMessage<Claims>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "auth.v1.Claims";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Claims;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Claims;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Claims;
    static equals(a: Claims | PlainMessage<Claims> | undefined, b: Claims | PlainMessage<Claims> | undefined): boolean;
}
