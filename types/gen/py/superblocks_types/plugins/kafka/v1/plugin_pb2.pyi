from buf.validate import validate_pb2 as _validate_pb2
from google.protobuf import struct_pb2 as _struct_pb2
from plugins.common.v1 import plugin_pb2 as _plugin_pb2
from validate import validate_pb2 as _validate_pb2_1
from google.protobuf.internal import containers as _containers
from google.protobuf.internal import enum_type_wrapper as _enum_type_wrapper
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class Operation(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    OPERATION_UNSPECIFIED: _ClassVar[Operation]
    OPERATION_CONSUME: _ClassVar[Operation]
    OPERATION_PRODUCE: _ClassVar[Operation]

class Compression(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    COMPRESSION_UNSPECIFIED: _ClassVar[Compression]
    COMPRESSION_GZIP: _ClassVar[Compression]
    COMPRESSION_SNAPPY: _ClassVar[Compression]
    COMPRESSION_LZ4: _ClassVar[Compression]
    COMPRESSION_ZSTD: _ClassVar[Compression]

class Acks(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    ACKS_UNSPECIFIED: _ClassVar[Acks]
    ACKS_NONE: _ClassVar[Acks]
    ACKS_LEADER: _ClassVar[Acks]
    ACKS_ALL: _ClassVar[Acks]
OPERATION_UNSPECIFIED: Operation
OPERATION_CONSUME: Operation
OPERATION_PRODUCE: Operation
COMPRESSION_UNSPECIFIED: Compression
COMPRESSION_GZIP: Compression
COMPRESSION_SNAPPY: Compression
COMPRESSION_LZ4: Compression
COMPRESSION_ZSTD: Compression
ACKS_UNSPECIFIED: Acks
ACKS_NONE: Acks
ACKS_LEADER: Acks
ACKS_ALL: Acks

class Metadata(_message.Message):
    __slots__ = ("topics", "brokers")
    class Minified(_message.Message):
        __slots__ = ("topics",)
        TOPICS_FIELD_NUMBER: _ClassVar[int]
        topics: _containers.RepeatedScalarFieldContainer[str]
        def __init__(self, topics: _Optional[_Iterable[str]] = ...) -> None: ...
    TOPICS_FIELD_NUMBER: _ClassVar[int]
    BROKERS_FIELD_NUMBER: _ClassVar[int]
    topics: _containers.RepeatedCompositeFieldContainer[Topic]
    brokers: _containers.RepeatedCompositeFieldContainer[Broker]
    def __init__(self, topics: _Optional[_Iterable[_Union[Topic, _Mapping]]] = ..., brokers: _Optional[_Iterable[_Union[Broker, _Mapping]]] = ...) -> None: ...

class Broker(_message.Message):
    __slots__ = ("node_id", "address")
    NODE_ID_FIELD_NUMBER: _ClassVar[int]
    ADDRESS_FIELD_NUMBER: _ClassVar[int]
    node_id: int
    address: str
    def __init__(self, node_id: _Optional[int] = ..., address: _Optional[str] = ...) -> None: ...

class Topic(_message.Message):
    __slots__ = ("name",)
    NAME_FIELD_NUMBER: _ClassVar[int]
    name: str
    def __init__(self, name: _Optional[str] = ...) -> None: ...

class Messages(_message.Message):
    __slots__ = ("messages",)
    MESSAGES_FIELD_NUMBER: _ClassVar[int]
    messages: _containers.RepeatedCompositeFieldContainer[Message]
    def __init__(self, messages: _Optional[_Iterable[_Union[Message, _Mapping]]] = ...) -> None: ...

class Message(_message.Message):
    __slots__ = ("topic", "partition", "offset", "timestamp", "key", "value", "length", "attributes", "headers")
    class HeadersEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: str
        def __init__(self, key: _Optional[str] = ..., value: _Optional[str] = ...) -> None: ...
    TOPIC_FIELD_NUMBER: _ClassVar[int]
    PARTITION_FIELD_NUMBER: _ClassVar[int]
    OFFSET_FIELD_NUMBER: _ClassVar[int]
    TIMESTAMP_FIELD_NUMBER: _ClassVar[int]
    KEY_FIELD_NUMBER: _ClassVar[int]
    VALUE_FIELD_NUMBER: _ClassVar[int]
    LENGTH_FIELD_NUMBER: _ClassVar[int]
    ATTRIBUTES_FIELD_NUMBER: _ClassVar[int]
    HEADERS_FIELD_NUMBER: _ClassVar[int]
    topic: str
    partition: int
    offset: int
    timestamp: str
    key: _struct_pb2.Value
    value: _struct_pb2.Value
    length: int
    attributes: int
    headers: _containers.ScalarMap[str, str]
    def __init__(self, topic: _Optional[str] = ..., partition: _Optional[int] = ..., offset: _Optional[int] = ..., timestamp: _Optional[str] = ..., key: _Optional[_Union[_struct_pb2.Value, _Mapping]] = ..., value: _Optional[_Union[_struct_pb2.Value, _Mapping]] = ..., length: _Optional[int] = ..., attributes: _Optional[int] = ..., headers: _Optional[_Mapping[str, str]] = ...) -> None: ...

class SASL(_message.Message):
    __slots__ = ("mechanism", "username", "password", "access_key_id", "secret_key", "session_token", "authorization_identity")
    class Mechanism(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
        __slots__ = ()
        MECHANISM_UNSPECIFIED: _ClassVar[SASL.Mechanism]
        MECHANISM_PLAIN: _ClassVar[SASL.Mechanism]
        MECHANISM_SCRAM_SHA256: _ClassVar[SASL.Mechanism]
        MECHANISM_SCRAM_SHA512: _ClassVar[SASL.Mechanism]
        MECHANISM_AWS: _ClassVar[SASL.Mechanism]
    MECHANISM_UNSPECIFIED: SASL.Mechanism
    MECHANISM_PLAIN: SASL.Mechanism
    MECHANISM_SCRAM_SHA256: SASL.Mechanism
    MECHANISM_SCRAM_SHA512: SASL.Mechanism
    MECHANISM_AWS: SASL.Mechanism
    MECHANISM_FIELD_NUMBER: _ClassVar[int]
    USERNAME_FIELD_NUMBER: _ClassVar[int]
    PASSWORD_FIELD_NUMBER: _ClassVar[int]
    ACCESS_KEY_ID_FIELD_NUMBER: _ClassVar[int]
    SECRET_KEY_FIELD_NUMBER: _ClassVar[int]
    SESSION_TOKEN_FIELD_NUMBER: _ClassVar[int]
    AUTHORIZATION_IDENTITY_FIELD_NUMBER: _ClassVar[int]
    mechanism: SASL.Mechanism
    username: str
    password: str
    access_key_id: str
    secret_key: str
    session_token: str
    authorization_identity: str
    def __init__(self, mechanism: _Optional[_Union[SASL.Mechanism, str]] = ..., username: _Optional[str] = ..., password: _Optional[str] = ..., access_key_id: _Optional[str] = ..., secret_key: _Optional[str] = ..., session_token: _Optional[str] = ..., authorization_identity: _Optional[str] = ...) -> None: ...

class Cluster(_message.Message):
    __slots__ = ("brokers", "ssl", "sasl")
    BROKERS_FIELD_NUMBER: _ClassVar[int]
    SSL_FIELD_NUMBER: _ClassVar[int]
    SASL_FIELD_NUMBER: _ClassVar[int]
    brokers: str
    ssl: bool
    sasl: SASL
    def __init__(self, brokers: _Optional[str] = ..., ssl: bool = ..., sasl: _Optional[_Union[SASL, _Mapping]] = ...) -> None: ...

class Plugin(_message.Message):
    __slots__ = ("name", "operation", "produce", "consume", "cluster", "superblocksMetadata", "dynamic_workflow_configuration")
    class Consume(_message.Message):
        __slots__ = ("topic", "group_id", "client_id", "seek", "read_uncommitted")
        class From(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
            __slots__ = ()
            FROM_UNSPECIFIED: _ClassVar[Plugin.Consume.From]
            FROM_BEGINNING: _ClassVar[Plugin.Consume.From]
            FROM_LATEST: _ClassVar[Plugin.Consume.From]
            FROM_SEEK: _ClassVar[Plugin.Consume.From]
        FROM_UNSPECIFIED: Plugin.Consume.From
        FROM_BEGINNING: Plugin.Consume.From
        FROM_LATEST: Plugin.Consume.From
        FROM_SEEK: Plugin.Consume.From
        class Seek(_message.Message):
            __slots__ = ("topic", "offset", "partition")
            TOPIC_FIELD_NUMBER: _ClassVar[int]
            OFFSET_FIELD_NUMBER: _ClassVar[int]
            PARTITION_FIELD_NUMBER: _ClassVar[int]
            topic: str
            offset: int
            partition: int
            def __init__(self, topic: _Optional[str] = ..., offset: _Optional[int] = ..., partition: _Optional[int] = ...) -> None: ...
        FROM_FIELD_NUMBER: _ClassVar[int]
        TOPIC_FIELD_NUMBER: _ClassVar[int]
        GROUP_ID_FIELD_NUMBER: _ClassVar[int]
        CLIENT_ID_FIELD_NUMBER: _ClassVar[int]
        SEEK_FIELD_NUMBER: _ClassVar[int]
        READ_UNCOMMITTED_FIELD_NUMBER: _ClassVar[int]
        topic: str
        group_id: str
        client_id: str
        seek: Plugin.Consume.Seek
        read_uncommitted: bool
        def __init__(self, topic: _Optional[str] = ..., group_id: _Optional[str] = ..., client_id: _Optional[str] = ..., seek: _Optional[_Union[Plugin.Consume.Seek, _Mapping]] = ..., read_uncommitted: bool = ..., **kwargs) -> None: ...
    class Produce(_message.Message):
        __slots__ = ("acks", "client_id", "timeout", "compression", "transaction_id", "auto_create_topic", "idempotent", "transaction", "messages")
        ACKS_FIELD_NUMBER: _ClassVar[int]
        CLIENT_ID_FIELD_NUMBER: _ClassVar[int]
        TIMEOUT_FIELD_NUMBER: _ClassVar[int]
        COMPRESSION_FIELD_NUMBER: _ClassVar[int]
        TRANSACTION_ID_FIELD_NUMBER: _ClassVar[int]
        AUTO_CREATE_TOPIC_FIELD_NUMBER: _ClassVar[int]
        IDEMPOTENT_FIELD_NUMBER: _ClassVar[int]
        TRANSACTION_FIELD_NUMBER: _ClassVar[int]
        MESSAGES_FIELD_NUMBER: _ClassVar[int]
        acks: Acks
        client_id: str
        timeout: int
        compression: Compression
        transaction_id: str
        auto_create_topic: bool
        idempotent: bool
        transaction: bool
        messages: str
        def __init__(self, acks: _Optional[_Union[Acks, str]] = ..., client_id: _Optional[str] = ..., timeout: _Optional[int] = ..., compression: _Optional[_Union[Compression, str]] = ..., transaction_id: _Optional[str] = ..., auto_create_topic: bool = ..., idempotent: bool = ..., transaction: bool = ..., messages: _Optional[str] = ...) -> None: ...
    NAME_FIELD_NUMBER: _ClassVar[int]
    OPERATION_FIELD_NUMBER: _ClassVar[int]
    PRODUCE_FIELD_NUMBER: _ClassVar[int]
    CONSUME_FIELD_NUMBER: _ClassVar[int]
    CLUSTER_FIELD_NUMBER: _ClassVar[int]
    SUPERBLOCKSMETADATA_FIELD_NUMBER: _ClassVar[int]
    DYNAMIC_WORKFLOW_CONFIGURATION_FIELD_NUMBER: _ClassVar[int]
    name: str
    operation: Operation
    produce: Plugin.Produce
    consume: Plugin.Consume
    cluster: Cluster
    superblocksMetadata: SuperblocksMetadata
    dynamic_workflow_configuration: _plugin_pb2.DynamicWorkflowConfiguration
    def __init__(self, name: _Optional[str] = ..., operation: _Optional[_Union[Operation, str]] = ..., produce: _Optional[_Union[Plugin.Produce, _Mapping]] = ..., consume: _Optional[_Union[Plugin.Consume, _Mapping]] = ..., cluster: _Optional[_Union[Cluster, _Mapping]] = ..., superblocksMetadata: _Optional[_Union[SuperblocksMetadata, _Mapping]] = ..., dynamic_workflow_configuration: _Optional[_Union[_plugin_pb2.DynamicWorkflowConfiguration, _Mapping]] = ...) -> None: ...

class SuperblocksMetadata(_message.Message):
    __slots__ = ("plugin_version", "synced_from_profile_id")
    PLUGIN_VERSION_FIELD_NUMBER: _ClassVar[int]
    SYNCED_FROM_PROFILE_ID_FIELD_NUMBER: _ClassVar[int]
    plugin_version: str
    synced_from_profile_id: str
    def __init__(self, plugin_version: _Optional[str] = ..., synced_from_profile_id: _Optional[str] = ...) -> None: ...
