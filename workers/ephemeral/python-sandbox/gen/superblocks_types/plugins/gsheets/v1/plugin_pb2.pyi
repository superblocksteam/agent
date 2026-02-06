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
    __slots__ = ("spreadsheetId", "sheetTitle", "range", "rowNumber", "extractFirstRowHeader", "headerRowNumber", "format", "data", "preserveHeaderRow", "includeHeaderRow", "action", "writeToDestinationType", "body", "superblocksMetadata", "addSheet")
    class AddSheet(_message.Message):
        __slots__ = ("sheetTitle", "rowCount", "columnCount")
        SHEETTITLE_FIELD_NUMBER: _ClassVar[int]
        ROWCOUNT_FIELD_NUMBER: _ClassVar[int]
        COLUMNCOUNT_FIELD_NUMBER: _ClassVar[int]
        sheetTitle: str
        rowCount: str
        columnCount: str
        def __init__(self, sheetTitle: _Optional[str] = ..., rowCount: _Optional[str] = ..., columnCount: _Optional[str] = ...) -> None: ...
    SPREADSHEETID_FIELD_NUMBER: _ClassVar[int]
    SHEETTITLE_FIELD_NUMBER: _ClassVar[int]
    RANGE_FIELD_NUMBER: _ClassVar[int]
    ROWNUMBER_FIELD_NUMBER: _ClassVar[int]
    EXTRACTFIRSTROWHEADER_FIELD_NUMBER: _ClassVar[int]
    HEADERROWNUMBER_FIELD_NUMBER: _ClassVar[int]
    FORMAT_FIELD_NUMBER: _ClassVar[int]
    DATA_FIELD_NUMBER: _ClassVar[int]
    PRESERVEHEADERROW_FIELD_NUMBER: _ClassVar[int]
    INCLUDEHEADERROW_FIELD_NUMBER: _ClassVar[int]
    ACTION_FIELD_NUMBER: _ClassVar[int]
    WRITETODESTINATIONTYPE_FIELD_NUMBER: _ClassVar[int]
    BODY_FIELD_NUMBER: _ClassVar[int]
    SUPERBLOCKSMETADATA_FIELD_NUMBER: _ClassVar[int]
    ADDSHEET_FIELD_NUMBER: _ClassVar[int]
    spreadsheetId: str
    sheetTitle: str
    range: str
    rowNumber: str
    extractFirstRowHeader: bool
    headerRowNumber: str
    format: str
    data: str
    preserveHeaderRow: bool
    includeHeaderRow: bool
    action: str
    writeToDestinationType: str
    body: str
    superblocksMetadata: SuperblocksMetadata
    addSheet: Plugin.AddSheet
    def __init__(self, spreadsheetId: _Optional[str] = ..., sheetTitle: _Optional[str] = ..., range: _Optional[str] = ..., rowNumber: _Optional[str] = ..., extractFirstRowHeader: bool = ..., headerRowNumber: _Optional[str] = ..., format: _Optional[str] = ..., data: _Optional[str] = ..., preserveHeaderRow: bool = ..., includeHeaderRow: bool = ..., action: _Optional[str] = ..., writeToDestinationType: _Optional[str] = ..., body: _Optional[str] = ..., superblocksMetadata: _Optional[_Union[SuperblocksMetadata, _Mapping]] = ..., addSheet: _Optional[_Union[Plugin.AddSheet, _Mapping]] = ...) -> None: ...
