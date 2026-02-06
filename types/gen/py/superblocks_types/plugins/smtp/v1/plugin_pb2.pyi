from plugins.common.v1 import plugin_pb2 as _plugin_pb2
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class Plugin(_message.Message):
    __slots__ = ("name", "connection", "reply_to", "to", "cc", "bcc", "subject", "body", "attachments", "dynamic_workflow_configuration")
    class SmtpConnection(_message.Message):
        __slots__ = ("host", "port", "username", "password", "secure")
        HOST_FIELD_NUMBER: _ClassVar[int]
        PORT_FIELD_NUMBER: _ClassVar[int]
        USERNAME_FIELD_NUMBER: _ClassVar[int]
        PASSWORD_FIELD_NUMBER: _ClassVar[int]
        SECURE_FIELD_NUMBER: _ClassVar[int]
        host: str
        port: int
        username: str
        password: str
        secure: bool
        def __init__(self, host: _Optional[str] = ..., port: _Optional[int] = ..., username: _Optional[str] = ..., password: _Optional[str] = ..., secure: bool = ...) -> None: ...
    NAME_FIELD_NUMBER: _ClassVar[int]
    CONNECTION_FIELD_NUMBER: _ClassVar[int]
    FROM_FIELD_NUMBER: _ClassVar[int]
    REPLY_TO_FIELD_NUMBER: _ClassVar[int]
    TO_FIELD_NUMBER: _ClassVar[int]
    CC_FIELD_NUMBER: _ClassVar[int]
    BCC_FIELD_NUMBER: _ClassVar[int]
    SUBJECT_FIELD_NUMBER: _ClassVar[int]
    BODY_FIELD_NUMBER: _ClassVar[int]
    ATTACHMENTS_FIELD_NUMBER: _ClassVar[int]
    DYNAMIC_WORKFLOW_CONFIGURATION_FIELD_NUMBER: _ClassVar[int]
    name: str
    connection: Plugin.SmtpConnection
    reply_to: str
    to: str
    cc: str
    bcc: str
    subject: str
    body: str
    attachments: str
    dynamic_workflow_configuration: _plugin_pb2.DynamicWorkflowConfiguration
    def __init__(self, name: _Optional[str] = ..., connection: _Optional[_Union[Plugin.SmtpConnection, _Mapping]] = ..., reply_to: _Optional[str] = ..., to: _Optional[str] = ..., cc: _Optional[str] = ..., bcc: _Optional[str] = ..., subject: _Optional[str] = ..., body: _Optional[str] = ..., attachments: _Optional[str] = ..., dynamic_workflow_configuration: _Optional[_Union[_plugin_pb2.DynamicWorkflowConfiguration, _Mapping]] = ..., **kwargs) -> None: ...
