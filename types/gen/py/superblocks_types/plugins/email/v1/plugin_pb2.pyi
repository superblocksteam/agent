from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class SuperblocksMetadata(_message.Message):
    __slots__ = ("pluginVersion",)
    PLUGINVERSION_FIELD_NUMBER: _ClassVar[int]
    pluginVersion: str
    def __init__(self, pluginVersion: _Optional[str] = ...) -> None: ...

class Plugin(_message.Message):
    __slots__ = ("emailFrom", "emailTo", "emailCc", "emailBcc", "emailSubject", "emailBody", "emailAttachments", "superblocksMetadata")
    EMAILFROM_FIELD_NUMBER: _ClassVar[int]
    EMAILTO_FIELD_NUMBER: _ClassVar[int]
    EMAILCC_FIELD_NUMBER: _ClassVar[int]
    EMAILBCC_FIELD_NUMBER: _ClassVar[int]
    EMAILSUBJECT_FIELD_NUMBER: _ClassVar[int]
    EMAILBODY_FIELD_NUMBER: _ClassVar[int]
    EMAILATTACHMENTS_FIELD_NUMBER: _ClassVar[int]
    SUPERBLOCKSMETADATA_FIELD_NUMBER: _ClassVar[int]
    emailFrom: str
    emailTo: str
    emailCc: str
    emailBcc: str
    emailSubject: str
    emailBody: str
    emailAttachments: str
    superblocksMetadata: SuperblocksMetadata
    def __init__(self, emailFrom: _Optional[str] = ..., emailTo: _Optional[str] = ..., emailCc: _Optional[str] = ..., emailBcc: _Optional[str] = ..., emailSubject: _Optional[str] = ..., emailBody: _Optional[str] = ..., emailAttachments: _Optional[str] = ..., superblocksMetadata: _Optional[_Union[SuperblocksMetadata, _Mapping]] = ...) -> None: ...
