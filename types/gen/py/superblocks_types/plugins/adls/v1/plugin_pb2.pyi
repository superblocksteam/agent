from plugins.common.v1 import auth_pb2 as _auth_pb2
from plugins.common.v1 import plugin_pb2 as _plugin_pb2
from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class Plugin(_message.Message):
    __slots__ = ("name", "dynamic_workflow_configuration", "connection", "create_container", "create_directory", "rename_directory", "delete_directory", "list_directory_contents", "upload_file", "download_file", "delete_file")
    class AdlsConnection(_message.Message):
        __slots__ = ("account_name", "tenant", "auth")
        ACCOUNT_NAME_FIELD_NUMBER: _ClassVar[int]
        TENANT_FIELD_NUMBER: _ClassVar[int]
        AUTH_FIELD_NUMBER: _ClassVar[int]
        account_name: str
        tenant: str
        auth: _auth_pb2.Azure
        def __init__(self, account_name: _Optional[str] = ..., tenant: _Optional[str] = ..., auth: _Optional[_Union[_auth_pb2.Azure, _Mapping]] = ...) -> None: ...
    class CreateContainer(_message.Message):
        __slots__ = ("file_system",)
        FILE_SYSTEM_FIELD_NUMBER: _ClassVar[int]
        file_system: str
        def __init__(self, file_system: _Optional[str] = ...) -> None: ...
    class CreateDirectory(_message.Message):
        __slots__ = ("file_system", "path")
        FILE_SYSTEM_FIELD_NUMBER: _ClassVar[int]
        PATH_FIELD_NUMBER: _ClassVar[int]
        file_system: str
        path: str
        def __init__(self, file_system: _Optional[str] = ..., path: _Optional[str] = ...) -> None: ...
    class RenameDirectory(_message.Message):
        __slots__ = ("file_system", "path", "new_path")
        FILE_SYSTEM_FIELD_NUMBER: _ClassVar[int]
        PATH_FIELD_NUMBER: _ClassVar[int]
        NEW_PATH_FIELD_NUMBER: _ClassVar[int]
        file_system: str
        path: str
        new_path: str
        def __init__(self, file_system: _Optional[str] = ..., path: _Optional[str] = ..., new_path: _Optional[str] = ...) -> None: ...
    class DeleteDirectory(_message.Message):
        __slots__ = ("file_system", "path")
        FILE_SYSTEM_FIELD_NUMBER: _ClassVar[int]
        PATH_FIELD_NUMBER: _ClassVar[int]
        file_system: str
        path: str
        def __init__(self, file_system: _Optional[str] = ..., path: _Optional[str] = ...) -> None: ...
    class ListDirectoryContents(_message.Message):
        __slots__ = ("file_system", "path")
        FILE_SYSTEM_FIELD_NUMBER: _ClassVar[int]
        PATH_FIELD_NUMBER: _ClassVar[int]
        file_system: str
        path: str
        def __init__(self, file_system: _Optional[str] = ..., path: _Optional[str] = ...) -> None: ...
    class UploadFile(_message.Message):
        __slots__ = ("file_system", "path", "content")
        FILE_SYSTEM_FIELD_NUMBER: _ClassVar[int]
        PATH_FIELD_NUMBER: _ClassVar[int]
        CONTENT_FIELD_NUMBER: _ClassVar[int]
        file_system: str
        path: str
        content: str
        def __init__(self, file_system: _Optional[str] = ..., path: _Optional[str] = ..., content: _Optional[str] = ...) -> None: ...
    class DownloadFile(_message.Message):
        __slots__ = ("file_system", "path")
        FILE_SYSTEM_FIELD_NUMBER: _ClassVar[int]
        PATH_FIELD_NUMBER: _ClassVar[int]
        file_system: str
        path: str
        def __init__(self, file_system: _Optional[str] = ..., path: _Optional[str] = ...) -> None: ...
    class DeleteFile(_message.Message):
        __slots__ = ("file_system", "path")
        FILE_SYSTEM_FIELD_NUMBER: _ClassVar[int]
        PATH_FIELD_NUMBER: _ClassVar[int]
        file_system: str
        path: str
        def __init__(self, file_system: _Optional[str] = ..., path: _Optional[str] = ...) -> None: ...
    class Metadata(_message.Message):
        __slots__ = ("file_systems",)
        FILE_SYSTEMS_FIELD_NUMBER: _ClassVar[int]
        file_systems: _containers.RepeatedScalarFieldContainer[str]
        def __init__(self, file_systems: _Optional[_Iterable[str]] = ...) -> None: ...
    NAME_FIELD_NUMBER: _ClassVar[int]
    DYNAMIC_WORKFLOW_CONFIGURATION_FIELD_NUMBER: _ClassVar[int]
    CONNECTION_FIELD_NUMBER: _ClassVar[int]
    CREATE_CONTAINER_FIELD_NUMBER: _ClassVar[int]
    CREATE_DIRECTORY_FIELD_NUMBER: _ClassVar[int]
    RENAME_DIRECTORY_FIELD_NUMBER: _ClassVar[int]
    DELETE_DIRECTORY_FIELD_NUMBER: _ClassVar[int]
    LIST_DIRECTORY_CONTENTS_FIELD_NUMBER: _ClassVar[int]
    UPLOAD_FILE_FIELD_NUMBER: _ClassVar[int]
    DOWNLOAD_FILE_FIELD_NUMBER: _ClassVar[int]
    DELETE_FILE_FIELD_NUMBER: _ClassVar[int]
    name: str
    dynamic_workflow_configuration: _plugin_pb2.DynamicWorkflowConfiguration
    connection: Plugin.AdlsConnection
    create_container: Plugin.CreateContainer
    create_directory: Plugin.CreateDirectory
    rename_directory: Plugin.RenameDirectory
    delete_directory: Plugin.DeleteDirectory
    list_directory_contents: Plugin.ListDirectoryContents
    upload_file: Plugin.UploadFile
    download_file: Plugin.DownloadFile
    delete_file: Plugin.DeleteFile
    def __init__(self, name: _Optional[str] = ..., dynamic_workflow_configuration: _Optional[_Union[_plugin_pb2.DynamicWorkflowConfiguration, _Mapping]] = ..., connection: _Optional[_Union[Plugin.AdlsConnection, _Mapping]] = ..., create_container: _Optional[_Union[Plugin.CreateContainer, _Mapping]] = ..., create_directory: _Optional[_Union[Plugin.CreateDirectory, _Mapping]] = ..., rename_directory: _Optional[_Union[Plugin.RenameDirectory, _Mapping]] = ..., delete_directory: _Optional[_Union[Plugin.DeleteDirectory, _Mapping]] = ..., list_directory_contents: _Optional[_Union[Plugin.ListDirectoryContents, _Mapping]] = ..., upload_file: _Optional[_Union[Plugin.UploadFile, _Mapping]] = ..., download_file: _Optional[_Union[Plugin.DownloadFile, _Mapping]] = ..., delete_file: _Optional[_Union[Plugin.DeleteFile, _Mapping]] = ...) -> None: ...
