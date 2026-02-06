from plugins.common.v1 import plugin_pb2 as _plugin_pb2
from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class Plugin(_message.Message):
    __slots__ = ("name", "connection", "dynamic_workflow_configuration", "tunnel", "bucket_name", "run_sql", "insert", "get", "remove")
    class CouchbaseIdentifier(_message.Message):
        __slots__ = ("scope", "collection")
        SCOPE_FIELD_NUMBER: _ClassVar[int]
        COLLECTION_FIELD_NUMBER: _ClassVar[int]
        scope: str
        collection: str
        def __init__(self, scope: _Optional[str] = ..., collection: _Optional[str] = ...) -> None: ...
    class CouchbaseConnection(_message.Message):
        __slots__ = ("user", "password", "url")
        USER_FIELD_NUMBER: _ClassVar[int]
        PASSWORD_FIELD_NUMBER: _ClassVar[int]
        URL_FIELD_NUMBER: _ClassVar[int]
        user: str
        password: str
        url: str
        def __init__(self, user: _Optional[str] = ..., password: _Optional[str] = ..., url: _Optional[str] = ...) -> None: ...
    class CouchbaseInsert(_message.Message):
        __slots__ = ("key", "value", "identifier")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        IDENTIFIER_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: str
        identifier: Plugin.CouchbaseIdentifier
        def __init__(self, key: _Optional[str] = ..., value: _Optional[str] = ..., identifier: _Optional[_Union[Plugin.CouchbaseIdentifier, _Mapping]] = ...) -> None: ...
    class CouchbaseGet(_message.Message):
        __slots__ = ("key", "identifier")
        KEY_FIELD_NUMBER: _ClassVar[int]
        IDENTIFIER_FIELD_NUMBER: _ClassVar[int]
        key: str
        identifier: Plugin.CouchbaseIdentifier
        def __init__(self, key: _Optional[str] = ..., identifier: _Optional[_Union[Plugin.CouchbaseIdentifier, _Mapping]] = ...) -> None: ...
    class CouchbaseRemove(_message.Message):
        __slots__ = ("key", "identifier")
        KEY_FIELD_NUMBER: _ClassVar[int]
        IDENTIFIER_FIELD_NUMBER: _ClassVar[int]
        key: str
        identifier: Plugin.CouchbaseIdentifier
        def __init__(self, key: _Optional[str] = ..., identifier: _Optional[_Union[Plugin.CouchbaseIdentifier, _Mapping]] = ...) -> None: ...
    NAME_FIELD_NUMBER: _ClassVar[int]
    CONNECTION_FIELD_NUMBER: _ClassVar[int]
    DYNAMIC_WORKFLOW_CONFIGURATION_FIELD_NUMBER: _ClassVar[int]
    TUNNEL_FIELD_NUMBER: _ClassVar[int]
    BUCKET_NAME_FIELD_NUMBER: _ClassVar[int]
    RUN_SQL_FIELD_NUMBER: _ClassVar[int]
    INSERT_FIELD_NUMBER: _ClassVar[int]
    GET_FIELD_NUMBER: _ClassVar[int]
    REMOVE_FIELD_NUMBER: _ClassVar[int]
    name: str
    connection: Plugin.CouchbaseConnection
    dynamic_workflow_configuration: _plugin_pb2.DynamicWorkflowConfiguration
    tunnel: _plugin_pb2.SSHConfiguration
    bucket_name: str
    run_sql: _plugin_pb2.SQLExecution
    insert: Plugin.CouchbaseInsert
    get: Plugin.CouchbaseGet
    remove: Plugin.CouchbaseRemove
    def __init__(self, name: _Optional[str] = ..., connection: _Optional[_Union[Plugin.CouchbaseConnection, _Mapping]] = ..., dynamic_workflow_configuration: _Optional[_Union[_plugin_pb2.DynamicWorkflowConfiguration, _Mapping]] = ..., tunnel: _Optional[_Union[_plugin_pb2.SSHConfiguration, _Mapping]] = ..., bucket_name: _Optional[str] = ..., run_sql: _Optional[_Union[_plugin_pb2.SQLExecution, _Mapping]] = ..., insert: _Optional[_Union[Plugin.CouchbaseInsert, _Mapping]] = ..., get: _Optional[_Union[Plugin.CouchbaseGet, _Mapping]] = ..., remove: _Optional[_Union[Plugin.CouchbaseRemove, _Mapping]] = ...) -> None: ...

class Metadata(_message.Message):
    __slots__ = ("buckets",)
    class Collection(_message.Message):
        __slots__ = ("name",)
        NAME_FIELD_NUMBER: _ClassVar[int]
        name: str
        def __init__(self, name: _Optional[str] = ...) -> None: ...
    class Scope(_message.Message):
        __slots__ = ("name", "collections")
        NAME_FIELD_NUMBER: _ClassVar[int]
        COLLECTIONS_FIELD_NUMBER: _ClassVar[int]
        name: str
        collections: _containers.RepeatedCompositeFieldContainer[Metadata.Collection]
        def __init__(self, name: _Optional[str] = ..., collections: _Optional[_Iterable[_Union[Metadata.Collection, _Mapping]]] = ...) -> None: ...
    class Bucket(_message.Message):
        __slots__ = ("name", "scopes")
        NAME_FIELD_NUMBER: _ClassVar[int]
        SCOPES_FIELD_NUMBER: _ClassVar[int]
        name: str
        scopes: _containers.RepeatedCompositeFieldContainer[Metadata.Scope]
        def __init__(self, name: _Optional[str] = ..., scopes: _Optional[_Iterable[_Union[Metadata.Scope, _Mapping]]] = ...) -> None: ...
    BUCKETS_FIELD_NUMBER: _ClassVar[int]
    buckets: _containers.RepeatedCompositeFieldContainer[Metadata.Bucket]
    def __init__(self, buckets: _Optional[_Iterable[_Union[Metadata.Bucket, _Mapping]]] = ...) -> None: ...
