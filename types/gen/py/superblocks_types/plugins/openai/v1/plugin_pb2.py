# -*- coding: utf-8 -*-
# Generated by the protocol buffer compiler.  DO NOT EDIT!
# NO CHECKED-IN PROTOBUF GENCODE
# source: plugins/openai/v1/plugin.proto
# Protobuf Python Version: 6.31.1
"""Generated protocol buffer code."""
from google.protobuf import descriptor as _descriptor
from google.protobuf import descriptor_pool as _descriptor_pool
from google.protobuf import runtime_version as _runtime_version
from google.protobuf import symbol_database as _symbol_database
from google.protobuf.internal import builder as _builder
_runtime_version.ValidateProtobufRuntimeVersion(
    _runtime_version.Domain.PUBLIC,
    6,
    31,
    1,
    '',
    'plugins/openai/v1/plugin.proto'
)
# @@protoc_insertion_point(imports)

_sym_db = _symbol_database.Default()




DESCRIPTOR = _descriptor_pool.Default().AddSerializedFile(b'\n\x1eplugins/openai/v1/plugin.proto\x12\x11plugins.openai.v1\";\n\x13SuperblocksMetadata\x12$\n\rpluginVersion\x18\x01 \x01(\tR\rpluginVersion\"\xbe\x02\n\x08Property\x12\x10\n\x03key\x18\x01 \x01(\tR\x03key\x12\x14\n\x05value\x18\x02 \x01(\x05R\x05value\x12\x1a\n\x08\x65\x64itable\x18\x03 \x01(\x08R\x08\x65\x64itable\x12\x1a\n\x08internal\x18\x04 \x01(\x08R\x08internal\x12 \n\x0b\x64\x65scription\x18\x05 \x01(\tR\x0b\x64\x65scription\x12\x1c\n\tmandatory\x18\x06 \x01(\x08R\tmandatory\x12\x12\n\x04type\x18\x07 \x01(\tR\x04type\x12\"\n\x0c\x64\x65\x66\x61ultValue\x18\x08 \x01(\tR\x0c\x64\x65\x66\x61ultValue\x12\x1a\n\x08minRange\x18\t \x01(\tR\x08minRange\x12\x1a\n\x08maxRange\x18\n \x01(\tR\x08maxRange\x12\"\n\x0cvalueOptions\x18\x0b \x03(\tR\x0cvalueOptions\"W\n\x06\x43ustom\x12M\n\x13presignedExpiration\x18\x01 \x01(\x0b\x32\x1b.plugins.openai.v1.PropertyR\x13presignedExpiration\"\xae\x1e\n\x06Plugin\x12\x16\n\x06\x61\x63tion\x18\x01 \x01(\tR\x06\x61\x63tion\x12I\n\x1dgenerateChatGptResponsePrompt\x18\x02 \x01(\tH\x00R\x1dgenerateChatGptResponsePrompt\x88\x01\x01\x12Y\n%generateChatGptResponseMessageHistory\x18\x03 \x01(\tH\x01R%generateChatGptResponseMessageHistory\x88\x01\x01\x12_\n(generateChatGptResponseSystemInstruction\x18\x04 \x01(\tH\x02R(generateChatGptResponseSystemInstruction\x88\x01\x01\x12/\n\x10generateTextType\x18\x05 \x01(\tH\x03R\x10generateTextType\x88\x01\x01\x12\x41\n\x19generateTextNewTextPrompt\x18\x06 \x01(\tH\x04R\x19generateTextNewTextPrompt\x88\x01\x01\x12K\n\x1egenerateTextEditTextTextToEdit\x18\x07 \x01(\tH\x05R\x1egenerateTextEditTextTextToEdit\x88\x01\x01\x12\x43\n\x1agenerateTextEditTextPrompt\x18\x08 \x01(\tH\x06R\x1agenerateTextEditTextPrompt\x88\x01\x01\x12/\n\x10generateCodeType\x18\t \x01(\tH\x07R\x10generateCodeType\x88\x01\x01\x12\x41\n\x19generateCodeNewCodePrompt\x18\n \x01(\tH\x08R\x19generateCodeNewCodePrompt\x88\x01\x01\x12K\n\x1egenerateCodeEditCodeCodeToEdit\x18\x0b \x01(\tH\tR\x1egenerateCodeEditCodeCodeToEdit\x88\x01\x01\x12\x43\n\x1agenerateCodeEditCodePrompt\x18\x0c \x01(\tH\nR\x1agenerateCodeEditCodePrompt\x88\x01\x01\x12\x35\n\x13\x63heckModerationText\x18\r \x01(\tH\x0bR\x13\x63heckModerationText\x88\x01\x01\x12)\n\rembeddingText\x18\x0e \x01(\tH\x0cR\rembeddingText\x88\x01\x01\x12\x35\n\x13generateImageMethod\x18\x0f \x01(\tH\rR\x13generateImageMethod\x88\x01\x01\x12Y\n%generateImageGenerateFromPromptPrompt\x18\x10 \x01(\tH\x0eR%generateImageGenerateFromPromptPrompt\x88\x01\x01\x12i\n-generateImageGenerateFromPromptImageImageSize\x18\x11 \x01(\tH\x0fR-generateImageGenerateFromPromptImageImageSize\x88\x01\x01\x12G\n\x1cgenerateImageEditImagePrompt\x18\x12 \x01(\tH\x10R\x1cgenerateImageEditImagePrompt\x88\x01\x01\x12Y\n%generateImageEditImageImageFileToEdit\x18\x13 \x01(\tH\x11R%generateImageEditImageImageFileToEdit\x88\x01\x01\x12M\n\x1fgenerateImageEditImageImageMask\x18\x14 \x01(\tH\x12R\x1fgenerateImageEditImageImageMask\x88\x01\x01\x12O\n generateImageEditImageImageSizes\x18\x15 \x01(\tH\x13R generateImageEditImageImageSizes\x88\x01\x01\x12M\n\x1fgenerateImageVaryImageImageFile\x18\x16 \x01(\tH\x14R\x1fgenerateImageVaryImageImageFile\x88\x01\x01\x12M\n\x1fgenerateImageVaryImageImageSize\x18\x17 \x01(\tH\x15R\x1fgenerateImageVaryImageImageSize\x88\x01\x01\x12K\n\x1etranscribeAudioToTextAudioFile\x18\x18 \x01(\tH\x16R\x1etranscribeAudioToTextAudioFile\x88\x01\x01\x12S\n\"transcribeAudioToTextInputLanguage\x18\x19 \x01(\tH\x17R\"transcribeAudioToTextInputLanguage\x88\x01\x01\x12X\n\'transcribeAudioToTextTranslateToEnglish\x18\x1a \x01(\x08R\'transcribeAudioToTextTranslateToEnglish\x12K\n\x1egenerateChatGPTResponseAiModel\x18\x1b \x01(\tH\x18R\x1egenerateChatGPTResponseAiModel\x88\x01\x01\x12\x43\n\x1agenerateTextNewTextAiModel\x18\x1c \x01(\tH\x19R\x1agenerateTextNewTextAiModel\x88\x01\x01\x12\x45\n\x1bgenerateTextEditTextAiModel\x18\x1d \x01(\tH\x1aR\x1bgenerateTextEditTextAiModel\x88\x01\x01\x12\x43\n\x1agenerateCodeNewCodeAiModel\x18\x1e \x01(\tH\x1bR\x1agenerateCodeNewCodeAiModel\x88\x01\x01\x12\x45\n\x1bgenerateCodeEditCodeAiModel\x18\x1f \x01(\tH\x1cR\x1bgenerateCodeEditCodeAiModel\x88\x01\x01\x12;\n\x16\x63heckModerationAiModel\x18  \x01(\tH\x1dR\x16\x63heckModerationAiModel\x88\x01\x01\x12G\n\x1cgenerateTextEmbeddingAiModel\x18! \x01(\tH\x1eR\x1cgenerateTextEmbeddingAiModel\x88\x01\x01\x12G\n\x1ctranscribeAudioToTextAiModel\x18\" \x01(\tH\x1fR\x1ctranscribeAudioToTextAiModel\x88\x01\x01\x12O\n generateChatGptResponseMaxTokens\x18# \x01(\tH R generateChatGptResponseMaxTokens\x88\x01\x01\x12G\n\x1cgenerateTextNewTextMaxTokens\x18$ \x01(\tH!R\x1cgenerateTextNewTextMaxTokens\x88\x01\x01\x12\x1d\n\x07\x61iModel\x18% \x01(\tH\"R\x07\x61iModel\x88\x01\x01\x12X\n\x13superblocksMetadata\x18& \x01(\x0b\x32&.plugins.openai.v1.SuperblocksMetadataR\x13superblocksMetadataB \n\x1e_generateChatGptResponsePromptB(\n&_generateChatGptResponseMessageHistoryB+\n)_generateChatGptResponseSystemInstructionB\x13\n\x11_generateTextTypeB\x1c\n\x1a_generateTextNewTextPromptB!\n\x1f_generateTextEditTextTextToEditB\x1d\n\x1b_generateTextEditTextPromptB\x13\n\x11_generateCodeTypeB\x1c\n\x1a_generateCodeNewCodePromptB!\n\x1f_generateCodeEditCodeCodeToEditB\x1d\n\x1b_generateCodeEditCodePromptB\x16\n\x14_checkModerationTextB\x10\n\x0e_embeddingTextB\x16\n\x14_generateImageMethodB(\n&_generateImageGenerateFromPromptPromptB0\n._generateImageGenerateFromPromptImageImageSizeB\x1f\n\x1d_generateImageEditImagePromptB(\n&_generateImageEditImageImageFileToEditB\"\n _generateImageEditImageImageMaskB#\n!_generateImageEditImageImageSizesB\"\n _generateImageVaryImageImageFileB\"\n _generateImageVaryImageImageSizeB!\n\x1f_transcribeAudioToTextAudioFileB%\n#_transcribeAudioToTextInputLanguageB!\n\x1f_generateChatGPTResponseAiModelB\x1d\n\x1b_generateTextNewTextAiModelB\x1e\n\x1c_generateTextEditTextAiModelB\x1d\n\x1b_generateCodeNewCodeAiModelB\x1e\n\x1c_generateCodeEditCodeAiModelB\x19\n\x17_checkModerationAiModelB\x1f\n\x1d_generateTextEmbeddingAiModelB\x1f\n\x1d_transcribeAudioToTextAiModelB#\n!_generateChatGptResponseMaxTokensB\x1f\n\x1d_generateTextNewTextMaxTokensB\n\n\x08_aiModelBAZ?github.com/superblocksteam/agent/types/gen/go/plugins/openai/v1b\x06proto3')

_globals = globals()
_builder.BuildMessageAndEnumDescriptors(DESCRIPTOR, _globals)
_builder.BuildTopDescriptorsAndMessages(DESCRIPTOR, 'plugins.openai.v1.plugin_pb2', _globals)
if not _descriptor._USE_C_DESCRIPTORS:
  _globals['DESCRIPTOR']._loaded_options = None
  _globals['DESCRIPTOR']._serialized_options = b'Z?github.com/superblocksteam/agent/types/gen/go/plugins/openai/v1'
  _globals['_SUPERBLOCKSMETADATA']._serialized_start=53
  _globals['_SUPERBLOCKSMETADATA']._serialized_end=112
  _globals['_PROPERTY']._serialized_start=115
  _globals['_PROPERTY']._serialized_end=433
  _globals['_CUSTOM']._serialized_start=435
  _globals['_CUSTOM']._serialized_end=522
  _globals['_PLUGIN']._serialized_start=525
  _globals['_PLUGIN']._serialized_end=4411
# @@protoc_insertion_point(module_scope)
