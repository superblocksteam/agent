from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class SuperblocksMetadata(_message.Message):
    __slots__ = ("pluginVersion",)
    PLUGINVERSION_FIELD_NUMBER: _ClassVar[int]
    pluginVersion: str
    def __init__(self, pluginVersion: _Optional[str] = ...) -> None: ...

class Property(_message.Message):
    __slots__ = ("key", "value", "editable", "internal", "description", "mandatory", "type", "defaultValue", "minRange", "maxRange", "valueOptions")
    KEY_FIELD_NUMBER: _ClassVar[int]
    VALUE_FIELD_NUMBER: _ClassVar[int]
    EDITABLE_FIELD_NUMBER: _ClassVar[int]
    INTERNAL_FIELD_NUMBER: _ClassVar[int]
    DESCRIPTION_FIELD_NUMBER: _ClassVar[int]
    MANDATORY_FIELD_NUMBER: _ClassVar[int]
    TYPE_FIELD_NUMBER: _ClassVar[int]
    DEFAULTVALUE_FIELD_NUMBER: _ClassVar[int]
    MINRANGE_FIELD_NUMBER: _ClassVar[int]
    MAXRANGE_FIELD_NUMBER: _ClassVar[int]
    VALUEOPTIONS_FIELD_NUMBER: _ClassVar[int]
    key: str
    value: int
    editable: bool
    internal: bool
    description: str
    mandatory: bool
    type: str
    defaultValue: str
    minRange: str
    maxRange: str
    valueOptions: _containers.RepeatedScalarFieldContainer[str]
    def __init__(self, key: _Optional[str] = ..., value: _Optional[int] = ..., editable: bool = ..., internal: bool = ..., description: _Optional[str] = ..., mandatory: bool = ..., type: _Optional[str] = ..., defaultValue: _Optional[str] = ..., minRange: _Optional[str] = ..., maxRange: _Optional[str] = ..., valueOptions: _Optional[_Iterable[str]] = ...) -> None: ...

class Custom(_message.Message):
    __slots__ = ("presignedExpiration",)
    PRESIGNEDEXPIRATION_FIELD_NUMBER: _ClassVar[int]
    presignedExpiration: Property
    def __init__(self, presignedExpiration: _Optional[_Union[Property, _Mapping]] = ...) -> None: ...

class Plugin(_message.Message):
    __slots__ = ("action", "generateChatGptResponsePrompt", "generateChatGptResponseMessageHistory", "generateChatGptResponseSystemInstruction", "generateTextType", "generateTextNewTextPrompt", "generateTextEditTextTextToEdit", "generateTextEditTextPrompt", "generateCodeType", "generateCodeNewCodePrompt", "generateCodeEditCodeCodeToEdit", "generateCodeEditCodePrompt", "checkModerationText", "embeddingText", "generateImageMethod", "generateImageGenerateFromPromptPrompt", "generateImageGenerateFromPromptImageImageSize", "generateImageEditImagePrompt", "generateImageEditImageImageFileToEdit", "generateImageEditImageImageMask", "generateImageEditImageImageSizes", "generateImageVaryImageImageFile", "generateImageVaryImageImageSize", "transcribeAudioToTextAudioFile", "transcribeAudioToTextInputLanguage", "transcribeAudioToTextTranslateToEnglish", "generateChatGPTResponseAiModel", "generateTextNewTextAiModel", "generateTextEditTextAiModel", "generateCodeNewCodeAiModel", "generateCodeEditCodeAiModel", "checkModerationAiModel", "generateTextEmbeddingAiModel", "transcribeAudioToTextAiModel", "generateChatGptResponseMaxTokens", "generateTextNewTextMaxTokens", "aiModel", "superblocksMetadata")
    ACTION_FIELD_NUMBER: _ClassVar[int]
    GENERATECHATGPTRESPONSEPROMPT_FIELD_NUMBER: _ClassVar[int]
    GENERATECHATGPTRESPONSEMESSAGEHISTORY_FIELD_NUMBER: _ClassVar[int]
    GENERATECHATGPTRESPONSESYSTEMINSTRUCTION_FIELD_NUMBER: _ClassVar[int]
    GENERATETEXTTYPE_FIELD_NUMBER: _ClassVar[int]
    GENERATETEXTNEWTEXTPROMPT_FIELD_NUMBER: _ClassVar[int]
    GENERATETEXTEDITTEXTTEXTTOEDIT_FIELD_NUMBER: _ClassVar[int]
    GENERATETEXTEDITTEXTPROMPT_FIELD_NUMBER: _ClassVar[int]
    GENERATECODETYPE_FIELD_NUMBER: _ClassVar[int]
    GENERATECODENEWCODEPROMPT_FIELD_NUMBER: _ClassVar[int]
    GENERATECODEEDITCODECODETOEDIT_FIELD_NUMBER: _ClassVar[int]
    GENERATECODEEDITCODEPROMPT_FIELD_NUMBER: _ClassVar[int]
    CHECKMODERATIONTEXT_FIELD_NUMBER: _ClassVar[int]
    EMBEDDINGTEXT_FIELD_NUMBER: _ClassVar[int]
    GENERATEIMAGEMETHOD_FIELD_NUMBER: _ClassVar[int]
    GENERATEIMAGEGENERATEFROMPROMPTPROMPT_FIELD_NUMBER: _ClassVar[int]
    GENERATEIMAGEGENERATEFROMPROMPTIMAGEIMAGESIZE_FIELD_NUMBER: _ClassVar[int]
    GENERATEIMAGEEDITIMAGEPROMPT_FIELD_NUMBER: _ClassVar[int]
    GENERATEIMAGEEDITIMAGEIMAGEFILETOEDIT_FIELD_NUMBER: _ClassVar[int]
    GENERATEIMAGEEDITIMAGEIMAGEMASK_FIELD_NUMBER: _ClassVar[int]
    GENERATEIMAGEEDITIMAGEIMAGESIZES_FIELD_NUMBER: _ClassVar[int]
    GENERATEIMAGEVARYIMAGEIMAGEFILE_FIELD_NUMBER: _ClassVar[int]
    GENERATEIMAGEVARYIMAGEIMAGESIZE_FIELD_NUMBER: _ClassVar[int]
    TRANSCRIBEAUDIOTOTEXTAUDIOFILE_FIELD_NUMBER: _ClassVar[int]
    TRANSCRIBEAUDIOTOTEXTINPUTLANGUAGE_FIELD_NUMBER: _ClassVar[int]
    TRANSCRIBEAUDIOTOTEXTTRANSLATETOENGLISH_FIELD_NUMBER: _ClassVar[int]
    GENERATECHATGPTRESPONSEAIMODEL_FIELD_NUMBER: _ClassVar[int]
    GENERATETEXTNEWTEXTAIMODEL_FIELD_NUMBER: _ClassVar[int]
    GENERATETEXTEDITTEXTAIMODEL_FIELD_NUMBER: _ClassVar[int]
    GENERATECODENEWCODEAIMODEL_FIELD_NUMBER: _ClassVar[int]
    GENERATECODEEDITCODEAIMODEL_FIELD_NUMBER: _ClassVar[int]
    CHECKMODERATIONAIMODEL_FIELD_NUMBER: _ClassVar[int]
    GENERATETEXTEMBEDDINGAIMODEL_FIELD_NUMBER: _ClassVar[int]
    TRANSCRIBEAUDIOTOTEXTAIMODEL_FIELD_NUMBER: _ClassVar[int]
    GENERATECHATGPTRESPONSEMAXTOKENS_FIELD_NUMBER: _ClassVar[int]
    GENERATETEXTNEWTEXTMAXTOKENS_FIELD_NUMBER: _ClassVar[int]
    AIMODEL_FIELD_NUMBER: _ClassVar[int]
    SUPERBLOCKSMETADATA_FIELD_NUMBER: _ClassVar[int]
    action: str
    generateChatGptResponsePrompt: str
    generateChatGptResponseMessageHistory: str
    generateChatGptResponseSystemInstruction: str
    generateTextType: str
    generateTextNewTextPrompt: str
    generateTextEditTextTextToEdit: str
    generateTextEditTextPrompt: str
    generateCodeType: str
    generateCodeNewCodePrompt: str
    generateCodeEditCodeCodeToEdit: str
    generateCodeEditCodePrompt: str
    checkModerationText: str
    embeddingText: str
    generateImageMethod: str
    generateImageGenerateFromPromptPrompt: str
    generateImageGenerateFromPromptImageImageSize: str
    generateImageEditImagePrompt: str
    generateImageEditImageImageFileToEdit: str
    generateImageEditImageImageMask: str
    generateImageEditImageImageSizes: str
    generateImageVaryImageImageFile: str
    generateImageVaryImageImageSize: str
    transcribeAudioToTextAudioFile: str
    transcribeAudioToTextInputLanguage: str
    transcribeAudioToTextTranslateToEnglish: bool
    generateChatGPTResponseAiModel: str
    generateTextNewTextAiModel: str
    generateTextEditTextAiModel: str
    generateCodeNewCodeAiModel: str
    generateCodeEditCodeAiModel: str
    checkModerationAiModel: str
    generateTextEmbeddingAiModel: str
    transcribeAudioToTextAiModel: str
    generateChatGptResponseMaxTokens: str
    generateTextNewTextMaxTokens: str
    aiModel: str
    superblocksMetadata: SuperblocksMetadata
    def __init__(self, action: _Optional[str] = ..., generateChatGptResponsePrompt: _Optional[str] = ..., generateChatGptResponseMessageHistory: _Optional[str] = ..., generateChatGptResponseSystemInstruction: _Optional[str] = ..., generateTextType: _Optional[str] = ..., generateTextNewTextPrompt: _Optional[str] = ..., generateTextEditTextTextToEdit: _Optional[str] = ..., generateTextEditTextPrompt: _Optional[str] = ..., generateCodeType: _Optional[str] = ..., generateCodeNewCodePrompt: _Optional[str] = ..., generateCodeEditCodeCodeToEdit: _Optional[str] = ..., generateCodeEditCodePrompt: _Optional[str] = ..., checkModerationText: _Optional[str] = ..., embeddingText: _Optional[str] = ..., generateImageMethod: _Optional[str] = ..., generateImageGenerateFromPromptPrompt: _Optional[str] = ..., generateImageGenerateFromPromptImageImageSize: _Optional[str] = ..., generateImageEditImagePrompt: _Optional[str] = ..., generateImageEditImageImageFileToEdit: _Optional[str] = ..., generateImageEditImageImageMask: _Optional[str] = ..., generateImageEditImageImageSizes: _Optional[str] = ..., generateImageVaryImageImageFile: _Optional[str] = ..., generateImageVaryImageImageSize: _Optional[str] = ..., transcribeAudioToTextAudioFile: _Optional[str] = ..., transcribeAudioToTextInputLanguage: _Optional[str] = ..., transcribeAudioToTextTranslateToEnglish: bool = ..., generateChatGPTResponseAiModel: _Optional[str] = ..., generateTextNewTextAiModel: _Optional[str] = ..., generateTextEditTextAiModel: _Optional[str] = ..., generateCodeNewCodeAiModel: _Optional[str] = ..., generateCodeEditCodeAiModel: _Optional[str] = ..., checkModerationAiModel: _Optional[str] = ..., generateTextEmbeddingAiModel: _Optional[str] = ..., transcribeAudioToTextAiModel: _Optional[str] = ..., generateChatGptResponseMaxTokens: _Optional[str] = ..., generateTextNewTextMaxTokens: _Optional[str] = ..., aiModel: _Optional[str] = ..., superblocksMetadata: _Optional[_Union[SuperblocksMetadata, _Mapping]] = ...) -> None: ...
