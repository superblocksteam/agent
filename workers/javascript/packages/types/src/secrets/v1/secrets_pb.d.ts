import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";
import { AkeylessAuth, AwsAuth, GcpAuth } from "../../plugins/common/v1/auth_pb";
import { Metadata } from "../../common/v1/common_pb";
/**
 * @generated from message secrets.v1.AwsSecretsManager
 */
export declare class AwsSecretsManager extends Message<AwsSecretsManager> {
    /**
     * @generated from field: plugins.common.v1.AwsAuth auth = 1;
     */
    auth?: AwsAuth;
    /**
     * @generated from field: optional string prefix = 2;
     */
    prefix?: string;
    constructor(data?: PartialMessage<AwsSecretsManager>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "secrets.v1.AwsSecretsManager";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): AwsSecretsManager;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): AwsSecretsManager;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): AwsSecretsManager;
    static equals(a: AwsSecretsManager | PlainMessage<AwsSecretsManager> | undefined, b: AwsSecretsManager | PlainMessage<AwsSecretsManager> | undefined): boolean;
}
/**
 * @generated from message secrets.v1.GcpSecretManager
 */
export declare class GcpSecretManager extends Message<GcpSecretManager> {
    /**
     * @generated from field: plugins.common.v1.GcpAuth auth = 1;
     */
    auth?: GcpAuth;
    /**
     * @generated from field: string project_id = 2;
     */
    projectId: string;
    constructor(data?: PartialMessage<GcpSecretManager>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "secrets.v1.GcpSecretManager";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): GcpSecretManager;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): GcpSecretManager;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): GcpSecretManager;
    static equals(a: GcpSecretManager | PlainMessage<GcpSecretManager> | undefined, b: GcpSecretManager | PlainMessage<GcpSecretManager> | undefined): boolean;
}
/**
 * @generated from message secrets.v1.AkeylessSecretsManager
 */
export declare class AkeylessSecretsManager extends Message<AkeylessSecretsManager> {
    /**
     * @generated from field: plugins.common.v1.AkeylessAuth auth = 1;
     */
    auth?: AkeylessAuth;
    /**
     * @generated from field: optional string host = 2;
     */
    host?: string;
    /**
     * @generated from field: optional string prefix = 3;
     */
    prefix?: string;
    constructor(data?: PartialMessage<AkeylessSecretsManager>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "secrets.v1.AkeylessSecretsManager";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): AkeylessSecretsManager;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): AkeylessSecretsManager;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): AkeylessSecretsManager;
    static equals(a: AkeylessSecretsManager | PlainMessage<AkeylessSecretsManager> | undefined, b: AkeylessSecretsManager | PlainMessage<AkeylessSecretsManager> | undefined): boolean;
}
/**
 * @generated from message secrets.v1.HashicorpVault
 */
export declare class HashicorpVault extends Message<HashicorpVault> {
    /**
     * @generated from field: secrets.v1.HashicorpVault.Auth auth = 1;
     */
    auth?: HashicorpVault_Auth;
    /**
     * The location of the vault server.
     *
     * @generated from field: string address = 2;
     */
    address: string;
    /**
     * The path to the vault
     *
     * @generated from field: optional string path = 3;
     */
    path?: string;
    /**
     * The Hashicorp Vault namespace.
     *
     * @generated from field: optional string namespace = 4;
     */
    namespace?: string;
    /**
     * The engine version.
     *
     * @generated from field: secrets.v1.HashicorpVault.Version version = 5;
     */
    version: HashicorpVault_Version;
    /**
     * the path to the secrets
     *
     * @generated from field: optional string secrets_path = 6;
     */
    secretsPath?: string;
    constructor(data?: PartialMessage<HashicorpVault>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "secrets.v1.HashicorpVault";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): HashicorpVault;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): HashicorpVault;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): HashicorpVault;
    static equals(a: HashicorpVault | PlainMessage<HashicorpVault> | undefined, b: HashicorpVault | PlainMessage<HashicorpVault> | undefined): boolean;
}
/**
 * @generated from enum secrets.v1.HashicorpVault.Version
 */
export declare enum HashicorpVault_Version {
    /**
     * @generated from enum value: VERSION_UNSPECIFIED = 0;
     */
    UNSPECIFIED = 0,
    /**
     * @generated from enum value: VERSION_V1 = 1;
     */
    V1 = 1,
    /**
     * @generated from enum value: VERSION_V2 = 2;
     */
    V2 = 2
}
/**
 * @generated from message secrets.v1.HashicorpVault.Auth
 */
export declare class HashicorpVault_Auth extends Message<HashicorpVault_Auth> {
    /**
     * @generated from oneof secrets.v1.HashicorpVault.Auth.config
     */
    config: {
        /**
         * @generated from field: string token = 1;
         */
        value: string;
        case: "token";
    } | {
        /**
         * @generated from field: secrets.v1.HashicorpVault.Auth.AppRole app_role = 2;
         */
        value: HashicorpVault_Auth_AppRole;
        case: "appRole";
    } | {
        case: undefined;
        value?: undefined;
    };
    constructor(data?: PartialMessage<HashicorpVault_Auth>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "secrets.v1.HashicorpVault.Auth";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): HashicorpVault_Auth;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): HashicorpVault_Auth;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): HashicorpVault_Auth;
    static equals(a: HashicorpVault_Auth | PlainMessage<HashicorpVault_Auth> | undefined, b: HashicorpVault_Auth | PlainMessage<HashicorpVault_Auth> | undefined): boolean;
}
/**
 * @generated from message secrets.v1.HashicorpVault.Auth.AppRole
 */
export declare class HashicorpVault_Auth_AppRole extends Message<HashicorpVault_Auth_AppRole> {
    /**
     * @generated from field: string role_id = 1;
     */
    roleId: string;
    /**
     * @generated from field: string secret_id = 2;
     */
    secretId: string;
    constructor(data?: PartialMessage<HashicorpVault_Auth_AppRole>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "secrets.v1.HashicorpVault.Auth.AppRole";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): HashicorpVault_Auth_AppRole;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): HashicorpVault_Auth_AppRole;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): HashicorpVault_Auth_AppRole;
    static equals(a: HashicorpVault_Auth_AppRole | PlainMessage<HashicorpVault_Auth_AppRole> | undefined, b: HashicorpVault_Auth_AppRole | PlainMessage<HashicorpVault_Auth_AppRole> | undefined): boolean;
}
/**
 * @generated from message secrets.v1.MockStore
 */
export declare class MockStore extends Message<MockStore> {
    /**
     * @generated from field: map<string, string> data = 1;
     */
    data: {
        [key: string]: string;
    };
    constructor(data?: PartialMessage<MockStore>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "secrets.v1.MockStore";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): MockStore;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MockStore;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MockStore;
    static equals(a: MockStore | PlainMessage<MockStore> | undefined, b: MockStore | PlainMessage<MockStore> | undefined): boolean;
}
/**
 * @generated from message secrets.v1.Provider
 */
export declare class Provider extends Message<Provider> {
    /**
     * @generated from oneof secrets.v1.Provider.config
     */
    config: {
        /**
         * @generated from field: secrets.v1.MockStore mock = 1;
         */
        value: MockStore;
        case: "mock";
    } | {
        /**
         * @generated from field: secrets.v1.AkeylessSecretsManager akeyless_secrets_manager = 2;
         */
        value: AkeylessSecretsManager;
        case: "akeylessSecretsManager";
    } | {
        /**
         * @generated from field: secrets.v1.AwsSecretsManager aws_secrets_manager = 3;
         */
        value: AwsSecretsManager;
        case: "awsSecretsManager";
    } | {
        /**
         * @generated from field: secrets.v1.GcpSecretManager gcp_secret_manager = 4;
         */
        value: GcpSecretManager;
        case: "gcpSecretManager";
    } | {
        /**
         * @generated from field: secrets.v1.HashicorpVault hashicorp_vault = 5;
         */
        value: HashicorpVault;
        case: "hashicorpVault";
    } | {
        case: undefined;
        value?: undefined;
    };
    constructor(data?: PartialMessage<Provider>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "secrets.v1.Provider";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Provider;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Provider;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Provider;
    static equals(a: Provider | PlainMessage<Provider> | undefined, b: Provider | PlainMessage<Provider> | undefined): boolean;
}
/**
 * @generated from message secrets.v1.Store
 */
export declare class Store extends Message<Store> {
    /**
     * @generated from field: common.v1.Metadata metadata = 1;
     */
    metadata?: Metadata;
    /**
     * @generated from field: secrets.v1.Provider provider = 2;
     */
    provider?: Provider;
    /**
     * @generated from field: optional int32 ttl = 3;
     */
    ttl?: number;
    /**
     * @generated from field: string configuration_id = 4;
     */
    configurationId: string;
    /**
     * @generated from field: bool cache = 5;
     */
    cache: boolean;
    constructor(data?: PartialMessage<Store>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "secrets.v1.Store";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Store;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Store;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Store;
    static equals(a: Store | PlainMessage<Store> | undefined, b: Store | PlainMessage<Store> | undefined): boolean;
}
/**
 * Details represents the details of a secret.
 * It does not contain the value.
 *
 * @generated from message secrets.v1.Details
 */
export declare class Details extends Message<Details> {
    /**
     * i.e. "foo"
     *
     * @generated from field: string alias = 1;
     */
    alias: string;
    /**
     * i.e. "/projects/my-project/secrets/foo/versions/1"
     *
     * @generated from field: string name = 2;
     */
    name: string;
    constructor(data?: PartialMessage<Details>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "secrets.v1.Details";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Details;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Details;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Details;
    static equals(a: Details | PlainMessage<Details> | undefined, b: Details | PlainMessage<Details> | undefined): boolean;
}
/**
 * @generated from message secrets.v1.Invalidation
 */
export declare class Invalidation extends Message<Invalidation> {
    /**
     * @generated from field: string alias = 1;
     */
    alias: string;
    /**
     * @generated from field: string configuration_id = 2;
     */
    configurationId: string;
    /**
     * @generated from field: string store = 3;
     */
    store: string;
    constructor(data?: PartialMessage<Invalidation>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "secrets.v1.Invalidation";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Invalidation;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Invalidation;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Invalidation;
    static equals(a: Invalidation | PlainMessage<Invalidation> | undefined, b: Invalidation | PlainMessage<Invalidation> | undefined): boolean;
}
