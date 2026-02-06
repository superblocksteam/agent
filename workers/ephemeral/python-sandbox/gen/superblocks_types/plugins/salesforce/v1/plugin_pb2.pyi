from plugins.common.v1 import auth_pb2 as _auth_pb2
from plugins.common.v1 import plugin_pb2 as _plugin_pb2
from google.protobuf.internal import containers as _containers
from google.protobuf.internal import enum_type_wrapper as _enum_type_wrapper
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class Plugin(_message.Message):
    __slots__ = ("name", "connection", "soql", "crud", "bulk", "dynamic_workflow_configuration")
    class SalesforceConnection(_message.Message):
        __slots__ = ("instance_url", "auth")
        INSTANCE_URL_FIELD_NUMBER: _ClassVar[int]
        AUTH_FIELD_NUMBER: _ClassVar[int]
        instance_url: str
        auth: _auth_pb2.Auth
        def __init__(self, instance_url: _Optional[str] = ..., auth: _Optional[_Union[_auth_pb2.Auth, _Mapping]] = ...) -> None: ...
    class Metadata(_message.Message):
        __slots__ = ("objects",)
        class Object(_message.Message):
            __slots__ = ("fields",)
            class Field(_message.Message):
                __slots__ = ("name", "label", "type")
                NAME_FIELD_NUMBER: _ClassVar[int]
                LABEL_FIELD_NUMBER: _ClassVar[int]
                TYPE_FIELD_NUMBER: _ClassVar[int]
                name: str
                label: str
                type: str
                def __init__(self, name: _Optional[str] = ..., label: _Optional[str] = ..., type: _Optional[str] = ...) -> None: ...
            FIELDS_FIELD_NUMBER: _ClassVar[int]
            fields: _containers.RepeatedCompositeFieldContainer[Plugin.Metadata.Object.Field]
            def __init__(self, fields: _Optional[_Iterable[_Union[Plugin.Metadata.Object.Field, _Mapping]]] = ...) -> None: ...
        OBJECTS_FIELD_NUMBER: _ClassVar[int]
        objects: _containers.RepeatedCompositeFieldContainer[Plugin.Metadata.Object]
        def __init__(self, objects: _Optional[_Iterable[_Union[Plugin.Metadata.Object, _Mapping]]] = ...) -> None: ...
    class Soql(_message.Message):
        __slots__ = ("sql_body", "action")
        class SoqlAction(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
            __slots__ = ()
            SOQL_ACTION_UNSPECIFIED: _ClassVar[Plugin.Soql.SoqlAction]
            SOQL_ACTION_SOQL: _ClassVar[Plugin.Soql.SoqlAction]
        SOQL_ACTION_UNSPECIFIED: Plugin.Soql.SoqlAction
        SOQL_ACTION_SOQL: Plugin.Soql.SoqlAction
        SQL_BODY_FIELD_NUMBER: _ClassVar[int]
        ACTION_FIELD_NUMBER: _ClassVar[int]
        sql_body: str
        action: Plugin.Soql.SoqlAction
        def __init__(self, sql_body: _Optional[str] = ..., action: _Optional[_Union[Plugin.Soql.SoqlAction, str]] = ...) -> None: ...
    class Crud(_message.Message):
        __slots__ = ("resource_type", "action", "resource_body", "resource_id")
        class CrudAction(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
            __slots__ = ()
            CRUD_ACTION_UNSPECIFIED: _ClassVar[Plugin.Crud.CrudAction]
            CRUD_ACTION_CREATE: _ClassVar[Plugin.Crud.CrudAction]
            CRUD_ACTION_UPDATE: _ClassVar[Plugin.Crud.CrudAction]
            CRUD_ACTION_DELETE: _ClassVar[Plugin.Crud.CrudAction]
            CRUD_ACTION_READ: _ClassVar[Plugin.Crud.CrudAction]
        CRUD_ACTION_UNSPECIFIED: Plugin.Crud.CrudAction
        CRUD_ACTION_CREATE: Plugin.Crud.CrudAction
        CRUD_ACTION_UPDATE: Plugin.Crud.CrudAction
        CRUD_ACTION_DELETE: Plugin.Crud.CrudAction
        CRUD_ACTION_READ: Plugin.Crud.CrudAction
        RESOURCE_TYPE_FIELD_NUMBER: _ClassVar[int]
        ACTION_FIELD_NUMBER: _ClassVar[int]
        RESOURCE_BODY_FIELD_NUMBER: _ClassVar[int]
        RESOURCE_ID_FIELD_NUMBER: _ClassVar[int]
        resource_type: str
        action: Plugin.Crud.CrudAction
        resource_body: str
        resource_id: str
        def __init__(self, resource_type: _Optional[str] = ..., action: _Optional[_Union[Plugin.Crud.CrudAction, str]] = ..., resource_body: _Optional[str] = ..., resource_id: _Optional[str] = ...) -> None: ...
    class Bulk(_message.Message):
        __slots__ = ("resource_type", "action", "resource_body", "external_id")
        class BulkAction(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
            __slots__ = ()
            BULK_ACTION_UNSPECIFIED: _ClassVar[Plugin.Bulk.BulkAction]
            BULK_ACTION_CREATE: _ClassVar[Plugin.Bulk.BulkAction]
            BULK_ACTION_UPDATE: _ClassVar[Plugin.Bulk.BulkAction]
            BULK_ACTION_DELETE: _ClassVar[Plugin.Bulk.BulkAction]
            BULK_ACTION_UPSERT: _ClassVar[Plugin.Bulk.BulkAction]
        BULK_ACTION_UNSPECIFIED: Plugin.Bulk.BulkAction
        BULK_ACTION_CREATE: Plugin.Bulk.BulkAction
        BULK_ACTION_UPDATE: Plugin.Bulk.BulkAction
        BULK_ACTION_DELETE: Plugin.Bulk.BulkAction
        BULK_ACTION_UPSERT: Plugin.Bulk.BulkAction
        RESOURCE_TYPE_FIELD_NUMBER: _ClassVar[int]
        ACTION_FIELD_NUMBER: _ClassVar[int]
        RESOURCE_BODY_FIELD_NUMBER: _ClassVar[int]
        EXTERNAL_ID_FIELD_NUMBER: _ClassVar[int]
        resource_type: str
        action: Plugin.Bulk.BulkAction
        resource_body: str
        external_id: str
        def __init__(self, resource_type: _Optional[str] = ..., action: _Optional[_Union[Plugin.Bulk.BulkAction, str]] = ..., resource_body: _Optional[str] = ..., external_id: _Optional[str] = ...) -> None: ...
    NAME_FIELD_NUMBER: _ClassVar[int]
    CONNECTION_FIELD_NUMBER: _ClassVar[int]
    SOQL_FIELD_NUMBER: _ClassVar[int]
    CRUD_FIELD_NUMBER: _ClassVar[int]
    BULK_FIELD_NUMBER: _ClassVar[int]
    DYNAMIC_WORKFLOW_CONFIGURATION_FIELD_NUMBER: _ClassVar[int]
    name: str
    connection: Plugin.SalesforceConnection
    soql: Plugin.Soql
    crud: Plugin.Crud
    bulk: Plugin.Bulk
    dynamic_workflow_configuration: _plugin_pb2.DynamicWorkflowConfiguration
    def __init__(self, name: _Optional[str] = ..., connection: _Optional[_Union[Plugin.SalesforceConnection, _Mapping]] = ..., soql: _Optional[_Union[Plugin.Soql, _Mapping]] = ..., crud: _Optional[_Union[Plugin.Crud, _Mapping]] = ..., bulk: _Optional[_Union[Plugin.Bulk, _Mapping]] = ..., dynamic_workflow_configuration: _Optional[_Union[_plugin_pb2.DynamicWorkflowConfiguration, _Mapping]] = ...) -> None: ...
