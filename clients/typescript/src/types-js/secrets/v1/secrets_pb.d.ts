// package: secrets.v1
// file: secrets/v1/secrets.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from 'google-protobuf';
import * as common_v1_common_pb from '../../common/v1/common_pb';
import * as buf_validate_validate_pb from '../../buf/validate/validate_pb';
import * as plugins_common_v1_auth_pb from '../../plugins/common/v1/auth_pb';

export class AwsSecretsManager extends jspb.Message {
  hasAuth(): boolean;
  clearAuth(): void;
  getAuth(): plugins_common_v1_auth_pb.AwsAuth | undefined;
  setAuth(value?: plugins_common_v1_auth_pb.AwsAuth): AwsSecretsManager;

  hasPrefix(): boolean;
  clearPrefix(): void;
  getPrefix(): string | undefined;
  setPrefix(value: string): AwsSecretsManager;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AwsSecretsManager.AsObject;
  static toObject(includeInstance: boolean, msg: AwsSecretsManager): AwsSecretsManager.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
  static serializeBinaryToWriter(message: AwsSecretsManager, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AwsSecretsManager;
  static deserializeBinaryFromReader(message: AwsSecretsManager, reader: jspb.BinaryReader): AwsSecretsManager;
}

export namespace AwsSecretsManager {
  export type AsObject = {
    auth?: plugins_common_v1_auth_pb.AwsAuth.AsObject;
    prefix?: string;
  };
}

export class GcpSecretManager extends jspb.Message {
  hasAuth(): boolean;
  clearAuth(): void;
  getAuth(): plugins_common_v1_auth_pb.GcpAuth | undefined;
  setAuth(value?: plugins_common_v1_auth_pb.GcpAuth): GcpSecretManager;
  getProjectId(): string;
  setProjectId(value: string): GcpSecretManager;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GcpSecretManager.AsObject;
  static toObject(includeInstance: boolean, msg: GcpSecretManager): GcpSecretManager.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
  static serializeBinaryToWriter(message: GcpSecretManager, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GcpSecretManager;
  static deserializeBinaryFromReader(message: GcpSecretManager, reader: jspb.BinaryReader): GcpSecretManager;
}

export namespace GcpSecretManager {
  export type AsObject = {
    auth?: plugins_common_v1_auth_pb.GcpAuth.AsObject;
    projectId: string;
  };
}

export class HashicorpVault extends jspb.Message {
  hasAuth(): boolean;
  clearAuth(): void;
  getAuth(): HashicorpVault.Auth | undefined;
  setAuth(value?: HashicorpVault.Auth): HashicorpVault;
  getAddress(): string;
  setAddress(value: string): HashicorpVault;

  hasPath(): boolean;
  clearPath(): void;
  getPath(): string | undefined;
  setPath(value: string): HashicorpVault;

  hasNamespace(): boolean;
  clearNamespace(): void;
  getNamespace(): string | undefined;
  setNamespace(value: string): HashicorpVault;
  getVersion(): HashicorpVault.Version;
  setVersion(value: HashicorpVault.Version): HashicorpVault;

  hasSecretsPath(): boolean;
  clearSecretsPath(): void;
  getSecretsPath(): string | undefined;
  setSecretsPath(value: string): HashicorpVault;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): HashicorpVault.AsObject;
  static toObject(includeInstance: boolean, msg: HashicorpVault): HashicorpVault.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
  static serializeBinaryToWriter(message: HashicorpVault, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): HashicorpVault;
  static deserializeBinaryFromReader(message: HashicorpVault, reader: jspb.BinaryReader): HashicorpVault;
}

export namespace HashicorpVault {
  export type AsObject = {
    auth?: HashicorpVault.Auth.AsObject;
    address: string;
    path?: string;
    namespace?: string;
    version: HashicorpVault.Version;
    secretsPath?: string;
  };

  export class Auth extends jspb.Message {
    hasToken(): boolean;
    clearToken(): void;
    getToken(): string;
    setToken(value: string): Auth;

    hasAppRole(): boolean;
    clearAppRole(): void;
    getAppRole(): HashicorpVault.Auth.AppRole | undefined;
    setAppRole(value?: HashicorpVault.Auth.AppRole): Auth;

    getConfigCase(): Auth.ConfigCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Auth.AsObject;
    static toObject(includeInstance: boolean, msg: Auth): Auth.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
    static serializeBinaryToWriter(message: Auth, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Auth;
    static deserializeBinaryFromReader(message: Auth, reader: jspb.BinaryReader): Auth;
  }

  export namespace Auth {
    export type AsObject = {
      token: string;
      appRole?: HashicorpVault.Auth.AppRole.AsObject;
    };

    export class AppRole extends jspb.Message {
      getRoleId(): string;
      setRoleId(value: string): AppRole;
      getSecretId(): string;
      setSecretId(value: string): AppRole;

      serializeBinary(): Uint8Array;
      toObject(includeInstance?: boolean): AppRole.AsObject;
      static toObject(includeInstance: boolean, msg: AppRole): AppRole.AsObject;
      static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
      static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
      static serializeBinaryToWriter(message: AppRole, writer: jspb.BinaryWriter): void;
      static deserializeBinary(bytes: Uint8Array): AppRole;
      static deserializeBinaryFromReader(message: AppRole, reader: jspb.BinaryReader): AppRole;
    }

    export namespace AppRole {
      export type AsObject = {
        roleId: string;
        secretId: string;
      };
    }

    export enum ConfigCase {
      CONFIG_NOT_SET = 0,
      TOKEN = 1,
      APP_ROLE = 2
    }
  }

  export enum Version {
    VERSION_UNSPECIFIED = 0,
    VERSION_V1 = 1,
    VERSION_V2 = 2
  }
}

export class MockStore extends jspb.Message {
  getDataMap(): jspb.Map<string, string>;
  clearDataMap(): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MockStore.AsObject;
  static toObject(includeInstance: boolean, msg: MockStore): MockStore.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
  static serializeBinaryToWriter(message: MockStore, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MockStore;
  static deserializeBinaryFromReader(message: MockStore, reader: jspb.BinaryReader): MockStore;
}

export namespace MockStore {
  export type AsObject = {
    dataMap: Array<[string, string]>;
  };
}

export class Provider extends jspb.Message {
  hasMock(): boolean;
  clearMock(): void;
  getMock(): MockStore | undefined;
  setMock(value?: MockStore): Provider;

  hasAwsSecretsManager(): boolean;
  clearAwsSecretsManager(): void;
  getAwsSecretsManager(): AwsSecretsManager | undefined;
  setAwsSecretsManager(value?: AwsSecretsManager): Provider;

  hasGcpSecretManager(): boolean;
  clearGcpSecretManager(): void;
  getGcpSecretManager(): GcpSecretManager | undefined;
  setGcpSecretManager(value?: GcpSecretManager): Provider;

  hasHashicorpVault(): boolean;
  clearHashicorpVault(): void;
  getHashicorpVault(): HashicorpVault | undefined;
  setHashicorpVault(value?: HashicorpVault): Provider;

  getConfigCase(): Provider.ConfigCase;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Provider.AsObject;
  static toObject(includeInstance: boolean, msg: Provider): Provider.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
  static serializeBinaryToWriter(message: Provider, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Provider;
  static deserializeBinaryFromReader(message: Provider, reader: jspb.BinaryReader): Provider;
}

export namespace Provider {
  export type AsObject = {
    mock?: MockStore.AsObject;
    awsSecretsManager?: AwsSecretsManager.AsObject;
    gcpSecretManager?: GcpSecretManager.AsObject;
    hashicorpVault?: HashicorpVault.AsObject;
  };

  export enum ConfigCase {
    CONFIG_NOT_SET = 0,
    MOCK = 1,
    AWS_SECRETS_MANAGER = 2,
    GCP_SECRET_MANAGER = 3,
    HASHICORP_VAULT = 4
  }
}

export class Store extends jspb.Message {
  hasMetadata(): boolean;
  clearMetadata(): void;
  getMetadata(): common_v1_common_pb.Metadata | undefined;
  setMetadata(value?: common_v1_common_pb.Metadata): Store;

  hasProvider(): boolean;
  clearProvider(): void;
  getProvider(): Provider | undefined;
  setProvider(value?: Provider): Store;

  hasTtl(): boolean;
  clearTtl(): void;
  getTtl(): number | undefined;
  setTtl(value: number): Store;
  getConfigurationId(): string;
  setConfigurationId(value: string): Store;
  getCache(): boolean;
  setCache(value: boolean): Store;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Store.AsObject;
  static toObject(includeInstance: boolean, msg: Store): Store.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
  static serializeBinaryToWriter(message: Store, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Store;
  static deserializeBinaryFromReader(message: Store, reader: jspb.BinaryReader): Store;
}

export namespace Store {
  export type AsObject = {
    metadata?: common_v1_common_pb.Metadata.AsObject;
    provider?: Provider.AsObject;
    ttl?: number;
    configurationId: string;
    cache: boolean;
  };
}

export class Details extends jspb.Message {
  getAlias(): string;
  setAlias(value: string): Details;
  getName(): string;
  setName(value: string): Details;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Details.AsObject;
  static toObject(includeInstance: boolean, msg: Details): Details.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
  static serializeBinaryToWriter(message: Details, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Details;
  static deserializeBinaryFromReader(message: Details, reader: jspb.BinaryReader): Details;
}

export namespace Details {
  export type AsObject = {
    alias: string;
    name: string;
  };
}

export class Invalidation extends jspb.Message {
  getAlias(): string;
  setAlias(value: string): Invalidation;
  getConfigurationId(): string;
  setConfigurationId(value: string): Invalidation;
  getStore(): string;
  setStore(value: string): Invalidation;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Invalidation.AsObject;
  static toObject(includeInstance: boolean, msg: Invalidation): Invalidation.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
  static serializeBinaryToWriter(message: Invalidation, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Invalidation;
  static deserializeBinaryFromReader(message: Invalidation, reader: jspb.BinaryReader): Invalidation;
}

export namespace Invalidation {
  export type AsObject = {
    alias: string;
    configurationId: string;
    store: string;
  };
}
