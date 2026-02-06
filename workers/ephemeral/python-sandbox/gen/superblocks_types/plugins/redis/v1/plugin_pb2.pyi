from plugins.common.v1 import plugin_pb2 as _plugin_pb2
from google.protobuf.internal import enum_type_wrapper as _enum_type_wrapper
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class Plugin(_message.Message):
    __slots__ = ("name", "connection", "raw", "structured", "dynamic_workflow_configuration")
    class Raw(_message.Message):
        __slots__ = ("singleton",)
        class Singleton(_message.Message):
            __slots__ = ("query",)
            QUERY_FIELD_NUMBER: _ClassVar[int]
            query: str
            def __init__(self, query: _Optional[str] = ...) -> None: ...
        SINGLETON_FIELD_NUMBER: _ClassVar[int]
        singleton: Plugin.Raw.Singleton
        def __init__(self, singleton: _Optional[_Union[Plugin.Raw.Singleton, _Mapping]] = ...) -> None: ...
    class Structured(_message.Message):
        __slots__ = ("get", "set", "keys", "mget", "hget", "hmget", "hgetall", "hset", "hsetnx", "hlen", "hdel", "hkeys", "hvals", "lindex", "llen", "lpush", "lrem", "lrange", "sadd", "scard", "smembers", "sismember", "srandmember", "srem", "zadd", "zcard", "zcount", "zrange", "zrank", "zrem", "zscore", "expire", "ttl")
        GET_FIELD_NUMBER: _ClassVar[int]
        SET_FIELD_NUMBER: _ClassVar[int]
        DEL_FIELD_NUMBER: _ClassVar[int]
        KEYS_FIELD_NUMBER: _ClassVar[int]
        MGET_FIELD_NUMBER: _ClassVar[int]
        HGET_FIELD_NUMBER: _ClassVar[int]
        HMGET_FIELD_NUMBER: _ClassVar[int]
        HGETALL_FIELD_NUMBER: _ClassVar[int]
        HSET_FIELD_NUMBER: _ClassVar[int]
        HSETNX_FIELD_NUMBER: _ClassVar[int]
        HLEN_FIELD_NUMBER: _ClassVar[int]
        HDEL_FIELD_NUMBER: _ClassVar[int]
        HKEYS_FIELD_NUMBER: _ClassVar[int]
        HVALS_FIELD_NUMBER: _ClassVar[int]
        LINDEX_FIELD_NUMBER: _ClassVar[int]
        LLEN_FIELD_NUMBER: _ClassVar[int]
        LPUSH_FIELD_NUMBER: _ClassVar[int]
        LREM_FIELD_NUMBER: _ClassVar[int]
        LRANGE_FIELD_NUMBER: _ClassVar[int]
        SADD_FIELD_NUMBER: _ClassVar[int]
        SCARD_FIELD_NUMBER: _ClassVar[int]
        SMEMBERS_FIELD_NUMBER: _ClassVar[int]
        SISMEMBER_FIELD_NUMBER: _ClassVar[int]
        SRANDMEMBER_FIELD_NUMBER: _ClassVar[int]
        SREM_FIELD_NUMBER: _ClassVar[int]
        ZADD_FIELD_NUMBER: _ClassVar[int]
        ZCARD_FIELD_NUMBER: _ClassVar[int]
        ZCOUNT_FIELD_NUMBER: _ClassVar[int]
        ZRANGE_FIELD_NUMBER: _ClassVar[int]
        ZRANK_FIELD_NUMBER: _ClassVar[int]
        ZREM_FIELD_NUMBER: _ClassVar[int]
        ZSCORE_FIELD_NUMBER: _ClassVar[int]
        EXPIRE_FIELD_NUMBER: _ClassVar[int]
        TTL_FIELD_NUMBER: _ClassVar[int]
        get: Plugin.Get
        set: Plugin.Set
        keys: Plugin.Keys
        mget: Plugin.Mget
        hget: Plugin.Hget
        hmget: Plugin.Hmget
        hgetall: Plugin.Hgetall
        hset: Plugin.Hset
        hsetnx: Plugin.Hsetnx
        hlen: Plugin.Hlen
        hdel: Plugin.Hdel
        hkeys: Plugin.Hkeys
        hvals: Plugin.Hvals
        lindex: Plugin.Lindex
        llen: Plugin.Llen
        lpush: Plugin.Lpush
        lrem: Plugin.Lrem
        lrange: Plugin.Lrange
        sadd: Plugin.Sadd
        scard: Plugin.Scard
        smembers: Plugin.Smembers
        sismember: Plugin.Sismember
        srandmember: Plugin.Srandmember
        srem: Plugin.Srem
        zadd: Plugin.Zadd
        zcard: Plugin.Zcard
        zcount: Plugin.Zcount
        zrange: Plugin.Zrange
        zrank: Plugin.Zrank
        zrem: Plugin.Zrem
        zscore: Plugin.Zscore
        expire: Plugin.Expire
        ttl: Plugin.Ttl
        def __init__(self, get: _Optional[_Union[Plugin.Get, _Mapping]] = ..., set: _Optional[_Union[Plugin.Set, _Mapping]] = ..., keys: _Optional[_Union[Plugin.Keys, _Mapping]] = ..., mget: _Optional[_Union[Plugin.Mget, _Mapping]] = ..., hget: _Optional[_Union[Plugin.Hget, _Mapping]] = ..., hmget: _Optional[_Union[Plugin.Hmget, _Mapping]] = ..., hgetall: _Optional[_Union[Plugin.Hgetall, _Mapping]] = ..., hset: _Optional[_Union[Plugin.Hset, _Mapping]] = ..., hsetnx: _Optional[_Union[Plugin.Hsetnx, _Mapping]] = ..., hlen: _Optional[_Union[Plugin.Hlen, _Mapping]] = ..., hdel: _Optional[_Union[Plugin.Hdel, _Mapping]] = ..., hkeys: _Optional[_Union[Plugin.Hkeys, _Mapping]] = ..., hvals: _Optional[_Union[Plugin.Hvals, _Mapping]] = ..., lindex: _Optional[_Union[Plugin.Lindex, _Mapping]] = ..., llen: _Optional[_Union[Plugin.Llen, _Mapping]] = ..., lpush: _Optional[_Union[Plugin.Lpush, _Mapping]] = ..., lrem: _Optional[_Union[Plugin.Lrem, _Mapping]] = ..., lrange: _Optional[_Union[Plugin.Lrange, _Mapping]] = ..., sadd: _Optional[_Union[Plugin.Sadd, _Mapping]] = ..., scard: _Optional[_Union[Plugin.Scard, _Mapping]] = ..., smembers: _Optional[_Union[Plugin.Smembers, _Mapping]] = ..., sismember: _Optional[_Union[Plugin.Sismember, _Mapping]] = ..., srandmember: _Optional[_Union[Plugin.Srandmember, _Mapping]] = ..., srem: _Optional[_Union[Plugin.Srem, _Mapping]] = ..., zadd: _Optional[_Union[Plugin.Zadd, _Mapping]] = ..., zcard: _Optional[_Union[Plugin.Zcard, _Mapping]] = ..., zcount: _Optional[_Union[Plugin.Zcount, _Mapping]] = ..., zrange: _Optional[_Union[Plugin.Zrange, _Mapping]] = ..., zrank: _Optional[_Union[Plugin.Zrank, _Mapping]] = ..., zrem: _Optional[_Union[Plugin.Zrem, _Mapping]] = ..., zscore: _Optional[_Union[Plugin.Zscore, _Mapping]] = ..., expire: _Optional[_Union[Plugin.Expire, _Mapping]] = ..., ttl: _Optional[_Union[Plugin.Ttl, _Mapping]] = ..., **kwargs) -> None: ...
    class Connection(_message.Message):
        __slots__ = ("url", "fields")
        class Url(_message.Message):
            __slots__ = ("url_string",)
            URL_STRING_FIELD_NUMBER: _ClassVar[int]
            url_string: str
            def __init__(self, url_string: _Optional[str] = ...) -> None: ...
        class Fields(_message.Message):
            __slots__ = ("host", "port", "database_number", "username", "password", "enable_ssl")
            HOST_FIELD_NUMBER: _ClassVar[int]
            PORT_FIELD_NUMBER: _ClassVar[int]
            DATABASE_NUMBER_FIELD_NUMBER: _ClassVar[int]
            USERNAME_FIELD_NUMBER: _ClassVar[int]
            PASSWORD_FIELD_NUMBER: _ClassVar[int]
            ENABLE_SSL_FIELD_NUMBER: _ClassVar[int]
            host: str
            port: int
            database_number: int
            username: str
            password: str
            enable_ssl: bool
            def __init__(self, host: _Optional[str] = ..., port: _Optional[int] = ..., database_number: _Optional[int] = ..., username: _Optional[str] = ..., password: _Optional[str] = ..., enable_ssl: bool = ...) -> None: ...
        URL_FIELD_NUMBER: _ClassVar[int]
        FIELDS_FIELD_NUMBER: _ClassVar[int]
        url: Plugin.Connection.Url
        fields: Plugin.Connection.Fields
        def __init__(self, url: _Optional[_Union[Plugin.Connection.Url, _Mapping]] = ..., fields: _Optional[_Union[Plugin.Connection.Fields, _Mapping]] = ...) -> None: ...
    class Get(_message.Message):
        __slots__ = ("key",)
        KEY_FIELD_NUMBER: _ClassVar[int]
        key: str
        def __init__(self, key: _Optional[str] = ...) -> None: ...
    class Set(_message.Message):
        __slots__ = ("key", "value", "expiration_ms")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        EXPIRATION_MS_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: str
        expiration_ms: int
        def __init__(self, key: _Optional[str] = ..., value: _Optional[str] = ..., expiration_ms: _Optional[int] = ...) -> None: ...
    class Del(_message.Message):
        __slots__ = ("key",)
        KEY_FIELD_NUMBER: _ClassVar[int]
        key: str
        def __init__(self, key: _Optional[str] = ...) -> None: ...
    class Keys(_message.Message):
        __slots__ = ("pattern",)
        PATTERN_FIELD_NUMBER: _ClassVar[int]
        pattern: str
        def __init__(self, pattern: _Optional[str] = ...) -> None: ...
    class Mget(_message.Message):
        __slots__ = ("keys",)
        KEYS_FIELD_NUMBER: _ClassVar[int]
        keys: str
        def __init__(self, keys: _Optional[str] = ...) -> None: ...
    class Hget(_message.Message):
        __slots__ = ("key", "field")
        KEY_FIELD_NUMBER: _ClassVar[int]
        FIELD_FIELD_NUMBER: _ClassVar[int]
        key: str
        field: str
        def __init__(self, key: _Optional[str] = ..., field: _Optional[str] = ...) -> None: ...
    class Hmget(_message.Message):
        __slots__ = ("key", "fields")
        KEY_FIELD_NUMBER: _ClassVar[int]
        FIELDS_FIELD_NUMBER: _ClassVar[int]
        key: str
        fields: str
        def __init__(self, key: _Optional[str] = ..., fields: _Optional[str] = ...) -> None: ...
    class Hgetall(_message.Message):
        __slots__ = ("key",)
        KEY_FIELD_NUMBER: _ClassVar[int]
        key: str
        def __init__(self, key: _Optional[str] = ...) -> None: ...
    class Hset(_message.Message):
        __slots__ = ("key", "field", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        FIELD_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        field: str
        value: str
        def __init__(self, key: _Optional[str] = ..., field: _Optional[str] = ..., value: _Optional[str] = ...) -> None: ...
    class Hsetnx(_message.Message):
        __slots__ = ("key", "field", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        FIELD_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        field: str
        value: str
        def __init__(self, key: _Optional[str] = ..., field: _Optional[str] = ..., value: _Optional[str] = ...) -> None: ...
    class Hlen(_message.Message):
        __slots__ = ("key",)
        KEY_FIELD_NUMBER: _ClassVar[int]
        key: str
        def __init__(self, key: _Optional[str] = ...) -> None: ...
    class Hdel(_message.Message):
        __slots__ = ("key", "field")
        KEY_FIELD_NUMBER: _ClassVar[int]
        FIELD_FIELD_NUMBER: _ClassVar[int]
        key: str
        field: str
        def __init__(self, key: _Optional[str] = ..., field: _Optional[str] = ...) -> None: ...
    class Hkeys(_message.Message):
        __slots__ = ("key",)
        KEY_FIELD_NUMBER: _ClassVar[int]
        key: str
        def __init__(self, key: _Optional[str] = ...) -> None: ...
    class Hvals(_message.Message):
        __slots__ = ("key",)
        KEY_FIELD_NUMBER: _ClassVar[int]
        key: str
        def __init__(self, key: _Optional[str] = ...) -> None: ...
    class Lindex(_message.Message):
        __slots__ = ("key", "index")
        KEY_FIELD_NUMBER: _ClassVar[int]
        INDEX_FIELD_NUMBER: _ClassVar[int]
        key: str
        index: int
        def __init__(self, key: _Optional[str] = ..., index: _Optional[int] = ...) -> None: ...
    class Llen(_message.Message):
        __slots__ = ("key",)
        KEY_FIELD_NUMBER: _ClassVar[int]
        key: str
        def __init__(self, key: _Optional[str] = ...) -> None: ...
    class Lpush(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: str
        def __init__(self, key: _Optional[str] = ..., value: _Optional[str] = ...) -> None: ...
    class Lrem(_message.Message):
        __slots__ = ("key", "count", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        COUNT_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        count: int
        value: str
        def __init__(self, key: _Optional[str] = ..., count: _Optional[int] = ..., value: _Optional[str] = ...) -> None: ...
    class Lrange(_message.Message):
        __slots__ = ("key", "start", "stop")
        KEY_FIELD_NUMBER: _ClassVar[int]
        START_FIELD_NUMBER: _ClassVar[int]
        STOP_FIELD_NUMBER: _ClassVar[int]
        key: str
        start: int
        stop: int
        def __init__(self, key: _Optional[str] = ..., start: _Optional[int] = ..., stop: _Optional[int] = ...) -> None: ...
    class Sadd(_message.Message):
        __slots__ = ("key", "member")
        KEY_FIELD_NUMBER: _ClassVar[int]
        MEMBER_FIELD_NUMBER: _ClassVar[int]
        key: str
        member: str
        def __init__(self, key: _Optional[str] = ..., member: _Optional[str] = ...) -> None: ...
    class Scard(_message.Message):
        __slots__ = ("key",)
        KEY_FIELD_NUMBER: _ClassVar[int]
        key: str
        def __init__(self, key: _Optional[str] = ...) -> None: ...
    class Smembers(_message.Message):
        __slots__ = ("key",)
        KEY_FIELD_NUMBER: _ClassVar[int]
        key: str
        def __init__(self, key: _Optional[str] = ...) -> None: ...
    class Sismember(_message.Message):
        __slots__ = ("key", "member")
        KEY_FIELD_NUMBER: _ClassVar[int]
        MEMBER_FIELD_NUMBER: _ClassVar[int]
        key: str
        member: str
        def __init__(self, key: _Optional[str] = ..., member: _Optional[str] = ...) -> None: ...
    class Srandmember(_message.Message):
        __slots__ = ("key", "count")
        KEY_FIELD_NUMBER: _ClassVar[int]
        COUNT_FIELD_NUMBER: _ClassVar[int]
        key: str
        count: int
        def __init__(self, key: _Optional[str] = ..., count: _Optional[int] = ...) -> None: ...
    class Srem(_message.Message):
        __slots__ = ("key", "member")
        KEY_FIELD_NUMBER: _ClassVar[int]
        MEMBER_FIELD_NUMBER: _ClassVar[int]
        key: str
        member: str
        def __init__(self, key: _Optional[str] = ..., member: _Optional[str] = ...) -> None: ...
    class Zadd(_message.Message):
        __slots__ = ("key", "score", "member")
        KEY_FIELD_NUMBER: _ClassVar[int]
        SCORE_FIELD_NUMBER: _ClassVar[int]
        MEMBER_FIELD_NUMBER: _ClassVar[int]
        key: str
        score: float
        member: str
        def __init__(self, key: _Optional[str] = ..., score: _Optional[float] = ..., member: _Optional[str] = ...) -> None: ...
    class Zcard(_message.Message):
        __slots__ = ("key",)
        KEY_FIELD_NUMBER: _ClassVar[int]
        key: str
        def __init__(self, key: _Optional[str] = ...) -> None: ...
    class Zcount(_message.Message):
        __slots__ = ("key", "min", "max")
        KEY_FIELD_NUMBER: _ClassVar[int]
        MIN_FIELD_NUMBER: _ClassVar[int]
        MAX_FIELD_NUMBER: _ClassVar[int]
        key: str
        min: float
        max: float
        def __init__(self, key: _Optional[str] = ..., min: _Optional[float] = ..., max: _Optional[float] = ...) -> None: ...
    class Zrange(_message.Message):
        __slots__ = ("key", "start", "stop")
        KEY_FIELD_NUMBER: _ClassVar[int]
        START_FIELD_NUMBER: _ClassVar[int]
        STOP_FIELD_NUMBER: _ClassVar[int]
        key: str
        start: int
        stop: int
        def __init__(self, key: _Optional[str] = ..., start: _Optional[int] = ..., stop: _Optional[int] = ...) -> None: ...
    class Zrank(_message.Message):
        __slots__ = ("key", "member")
        KEY_FIELD_NUMBER: _ClassVar[int]
        MEMBER_FIELD_NUMBER: _ClassVar[int]
        key: str
        member: str
        def __init__(self, key: _Optional[str] = ..., member: _Optional[str] = ...) -> None: ...
    class Zrem(_message.Message):
        __slots__ = ("key", "member")
        KEY_FIELD_NUMBER: _ClassVar[int]
        MEMBER_FIELD_NUMBER: _ClassVar[int]
        key: str
        member: str
        def __init__(self, key: _Optional[str] = ..., member: _Optional[str] = ...) -> None: ...
    class Zscore(_message.Message):
        __slots__ = ("key", "member")
        KEY_FIELD_NUMBER: _ClassVar[int]
        MEMBER_FIELD_NUMBER: _ClassVar[int]
        key: str
        member: str
        def __init__(self, key: _Optional[str] = ..., member: _Optional[str] = ...) -> None: ...
    class Expire(_message.Message):
        __slots__ = ("key", "seconds", "option")
        class Option(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
            __slots__ = ()
            OPTION_UNSPECIFIED: _ClassVar[Plugin.Expire.Option]
            OPTION_NX: _ClassVar[Plugin.Expire.Option]
            OPTION_XX: _ClassVar[Plugin.Expire.Option]
            OPTION_GT: _ClassVar[Plugin.Expire.Option]
            OPTION_LT: _ClassVar[Plugin.Expire.Option]
        OPTION_UNSPECIFIED: Plugin.Expire.Option
        OPTION_NX: Plugin.Expire.Option
        OPTION_XX: Plugin.Expire.Option
        OPTION_GT: Plugin.Expire.Option
        OPTION_LT: Plugin.Expire.Option
        KEY_FIELD_NUMBER: _ClassVar[int]
        SECONDS_FIELD_NUMBER: _ClassVar[int]
        OPTION_FIELD_NUMBER: _ClassVar[int]
        key: str
        seconds: int
        option: Plugin.Expire.Option
        def __init__(self, key: _Optional[str] = ..., seconds: _Optional[int] = ..., option: _Optional[_Union[Plugin.Expire.Option, str]] = ...) -> None: ...
    class Ttl(_message.Message):
        __slots__ = ("key",)
        KEY_FIELD_NUMBER: _ClassVar[int]
        key: str
        def __init__(self, key: _Optional[str] = ...) -> None: ...
    NAME_FIELD_NUMBER: _ClassVar[int]
    CONNECTION_FIELD_NUMBER: _ClassVar[int]
    RAW_FIELD_NUMBER: _ClassVar[int]
    STRUCTURED_FIELD_NUMBER: _ClassVar[int]
    DYNAMIC_WORKFLOW_CONFIGURATION_FIELD_NUMBER: _ClassVar[int]
    name: str
    connection: Plugin.Connection
    raw: Plugin.Raw
    structured: Plugin.Structured
    dynamic_workflow_configuration: _plugin_pb2.DynamicWorkflowConfiguration
    def __init__(self, name: _Optional[str] = ..., connection: _Optional[_Union[Plugin.Connection, _Mapping]] = ..., raw: _Optional[_Union[Plugin.Raw, _Mapping]] = ..., structured: _Optional[_Union[Plugin.Structured, _Mapping]] = ..., dynamic_workflow_configuration: _Optional[_Union[_plugin_pb2.DynamicWorkflowConfiguration, _Mapping]] = ...) -> None: ...
