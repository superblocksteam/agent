// package: plugins.redis.v1
// file: plugins/redis/v1/plugin.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from 'google-protobuf';
import * as plugins_common_v1_plugin_pb from '../../../plugins/common/v1/plugin_pb';

export class Plugin extends jspb.Message {
  hasName(): boolean;
  clearName(): void;
  getName(): string | undefined;
  setName(value: string): Plugin;

  hasConnection(): boolean;
  clearConnection(): void;
  getConnection(): Plugin.Connection | undefined;
  setConnection(value?: Plugin.Connection): Plugin;

  hasRaw(): boolean;
  clearRaw(): void;
  getRaw(): Plugin.Raw | undefined;
  setRaw(value?: Plugin.Raw): Plugin;

  hasStructured(): boolean;
  clearStructured(): void;
  getStructured(): Plugin.Structured | undefined;
  setStructured(value?: Plugin.Structured): Plugin;

  hasDynamicWorkflowConfiguration(): boolean;
  clearDynamicWorkflowConfiguration(): void;
  getDynamicWorkflowConfiguration(): plugins_common_v1_plugin_pb.DynamicWorkflowConfiguration | undefined;
  setDynamicWorkflowConfiguration(value?: plugins_common_v1_plugin_pb.DynamicWorkflowConfiguration): Plugin;

  getCommandTypeCase(): Plugin.CommandTypeCase;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Plugin.AsObject;
  static toObject(includeInstance: boolean, msg: Plugin): Plugin.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
  static serializeBinaryToWriter(message: Plugin, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Plugin;
  static deserializeBinaryFromReader(message: Plugin, reader: jspb.BinaryReader): Plugin;
}

export namespace Plugin {
  export type AsObject = {
    name?: string;
    connection?: Plugin.Connection.AsObject;
    raw?: Plugin.Raw.AsObject;
    structured?: Plugin.Structured.AsObject;
    dynamicWorkflowConfiguration?: plugins_common_v1_plugin_pb.DynamicWorkflowConfiguration.AsObject;
  };

  export class Raw extends jspb.Message {
    hasSingleton(): boolean;
    clearSingleton(): void;
    getSingleton(): Plugin.Raw.Singleton | undefined;
    setSingleton(value?: Plugin.Raw.Singleton): Raw;

    getActionCase(): Raw.ActionCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Raw.AsObject;
    static toObject(includeInstance: boolean, msg: Raw): Raw.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
    static serializeBinaryToWriter(message: Raw, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Raw;
    static deserializeBinaryFromReader(message: Raw, reader: jspb.BinaryReader): Raw;
  }

  export namespace Raw {
    export type AsObject = {
      singleton?: Plugin.Raw.Singleton.AsObject;
    };

    export class Singleton extends jspb.Message {
      getQuery(): string;
      setQuery(value: string): Singleton;

      serializeBinary(): Uint8Array;
      toObject(includeInstance?: boolean): Singleton.AsObject;
      static toObject(includeInstance: boolean, msg: Singleton): Singleton.AsObject;
      static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
      static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
      static serializeBinaryToWriter(message: Singleton, writer: jspb.BinaryWriter): void;
      static deserializeBinary(bytes: Uint8Array): Singleton;
      static deserializeBinaryFromReader(message: Singleton, reader: jspb.BinaryReader): Singleton;
    }

    export namespace Singleton {
      export type AsObject = {
        query: string;
      };
    }

    export enum ActionCase {
      ACTION_NOT_SET = 0,
      SINGLETON = 1
    }
  }

  export class Structured extends jspb.Message {
    hasGet(): boolean;
    clearGet(): void;
    getGet(): Plugin.Get | undefined;
    setGet(value?: Plugin.Get): Structured;

    hasSet(): boolean;
    clearSet(): void;
    getSet(): Plugin.Set | undefined;
    setSet(value?: Plugin.Set): Structured;

    hasDel(): boolean;
    clearDel(): void;
    getDel(): Plugin.Del | undefined;
    setDel(value?: Plugin.Del): Structured;

    hasKeys(): boolean;
    clearKeys(): void;
    getKeys(): Plugin.Keys | undefined;
    setKeys(value?: Plugin.Keys): Structured;

    hasMget(): boolean;
    clearMget(): void;
    getMget(): Plugin.Mget | undefined;
    setMget(value?: Plugin.Mget): Structured;

    hasHget(): boolean;
    clearHget(): void;
    getHget(): Plugin.Hget | undefined;
    setHget(value?: Plugin.Hget): Structured;

    hasHmget(): boolean;
    clearHmget(): void;
    getHmget(): Plugin.Hmget | undefined;
    setHmget(value?: Plugin.Hmget): Structured;

    hasHgetall(): boolean;
    clearHgetall(): void;
    getHgetall(): Plugin.Hgetall | undefined;
    setHgetall(value?: Plugin.Hgetall): Structured;

    hasHset(): boolean;
    clearHset(): void;
    getHset(): Plugin.Hset | undefined;
    setHset(value?: Plugin.Hset): Structured;

    hasHsetnx(): boolean;
    clearHsetnx(): void;
    getHsetnx(): Plugin.Hsetnx | undefined;
    setHsetnx(value?: Plugin.Hsetnx): Structured;

    hasHlen(): boolean;
    clearHlen(): void;
    getHlen(): Plugin.Hlen | undefined;
    setHlen(value?: Plugin.Hlen): Structured;

    hasHdel(): boolean;
    clearHdel(): void;
    getHdel(): Plugin.Hdel | undefined;
    setHdel(value?: Plugin.Hdel): Structured;

    hasHkeys(): boolean;
    clearHkeys(): void;
    getHkeys(): Plugin.Hkeys | undefined;
    setHkeys(value?: Plugin.Hkeys): Structured;

    hasHvals(): boolean;
    clearHvals(): void;
    getHvals(): Plugin.Hvals | undefined;
    setHvals(value?: Plugin.Hvals): Structured;

    hasLindex(): boolean;
    clearLindex(): void;
    getLindex(): Plugin.Lindex | undefined;
    setLindex(value?: Plugin.Lindex): Structured;

    hasLlen(): boolean;
    clearLlen(): void;
    getLlen(): Plugin.Llen | undefined;
    setLlen(value?: Plugin.Llen): Structured;

    hasLpush(): boolean;
    clearLpush(): void;
    getLpush(): Plugin.Lpush | undefined;
    setLpush(value?: Plugin.Lpush): Structured;

    hasLrem(): boolean;
    clearLrem(): void;
    getLrem(): Plugin.Lrem | undefined;
    setLrem(value?: Plugin.Lrem): Structured;

    hasLrange(): boolean;
    clearLrange(): void;
    getLrange(): Plugin.Lrange | undefined;
    setLrange(value?: Plugin.Lrange): Structured;

    hasSadd(): boolean;
    clearSadd(): void;
    getSadd(): Plugin.Sadd | undefined;
    setSadd(value?: Plugin.Sadd): Structured;

    hasScard(): boolean;
    clearScard(): void;
    getScard(): Plugin.Scard | undefined;
    setScard(value?: Plugin.Scard): Structured;

    hasSmembers(): boolean;
    clearSmembers(): void;
    getSmembers(): Plugin.Smembers | undefined;
    setSmembers(value?: Plugin.Smembers): Structured;

    hasSismember(): boolean;
    clearSismember(): void;
    getSismember(): Plugin.Sismember | undefined;
    setSismember(value?: Plugin.Sismember): Structured;

    hasSrandmember(): boolean;
    clearSrandmember(): void;
    getSrandmember(): Plugin.Srandmember | undefined;
    setSrandmember(value?: Plugin.Srandmember): Structured;

    hasSrem(): boolean;
    clearSrem(): void;
    getSrem(): Plugin.Srem | undefined;
    setSrem(value?: Plugin.Srem): Structured;

    hasZadd(): boolean;
    clearZadd(): void;
    getZadd(): Plugin.Zadd | undefined;
    setZadd(value?: Plugin.Zadd): Structured;

    hasZcard(): boolean;
    clearZcard(): void;
    getZcard(): Plugin.Zcard | undefined;
    setZcard(value?: Plugin.Zcard): Structured;

    hasZcount(): boolean;
    clearZcount(): void;
    getZcount(): Plugin.Zcount | undefined;
    setZcount(value?: Plugin.Zcount): Structured;

    hasZrange(): boolean;
    clearZrange(): void;
    getZrange(): Plugin.Zrange | undefined;
    setZrange(value?: Plugin.Zrange): Structured;

    hasZrank(): boolean;
    clearZrank(): void;
    getZrank(): Plugin.Zrank | undefined;
    setZrank(value?: Plugin.Zrank): Structured;

    hasZrem(): boolean;
    clearZrem(): void;
    getZrem(): Plugin.Zrem | undefined;
    setZrem(value?: Plugin.Zrem): Structured;

    hasZscore(): boolean;
    clearZscore(): void;
    getZscore(): Plugin.Zscore | undefined;
    setZscore(value?: Plugin.Zscore): Structured;

    hasExpire(): boolean;
    clearExpire(): void;
    getExpire(): Plugin.Expire | undefined;
    setExpire(value?: Plugin.Expire): Structured;

    hasTtl(): boolean;
    clearTtl(): void;
    getTtl(): Plugin.Ttl | undefined;
    setTtl(value?: Plugin.Ttl): Structured;

    getActionCase(): Structured.ActionCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Structured.AsObject;
    static toObject(includeInstance: boolean, msg: Structured): Structured.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
    static serializeBinaryToWriter(message: Structured, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Structured;
    static deserializeBinaryFromReader(message: Structured, reader: jspb.BinaryReader): Structured;
  }

  export namespace Structured {
    export type AsObject = {
      get?: Plugin.Get.AsObject;
      set?: Plugin.Set.AsObject;
      del?: Plugin.Del.AsObject;
      keys?: Plugin.Keys.AsObject;
      mget?: Plugin.Mget.AsObject;
      hget?: Plugin.Hget.AsObject;
      hmget?: Plugin.Hmget.AsObject;
      hgetall?: Plugin.Hgetall.AsObject;
      hset?: Plugin.Hset.AsObject;
      hsetnx?: Plugin.Hsetnx.AsObject;
      hlen?: Plugin.Hlen.AsObject;
      hdel?: Plugin.Hdel.AsObject;
      hkeys?: Plugin.Hkeys.AsObject;
      hvals?: Plugin.Hvals.AsObject;
      lindex?: Plugin.Lindex.AsObject;
      llen?: Plugin.Llen.AsObject;
      lpush?: Plugin.Lpush.AsObject;
      lrem?: Plugin.Lrem.AsObject;
      lrange?: Plugin.Lrange.AsObject;
      sadd?: Plugin.Sadd.AsObject;
      scard?: Plugin.Scard.AsObject;
      smembers?: Plugin.Smembers.AsObject;
      sismember?: Plugin.Sismember.AsObject;
      srandmember?: Plugin.Srandmember.AsObject;
      srem?: Plugin.Srem.AsObject;
      zadd?: Plugin.Zadd.AsObject;
      zcard?: Plugin.Zcard.AsObject;
      zcount?: Plugin.Zcount.AsObject;
      zrange?: Plugin.Zrange.AsObject;
      zrank?: Plugin.Zrank.AsObject;
      zrem?: Plugin.Zrem.AsObject;
      zscore?: Plugin.Zscore.AsObject;
      expire?: Plugin.Expire.AsObject;
      ttl?: Plugin.Ttl.AsObject;
    };

    export enum ActionCase {
      ACTION_NOT_SET = 0,
      GET = 6,
      SET = 7,
      DEL = 8,
      KEYS = 9,
      MGET = 10,
      HGET = 11,
      HMGET = 12,
      HGETALL = 13,
      HSET = 14,
      HSETNX = 15,
      HLEN = 16,
      HDEL = 17,
      HKEYS = 18,
      HVALS = 19,
      LINDEX = 20,
      LLEN = 21,
      LPUSH = 22,
      LREM = 23,
      LRANGE = 24,
      SADD = 25,
      SCARD = 26,
      SMEMBERS = 27,
      SISMEMBER = 28,
      SRANDMEMBER = 29,
      SREM = 30,
      ZADD = 31,
      ZCARD = 32,
      ZCOUNT = 33,
      ZRANGE = 34,
      ZRANK = 35,
      ZREM = 36,
      ZSCORE = 37,
      EXPIRE = 38,
      TTL = 39
    }
  }

  export class Connection extends jspb.Message {
    hasUrl(): boolean;
    clearUrl(): void;
    getUrl(): Plugin.Connection.Url | undefined;
    setUrl(value?: Plugin.Connection.Url): Connection;

    hasFields(): boolean;
    clearFields(): void;
    getFields(): Plugin.Connection.Fields | undefined;
    setFields(value?: Plugin.Connection.Fields): Connection;

    getConnectionTypeCase(): Connection.ConnectionTypeCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Connection.AsObject;
    static toObject(includeInstance: boolean, msg: Connection): Connection.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
    static serializeBinaryToWriter(message: Connection, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Connection;
    static deserializeBinaryFromReader(message: Connection, reader: jspb.BinaryReader): Connection;
  }

  export namespace Connection {
    export type AsObject = {
      url?: Plugin.Connection.Url.AsObject;
      fields?: Plugin.Connection.Fields.AsObject;
    };

    export class Url extends jspb.Message {
      getUrlString(): string;
      setUrlString(value: string): Url;

      serializeBinary(): Uint8Array;
      toObject(includeInstance?: boolean): Url.AsObject;
      static toObject(includeInstance: boolean, msg: Url): Url.AsObject;
      static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
      static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
      static serializeBinaryToWriter(message: Url, writer: jspb.BinaryWriter): void;
      static deserializeBinary(bytes: Uint8Array): Url;
      static deserializeBinaryFromReader(message: Url, reader: jspb.BinaryReader): Url;
    }

    export namespace Url {
      export type AsObject = {
        urlString: string;
      };
    }

    export class Fields extends jspb.Message {
      getHost(): string;
      setHost(value: string): Fields;
      getPort(): number;
      setPort(value: number): Fields;

      hasDatabaseNumber(): boolean;
      clearDatabaseNumber(): void;
      getDatabaseNumber(): number | undefined;
      setDatabaseNumber(value: number): Fields;

      hasUsername(): boolean;
      clearUsername(): void;
      getUsername(): string | undefined;
      setUsername(value: string): Fields;

      hasPassword(): boolean;
      clearPassword(): void;
      getPassword(): string | undefined;
      setPassword(value: string): Fields;
      getEnableSsl(): boolean;
      setEnableSsl(value: boolean): Fields;

      serializeBinary(): Uint8Array;
      toObject(includeInstance?: boolean): Fields.AsObject;
      static toObject(includeInstance: boolean, msg: Fields): Fields.AsObject;
      static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
      static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
      static serializeBinaryToWriter(message: Fields, writer: jspb.BinaryWriter): void;
      static deserializeBinary(bytes: Uint8Array): Fields;
      static deserializeBinaryFromReader(message: Fields, reader: jspb.BinaryReader): Fields;
    }

    export namespace Fields {
      export type AsObject = {
        host: string;
        port: number;
        databaseNumber?: number;
        username?: string;
        password?: string;
        enableSsl: boolean;
      };
    }

    export enum ConnectionTypeCase {
      CONNECTION_TYPE_NOT_SET = 0,
      URL = 1,
      FIELDS = 2
    }
  }

  export class Get extends jspb.Message {
    getKey(): string;
    setKey(value: string): Get;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Get.AsObject;
    static toObject(includeInstance: boolean, msg: Get): Get.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
    static serializeBinaryToWriter(message: Get, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Get;
    static deserializeBinaryFromReader(message: Get, reader: jspb.BinaryReader): Get;
  }

  export namespace Get {
    export type AsObject = {
      key: string;
    };
  }

  export class Set extends jspb.Message {
    getKey(): string;
    setKey(value: string): Set;
    getValue(): string;
    setValue(value: string): Set;

    hasExpirationMs(): boolean;
    clearExpirationMs(): void;
    getExpirationMs(): number | undefined;
    setExpirationMs(value: number): Set;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Set.AsObject;
    static toObject(includeInstance: boolean, msg: Set): Set.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
    static serializeBinaryToWriter(message: Set, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Set;
    static deserializeBinaryFromReader(message: Set, reader: jspb.BinaryReader): Set;
  }

  export namespace Set {
    export type AsObject = {
      key: string;
      value: string;
      expirationMs?: number;
    };
  }

  export class Del extends jspb.Message {
    getKey(): string;
    setKey(value: string): Del;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Del.AsObject;
    static toObject(includeInstance: boolean, msg: Del): Del.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
    static serializeBinaryToWriter(message: Del, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Del;
    static deserializeBinaryFromReader(message: Del, reader: jspb.BinaryReader): Del;
  }

  export namespace Del {
    export type AsObject = {
      key: string;
    };
  }

  export class Keys extends jspb.Message {
    getPattern(): string;
    setPattern(value: string): Keys;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Keys.AsObject;
    static toObject(includeInstance: boolean, msg: Keys): Keys.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
    static serializeBinaryToWriter(message: Keys, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Keys;
    static deserializeBinaryFromReader(message: Keys, reader: jspb.BinaryReader): Keys;
  }

  export namespace Keys {
    export type AsObject = {
      pattern: string;
    };
  }

  export class Mget extends jspb.Message {
    getKeys(): string;
    setKeys(value: string): Mget;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Mget.AsObject;
    static toObject(includeInstance: boolean, msg: Mget): Mget.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
    static serializeBinaryToWriter(message: Mget, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Mget;
    static deserializeBinaryFromReader(message: Mget, reader: jspb.BinaryReader): Mget;
  }

  export namespace Mget {
    export type AsObject = {
      keys: string;
    };
  }

  export class Hget extends jspb.Message {
    getKey(): string;
    setKey(value: string): Hget;
    getField(): string;
    setField(value: string): Hget;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Hget.AsObject;
    static toObject(includeInstance: boolean, msg: Hget): Hget.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
    static serializeBinaryToWriter(message: Hget, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Hget;
    static deserializeBinaryFromReader(message: Hget, reader: jspb.BinaryReader): Hget;
  }

  export namespace Hget {
    export type AsObject = {
      key: string;
      field: string;
    };
  }

  export class Hmget extends jspb.Message {
    getKey(): string;
    setKey(value: string): Hmget;
    getFields(): string;
    setFields(value: string): Hmget;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Hmget.AsObject;
    static toObject(includeInstance: boolean, msg: Hmget): Hmget.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
    static serializeBinaryToWriter(message: Hmget, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Hmget;
    static deserializeBinaryFromReader(message: Hmget, reader: jspb.BinaryReader): Hmget;
  }

  export namespace Hmget {
    export type AsObject = {
      key: string;
      fields: string;
    };
  }

  export class Hgetall extends jspb.Message {
    getKey(): string;
    setKey(value: string): Hgetall;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Hgetall.AsObject;
    static toObject(includeInstance: boolean, msg: Hgetall): Hgetall.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
    static serializeBinaryToWriter(message: Hgetall, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Hgetall;
    static deserializeBinaryFromReader(message: Hgetall, reader: jspb.BinaryReader): Hgetall;
  }

  export namespace Hgetall {
    export type AsObject = {
      key: string;
    };
  }

  export class Hset extends jspb.Message {
    getKey(): string;
    setKey(value: string): Hset;
    getField(): string;
    setField(value: string): Hset;
    getValue(): string;
    setValue(value: string): Hset;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Hset.AsObject;
    static toObject(includeInstance: boolean, msg: Hset): Hset.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
    static serializeBinaryToWriter(message: Hset, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Hset;
    static deserializeBinaryFromReader(message: Hset, reader: jspb.BinaryReader): Hset;
  }

  export namespace Hset {
    export type AsObject = {
      key: string;
      field: string;
      value: string;
    };
  }

  export class Hsetnx extends jspb.Message {
    getKey(): string;
    setKey(value: string): Hsetnx;
    getField(): string;
    setField(value: string): Hsetnx;
    getValue(): string;
    setValue(value: string): Hsetnx;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Hsetnx.AsObject;
    static toObject(includeInstance: boolean, msg: Hsetnx): Hsetnx.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
    static serializeBinaryToWriter(message: Hsetnx, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Hsetnx;
    static deserializeBinaryFromReader(message: Hsetnx, reader: jspb.BinaryReader): Hsetnx;
  }

  export namespace Hsetnx {
    export type AsObject = {
      key: string;
      field: string;
      value: string;
    };
  }

  export class Hlen extends jspb.Message {
    getKey(): string;
    setKey(value: string): Hlen;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Hlen.AsObject;
    static toObject(includeInstance: boolean, msg: Hlen): Hlen.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
    static serializeBinaryToWriter(message: Hlen, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Hlen;
    static deserializeBinaryFromReader(message: Hlen, reader: jspb.BinaryReader): Hlen;
  }

  export namespace Hlen {
    export type AsObject = {
      key: string;
    };
  }

  export class Hdel extends jspb.Message {
    getKey(): string;
    setKey(value: string): Hdel;
    getField(): string;
    setField(value: string): Hdel;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Hdel.AsObject;
    static toObject(includeInstance: boolean, msg: Hdel): Hdel.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
    static serializeBinaryToWriter(message: Hdel, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Hdel;
    static deserializeBinaryFromReader(message: Hdel, reader: jspb.BinaryReader): Hdel;
  }

  export namespace Hdel {
    export type AsObject = {
      key: string;
      field: string;
    };
  }

  export class Hkeys extends jspb.Message {
    getKey(): string;
    setKey(value: string): Hkeys;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Hkeys.AsObject;
    static toObject(includeInstance: boolean, msg: Hkeys): Hkeys.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
    static serializeBinaryToWriter(message: Hkeys, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Hkeys;
    static deserializeBinaryFromReader(message: Hkeys, reader: jspb.BinaryReader): Hkeys;
  }

  export namespace Hkeys {
    export type AsObject = {
      key: string;
    };
  }

  export class Hvals extends jspb.Message {
    getKey(): string;
    setKey(value: string): Hvals;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Hvals.AsObject;
    static toObject(includeInstance: boolean, msg: Hvals): Hvals.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
    static serializeBinaryToWriter(message: Hvals, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Hvals;
    static deserializeBinaryFromReader(message: Hvals, reader: jspb.BinaryReader): Hvals;
  }

  export namespace Hvals {
    export type AsObject = {
      key: string;
    };
  }

  export class Lindex extends jspb.Message {
    getKey(): string;
    setKey(value: string): Lindex;
    getIndex(): number;
    setIndex(value: number): Lindex;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Lindex.AsObject;
    static toObject(includeInstance: boolean, msg: Lindex): Lindex.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
    static serializeBinaryToWriter(message: Lindex, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Lindex;
    static deserializeBinaryFromReader(message: Lindex, reader: jspb.BinaryReader): Lindex;
  }

  export namespace Lindex {
    export type AsObject = {
      key: string;
      index: number;
    };
  }

  export class Llen extends jspb.Message {
    getKey(): string;
    setKey(value: string): Llen;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Llen.AsObject;
    static toObject(includeInstance: boolean, msg: Llen): Llen.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
    static serializeBinaryToWriter(message: Llen, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Llen;
    static deserializeBinaryFromReader(message: Llen, reader: jspb.BinaryReader): Llen;
  }

  export namespace Llen {
    export type AsObject = {
      key: string;
    };
  }

  export class Lpush extends jspb.Message {
    getKey(): string;
    setKey(value: string): Lpush;
    getValue(): string;
    setValue(value: string): Lpush;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Lpush.AsObject;
    static toObject(includeInstance: boolean, msg: Lpush): Lpush.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
    static serializeBinaryToWriter(message: Lpush, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Lpush;
    static deserializeBinaryFromReader(message: Lpush, reader: jspb.BinaryReader): Lpush;
  }

  export namespace Lpush {
    export type AsObject = {
      key: string;
      value: string;
    };
  }

  export class Lrem extends jspb.Message {
    getKey(): string;
    setKey(value: string): Lrem;
    getCount(): number;
    setCount(value: number): Lrem;
    getValue(): string;
    setValue(value: string): Lrem;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Lrem.AsObject;
    static toObject(includeInstance: boolean, msg: Lrem): Lrem.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
    static serializeBinaryToWriter(message: Lrem, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Lrem;
    static deserializeBinaryFromReader(message: Lrem, reader: jspb.BinaryReader): Lrem;
  }

  export namespace Lrem {
    export type AsObject = {
      key: string;
      count: number;
      value: string;
    };
  }

  export class Lrange extends jspb.Message {
    getKey(): string;
    setKey(value: string): Lrange;
    getStart(): number;
    setStart(value: number): Lrange;
    getStop(): number;
    setStop(value: number): Lrange;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Lrange.AsObject;
    static toObject(includeInstance: boolean, msg: Lrange): Lrange.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
    static serializeBinaryToWriter(message: Lrange, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Lrange;
    static deserializeBinaryFromReader(message: Lrange, reader: jspb.BinaryReader): Lrange;
  }

  export namespace Lrange {
    export type AsObject = {
      key: string;
      start: number;
      stop: number;
    };
  }

  export class Sadd extends jspb.Message {
    getKey(): string;
    setKey(value: string): Sadd;
    getMember(): string;
    setMember(value: string): Sadd;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Sadd.AsObject;
    static toObject(includeInstance: boolean, msg: Sadd): Sadd.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
    static serializeBinaryToWriter(message: Sadd, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Sadd;
    static deserializeBinaryFromReader(message: Sadd, reader: jspb.BinaryReader): Sadd;
  }

  export namespace Sadd {
    export type AsObject = {
      key: string;
      member: string;
    };
  }

  export class Scard extends jspb.Message {
    getKey(): string;
    setKey(value: string): Scard;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Scard.AsObject;
    static toObject(includeInstance: boolean, msg: Scard): Scard.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
    static serializeBinaryToWriter(message: Scard, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Scard;
    static deserializeBinaryFromReader(message: Scard, reader: jspb.BinaryReader): Scard;
  }

  export namespace Scard {
    export type AsObject = {
      key: string;
    };
  }

  export class Smembers extends jspb.Message {
    getKey(): string;
    setKey(value: string): Smembers;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Smembers.AsObject;
    static toObject(includeInstance: boolean, msg: Smembers): Smembers.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
    static serializeBinaryToWriter(message: Smembers, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Smembers;
    static deserializeBinaryFromReader(message: Smembers, reader: jspb.BinaryReader): Smembers;
  }

  export namespace Smembers {
    export type AsObject = {
      key: string;
    };
  }

  export class Sismember extends jspb.Message {
    getKey(): string;
    setKey(value: string): Sismember;
    getMember(): string;
    setMember(value: string): Sismember;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Sismember.AsObject;
    static toObject(includeInstance: boolean, msg: Sismember): Sismember.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
    static serializeBinaryToWriter(message: Sismember, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Sismember;
    static deserializeBinaryFromReader(message: Sismember, reader: jspb.BinaryReader): Sismember;
  }

  export namespace Sismember {
    export type AsObject = {
      key: string;
      member: string;
    };
  }

  export class Srandmember extends jspb.Message {
    getKey(): string;
    setKey(value: string): Srandmember;

    hasCount(): boolean;
    clearCount(): void;
    getCount(): number | undefined;
    setCount(value: number): Srandmember;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Srandmember.AsObject;
    static toObject(includeInstance: boolean, msg: Srandmember): Srandmember.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
    static serializeBinaryToWriter(message: Srandmember, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Srandmember;
    static deserializeBinaryFromReader(message: Srandmember, reader: jspb.BinaryReader): Srandmember;
  }

  export namespace Srandmember {
    export type AsObject = {
      key: string;
      count?: number;
    };
  }

  export class Srem extends jspb.Message {
    getKey(): string;
    setKey(value: string): Srem;
    getMember(): string;
    setMember(value: string): Srem;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Srem.AsObject;
    static toObject(includeInstance: boolean, msg: Srem): Srem.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
    static serializeBinaryToWriter(message: Srem, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Srem;
    static deserializeBinaryFromReader(message: Srem, reader: jspb.BinaryReader): Srem;
  }

  export namespace Srem {
    export type AsObject = {
      key: string;
      member: string;
    };
  }

  export class Zadd extends jspb.Message {
    getKey(): string;
    setKey(value: string): Zadd;
    getScore(): number;
    setScore(value: number): Zadd;
    getMember(): string;
    setMember(value: string): Zadd;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Zadd.AsObject;
    static toObject(includeInstance: boolean, msg: Zadd): Zadd.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
    static serializeBinaryToWriter(message: Zadd, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Zadd;
    static deserializeBinaryFromReader(message: Zadd, reader: jspb.BinaryReader): Zadd;
  }

  export namespace Zadd {
    export type AsObject = {
      key: string;
      score: number;
      member: string;
    };
  }

  export class Zcard extends jspb.Message {
    getKey(): string;
    setKey(value: string): Zcard;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Zcard.AsObject;
    static toObject(includeInstance: boolean, msg: Zcard): Zcard.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
    static serializeBinaryToWriter(message: Zcard, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Zcard;
    static deserializeBinaryFromReader(message: Zcard, reader: jspb.BinaryReader): Zcard;
  }

  export namespace Zcard {
    export type AsObject = {
      key: string;
    };
  }

  export class Zcount extends jspb.Message {
    getKey(): string;
    setKey(value: string): Zcount;
    getMin(): number;
    setMin(value: number): Zcount;
    getMax(): number;
    setMax(value: number): Zcount;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Zcount.AsObject;
    static toObject(includeInstance: boolean, msg: Zcount): Zcount.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
    static serializeBinaryToWriter(message: Zcount, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Zcount;
    static deserializeBinaryFromReader(message: Zcount, reader: jspb.BinaryReader): Zcount;
  }

  export namespace Zcount {
    export type AsObject = {
      key: string;
      min: number;
      max: number;
    };
  }

  export class Zrange extends jspb.Message {
    getKey(): string;
    setKey(value: string): Zrange;
    getStart(): number;
    setStart(value: number): Zrange;
    getStop(): number;
    setStop(value: number): Zrange;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Zrange.AsObject;
    static toObject(includeInstance: boolean, msg: Zrange): Zrange.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
    static serializeBinaryToWriter(message: Zrange, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Zrange;
    static deserializeBinaryFromReader(message: Zrange, reader: jspb.BinaryReader): Zrange;
  }

  export namespace Zrange {
    export type AsObject = {
      key: string;
      start: number;
      stop: number;
    };
  }

  export class Zrank extends jspb.Message {
    getKey(): string;
    setKey(value: string): Zrank;
    getMember(): string;
    setMember(value: string): Zrank;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Zrank.AsObject;
    static toObject(includeInstance: boolean, msg: Zrank): Zrank.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
    static serializeBinaryToWriter(message: Zrank, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Zrank;
    static deserializeBinaryFromReader(message: Zrank, reader: jspb.BinaryReader): Zrank;
  }

  export namespace Zrank {
    export type AsObject = {
      key: string;
      member: string;
    };
  }

  export class Zrem extends jspb.Message {
    getKey(): string;
    setKey(value: string): Zrem;
    getMember(): string;
    setMember(value: string): Zrem;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Zrem.AsObject;
    static toObject(includeInstance: boolean, msg: Zrem): Zrem.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
    static serializeBinaryToWriter(message: Zrem, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Zrem;
    static deserializeBinaryFromReader(message: Zrem, reader: jspb.BinaryReader): Zrem;
  }

  export namespace Zrem {
    export type AsObject = {
      key: string;
      member: string;
    };
  }

  export class Zscore extends jspb.Message {
    getKey(): string;
    setKey(value: string): Zscore;
    getMember(): string;
    setMember(value: string): Zscore;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Zscore.AsObject;
    static toObject(includeInstance: boolean, msg: Zscore): Zscore.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
    static serializeBinaryToWriter(message: Zscore, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Zscore;
    static deserializeBinaryFromReader(message: Zscore, reader: jspb.BinaryReader): Zscore;
  }

  export namespace Zscore {
    export type AsObject = {
      key: string;
      member: string;
    };
  }

  export class Expire extends jspb.Message {
    getKey(): string;
    setKey(value: string): Expire;
    getSeconds(): number;
    setSeconds(value: number): Expire;

    hasOption(): boolean;
    clearOption(): void;
    getOption(): Plugin.Expire.Option | undefined;
    setOption(value: Plugin.Expire.Option): Expire;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Expire.AsObject;
    static toObject(includeInstance: boolean, msg: Expire): Expire.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
    static serializeBinaryToWriter(message: Expire, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Expire;
    static deserializeBinaryFromReader(message: Expire, reader: jspb.BinaryReader): Expire;
  }

  export namespace Expire {
    export type AsObject = {
      key: string;
      seconds: number;
      option?: Plugin.Expire.Option;
    };

    export enum Option {
      OPTION_UNSPECIFIED = 0,
      OPTION_NX = 1,
      OPTION_XX = 2,
      OPTION_GT = 3,
      OPTION_LT = 4
    }
  }

  export class Ttl extends jspb.Message {
    getKey(): string;
    setKey(value: string): Ttl;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Ttl.AsObject;
    static toObject(includeInstance: boolean, msg: Ttl): Ttl.AsObject;
    static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
    static extensionsBinary: { [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message> };
    static serializeBinaryToWriter(message: Ttl, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Ttl;
    static deserializeBinaryFromReader(message: Ttl, reader: jspb.BinaryReader): Ttl;
  }

  export namespace Ttl {
    export type AsObject = {
      key: string;
    };
  }

  export enum CommandTypeCase {
    COMMAND_TYPE_NOT_SET = 0,
    RAW = 3,
    STRUCTURED = 4
  }
}
