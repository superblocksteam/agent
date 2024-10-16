// @generated by protoc-gen-es v1.2.0 with parameter "target=ts"
// @generated from file auth/v1/auth.proto (package auth.v1, syntax proto3)
/* eslint-disable */
// @ts-nocheck

import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";

/**
 * @generated from message auth.v1.Claims
 */
export class Claims extends Message<Claims> {
  /**
   * @generated from field: string user_email = 1;
   */
  userEmail = "";

  /**
   * @generated from field: string org_id = 2;
   */
  orgId = "";

  /**
   * @generated from field: string org_type = 3;
   */
  orgType = "";

  /**
   * @generated from field: string rbac_role = 4;
   */
  rbacRole = "";

  /**
   * @generated from field: repeated string rbac_groups = 5;
   */
  rbacGroups: string[] = [];

  /**
   * @generated from field: string user_type = 6;
   */
  userType = "";

  constructor(data?: PartialMessage<Claims>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "auth.v1.Claims";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "user_email", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 2, name: "org_id", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 3, name: "org_type", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 4, name: "rbac_role", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 5, name: "rbac_groups", kind: "scalar", T: 9 /* ScalarType.STRING */, repeated: true },
    { no: 6, name: "user_type", kind: "scalar", T: 9 /* ScalarType.STRING */ },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Claims {
    return new Claims().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Claims {
    return new Claims().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Claims {
    return new Claims().fromJsonString(jsonString, options);
  }

  static equals(a: Claims | PlainMessage<Claims> | undefined, b: Claims | PlainMessage<Claims> | undefined): boolean {
    return proto3.util.equals(Claims, a, b);
  }
}

