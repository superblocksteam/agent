# -*- coding: utf-8 -*-
# Generated by the protocol buffer compiler.  DO NOT EDIT!
# NO CHECKED-IN PROTOBUF GENCODE
# source: api/v1/service.proto
# Protobuf Python Version: 5.27.3
"""Generated protocol buffer code."""
from google.protobuf import descriptor as _descriptor
from google.protobuf import descriptor_pool as _descriptor_pool
from google.protobuf import runtime_version as _runtime_version
from google.protobuf import symbol_database as _symbol_database
from google.protobuf.internal import builder as _builder
_runtime_version.ValidateProtobufRuntimeVersion(
    _runtime_version.Domain.PUBLIC,
    5,
    27,
    3,
    '',
    'api/v1/service.proto'
)
# @@protoc_insertion_point(imports)

_sym_db = _symbol_database.Default()


from superblocks_types.api.v1 import api_pb2 as api_dot_v1_dot_api__pb2
from superblocks_types.api.v1 import event_pb2 as api_dot_v1_dot_event__pb2
from superblocks_types.buf.validate import validate_pb2 as buf_dot_validate_dot_validate__pb2
from superblocks_types.common.v1 import common_pb2 as common_dot_v1_dot_common__pb2
from superblocks_types.common.v1 import errors_pb2 as common_dot_v1_dot_errors__pb2
from superblocks_types.common.v1 import health_pb2 as common_dot_v1_dot_health__pb2
from superblocks_types.google.api import annotations_pb2 as google_dot_api_dot_annotations__pb2
from google.protobuf import empty_pb2 as google_dot_protobuf_dot_empty__pb2
from google.protobuf import struct_pb2 as google_dot_protobuf_dot_struct__pb2
from superblocks_types.plugins.adls.v1 import plugin_pb2 as plugins_dot_adls_dot_v1_dot_plugin__pb2
from superblocks_types.plugins.cosmosdb.v1 import plugin_pb2 as plugins_dot_cosmosdb_dot_v1_dot_plugin__pb2
from superblocks_types.plugins.kafka.v1 import plugin_pb2 as plugins_dot_kafka_dot_v1_dot_plugin__pb2
from superblocks_types.protoc_gen_openapiv2.options import annotations_pb2 as protoc__gen__openapiv2_dot_options_dot_annotations__pb2
from superblocks_types.store.v1 import store_pb2 as store_dot_v1_dot_store__pb2
from superblocks_types.validate import validate_pb2 as validate_dot_validate__pb2


DESCRIPTOR = _descriptor_pool.Default().AddSerializedFile(b'\n\x14\x61pi/v1/service.proto\x12\x06\x61pi.v1\x1a\x10\x61pi/v1/api.proto\x1a\x12\x61pi/v1/event.proto\x1a\x1b\x62uf/validate/validate.proto\x1a\x16\x63ommon/v1/common.proto\x1a\x16\x63ommon/v1/errors.proto\x1a\x16\x63ommon/v1/health.proto\x1a\x1cgoogle/api/annotations.proto\x1a\x1bgoogle/protobuf/empty.proto\x1a\x1cgoogle/protobuf/struct.proto\x1a\x1cplugins/adls/v1/plugin.proto\x1a plugins/cosmosdb/v1/plugin.proto\x1a\x1dplugins/kafka/v1/plugin.proto\x1a.protoc-gen-openapiv2/options/annotations.proto\x1a\x14store/v1/store.proto\x1a\x17validate/validate.proto\"+\n\rHealthRequest\x12\x1a\n\x08\x64\x65tailed\x18\x01 \x01(\x08R\x08\x64\x65tailed\"0\n\x0fValidateRequest\x12\x1d\n\x03\x61pi\x18\x01 \x01(\x0b\x32\x0b.api.v1.ApiR\x03\x61pi\"\xbb\t\n\x0e\x45xecuteRequest\x12\x38\n\x07options\x18\x01 \x01(\x0b\x32\x1e.api.v1.ExecuteRequest.OptionsR\x07options\x12:\n\x06inputs\x18\x02 \x03(\x0b\x32\".api.v1.ExecuteRequest.InputsEntryR\x06inputs\x12\x34\n\ndefinition\x18\x03 \x01(\x0b\x32\x12.api.v1.DefinitionH\x00R\ndefinition\x12\x34\n\x05\x66\x65tch\x18\x04 \x01(\x0b\x32\x1c.api.v1.ExecuteRequest.FetchH\x00R\x05\x66\x65tch\x12\x31\n\x05\x66iles\x18\x05 \x03(\x0b\x32\x1b.api.v1.ExecuteRequest.FileR\x05\x66iles\x12,\n\x07profile\x18\x06 \x01(\x0b\x32\x12.common.v1.ProfileR\x07profile\x12\"\n\x05mocks\x18\x07 \x03(\x0b\x32\x0c.api.v1.MockR\x05mocks\x1a\xa4\x02\n\x07Options\x12%\n\x0e\x65xclude_output\x18\x01 \x01(\x08R\rexcludeOutput\x12\x32\n\x15include_event_outputs\x18\x02 \x01(\x08R\x13includeEventOutputs\x12%\n\x0einclude_events\x18\x03 \x01(\x08R\rincludeEvents\x12\x14\n\x05start\x18\x04 \x01(\tR\x05start\x12\x12\n\x04stop\x18\x05 \x01(\tR\x04stop\x12)\n\x10include_resolved\x18\x06 \x01(\x08R\x0fincludeResolved\x12\x14\n\x05\x61sync\x18\x07 \x01(\x08R\x05\x61sync\x12,\n\x12include_api_events\x18\x08 \x01(\x08R\x10includeApiEvents\x1a\xa1\x02\n\x05\x46\x65tch\x12\x0e\n\x02id\x18\x01 \x01(\tR\x02id\x12,\n\x07profile\x18\x02 \x01(\x0b\x32\x12.common.v1.ProfileR\x07profile\x12\x17\n\x04test\x18\x03 \x01(\x08H\x00R\x04test\x88\x01\x01\x12\x19\n\x05token\x18\x04 \x01(\tH\x01R\x05token\x88\x01\x01\x12-\n\tview_mode\x18\x05 \x01(\x0e\x32\x10.api.v1.ViewModeR\x08viewMode\x12 \n\tcommit_id\x18\x06 \x01(\tH\x02R\x08\x63ommitId\x88\x01\x01\x12$\n\x0b\x62ranch_name\x18\x07 \x01(\tH\x03R\nbranchName\x88\x01\x01\x42\x07\n\x05_testB\x08\n\x06_tokenB\x0c\n\n_commit_idB\x0e\n\x0c_branch_name\x1aQ\n\x0bInputsEntry\x12\x10\n\x03key\x18\x01 \x01(\tR\x03key\x12,\n\x05value\x18\x02 \x01(\x0b\x32\x16.google.protobuf.ValueR\x05value:\x02\x38\x01\x1a\x8e\x01\n\x04\x46ile\x12\"\n\x0coriginalName\x18\x01 \x01(\tR\x0coriginalName\x12\x16\n\x06\x62uffer\x18\x02 \x01(\x0cR\x06\x62uffer\x12\x1a\n\x08\x65ncoding\x18\x03 \x01(\tR\x08\x65ncoding\x12\x1a\n\x08mimeType\x18\x04 \x01(\tR\x08mimeType\x12\x12\n\x04size\x18\x05 \x01(\tR\x04sizeB\x13\n\x07request\x12\x08\xf8\x42\x01\xbaH\x02\x08\x01\"\xb5\x04\n\nDefinition\x12-\n\x03\x61pi\x18\x01 \x01(\x0b\x32\x0b.api.v1.ApiB\x0e\xfa\x42\x05\x8a\x01\x02\x10\x01\xbaH\x03\xc8\x01\x01R\x03\x61pi\x12H\n\x0cintegrations\x18\x02 \x03(\x0b\x32$.api.v1.Definition.IntegrationsEntryR\x0cintegrations\x12\x37\n\x08metadata\x18\x03 \x01(\x0b\x32\x1b.api.v1.Definition.MetadataR\x08metadata\x12(\n\x06stores\x18\x04 \x01(\x0b\x32\x10.store.v1.StoresR\x06stores\x1a\xf0\x01\n\x08Metadata\x12\x1c\n\trequester\x18\x01 \x01(\tR\trequester\x12\x18\n\x07profile\x18\x02 \x01(\tR\x07profile\x12+\n\x11organization_plan\x18\x03 \x01(\tR\x10organizationPlan\x12+\n\x11organization_name\x18\x04 \x01(\tR\x10organizationName\x12?\n\x0erequester_type\x18\x05 \x01(\x0e\x32\x13.common.v1.UserTypeH\x00R\rrequesterType\x88\x01\x01\x42\x11\n\x0f_requester_type\x1aX\n\x11IntegrationsEntry\x12\x10\n\x03key\x18\x01 \x01(\tR\x03key\x12-\n\x05value\x18\x02 \x01(\x0b\x32\x17.google.protobuf.StructR\x05value:\x02\x38\x01\"-\n\rStatusRequest\x12\x1c\n\texecution\x18\x01 \x01(\tR\texecution\"\xe1\x02\n\rAwaitResponse\x12\x1c\n\texecution\x18\x01 \x01(\tR\texecution\x12&\n\x06output\x18\x02 \x01(\x0b\x32\x0e.api.v1.OutputR\x06output\x12(\n\x06\x65rrors\x18\x03 \x03(\x0b\x32\x10.common.v1.ErrorR\x06\x65rrors\x12\x34\n\x06status\x18\x04 \x01(\x0e\x32\x1c.api.v1.AwaitResponse.StatusR\x06status\x12\x35\n\x0bperformance\x18\x05 \x01(\x0b\x32\x13.api.v1.PerformanceR\x0bperformance\x12%\n\x06\x65vents\x18\x06 \x03(\x0b\x32\r.api.v1.EventR\x06\x65vents\"L\n\x06Status\x12\x16\n\x12STATUS_UNSPECIFIED\x10\x00\x12\x14\n\x10STATUS_COMPLETED\x10\x01\x12\x14\n\x10STATUS_EXECUTING\x10\x02\"U\n\rAsyncResponse\x12\x1c\n\texecution\x18\x01 \x01(\tR\texecution\x12&\n\x05\x65rror\x18\x02 \x01(\x0b\x32\x10.common.v1.ErrorR\x05\x65rror\"S\n\x0eStreamResponse\x12\x1c\n\texecution\x18\x01 \x01(\tR\texecution\x12#\n\x05\x65vent\x18\x02 \x01(\x0b\x32\r.api.v1.EventR\x05\x65vent\"e\n\rOutputRequest\x12.\n\texecution\x18\x01 \x01(\tB\x10\xfa\x42\x05r\x03\xb0\x01\x01\xbaH\x05r\x03\xb0\x01\x01R\texecution\x12$\n\x05\x62lock\x18\x02 \x01(\tB\x0e\xfa\x42\x04r\x02\x10\x01\xbaH\x04r\x02\x10\x01R\x05\x62lock\"\x91\x01\n\x0eOutputResponse\x12/\n\x08metadata\x18\x01 \x01(\x0b\x32\x13.common.v1.MetadataR\x08metadata\x12&\n\x06output\x18\x02 \x01(\x0b\x32\x0e.api.v1.OutputR\x06output\x12&\n\x05\x65rror\x18\x03 \x01(\x0b\x32\x10.common.v1.ErrorR\x05\x65rror\"-\n\rCancelRequest\x12\x1c\n\texecution\x18\x01 \x01(\tR\texecution\"8\n\x0e\x43\x61ncelResponse\x12&\n\x05\x65rror\x18\x01 \x01(\x0b\x32\x10.common.v1.ErrorR\x05\x65rror\"\xac\x02\n\x0bTestRequest\x12\x44\n\x11\x64\x61tasource_config\x18\x01 \x01(\x0b\x32\x17.google.protobuf.StructR\x10\x64\x61tasourceConfig\x12)\n\x10integration_type\x18\x02 \x01(\tR\x0fintegrationType\x12)\n\x10\x63onfiguration_id\x18\x03 \x01(\tR\x0f\x63onfigurationId\x12,\n\x07profile\x18\x04 \x01(\x0b\x32\x12.common.v1.ProfileR\x07profile\x12\x41\n\raction_config\x18\x05 \x01(\x0b\x32\x17.google.protobuf.StructH\x00R\x0c\x61\x63tionConfig\x88\x01\x01\x42\x10\n\x0e_action_config\"\x0e\n\x0cTestResponse\"\xab\x01\n\rDeleteRequest\x12 \n\x0bintegration\x18\x01 \x01(\tR\x0bintegration\x12,\n\x07profile\x18\x02 \x01(\x0b\x32\x12.common.v1.ProfileR\x07profile\x12)\n\x10\x63onfiguration_id\x18\x03 \x01(\tR\x0f\x63onfigurationId\x12\x1f\n\x0bplugin_name\x18\x04 \x01(\tR\npluginName\"\x10\n\x0e\x44\x65leteResponse\"\xf5\x01\n\x08\x46unction\x1an\n\x07Request\x12\x17\n\x02id\x18\x01 \x01(\tB\x07\xbaH\x04r\x02\x10\x01R\x02id\x12\x12\n\x04name\x18\x02 \x01(\tR\x04name\x12\x36\n\nparameters\x18\x03 \x03(\x0b\x32\x16.google.protobuf.ValueR\nparameters\x1ay\n\x08Response\x12\x17\n\x02id\x18\x01 \x01(\tB\x07\xbaH\x04r\x02\x10\x01R\x02id\x12,\n\x05value\x18\x02 \x01(\x0b\x32\x16.google.protobuf.ValueR\x05value\x12&\n\x05\x65rror\x18\x03 \x01(\x0b\x32\x10.common.v1.ErrorR\x05\x65rror\"\x8b\x01\n\rTwoWayRequest\x12\x32\n\x07\x65xecute\x18\x01 \x01(\x0b\x32\x16.api.v1.ExecuteRequestH\x00R\x07\x65xecute\x12\x37\n\x08\x66unction\x18\x02 \x01(\x0b\x32\x19.api.v1.Function.ResponseH\x00R\x08\x66unctionB\r\n\x04type\x12\x05\xbaH\x02\x08\x01\"\x89\x01\n\x0eTwoWayResponse\x12\x30\n\x06stream\x18\x01 \x01(\x0b\x32\x16.api.v1.StreamResponseH\x00R\x06stream\x12\x36\n\x08\x66unction\x18\x02 \x01(\x0b\x32\x18.api.v1.Function.RequestH\x00R\x08\x66unctionB\r\n\x04type\x12\x05\xbaH\x02\x08\x01\"\xe2\x03\n\x04Mock\x12\x1f\n\x02on\x18\x01 \x01(\x0b\x32\x0f.api.v1.Mock.OnR\x02on\x12+\n\x06return\x18\x02 \x01(\x0b\x32\x13.api.v1.Mock.ReturnR\x06return\x1a\xbd\x01\n\x06Params\x12.\n\x10integration_type\x18\x01 \x01(\tH\x00R\x0fintegrationType\x88\x01\x01\x12 \n\tstep_name\x18\x02 \x01(\tH\x01R\x08stepName\x88\x01\x01\x12\x33\n\x06inputs\x18\x03 \x01(\x0b\x32\x16.google.protobuf.ValueH\x02R\x06inputs\x88\x01\x01\x42\x13\n\x11_integration_typeB\x0c\n\n_step_nameB\t\n\x07_inputs\x1al\n\x02On\x12\x30\n\x06static\x18\x01 \x01(\x0b\x32\x13.api.v1.Mock.ParamsH\x00R\x06static\x88\x01\x01\x12\x1d\n\x07\x64ynamic\x18\x02 \x01(\tH\x01R\x07\x64ynamic\x88\x01\x01\x42\t\n\x07_staticB\n\n\x08_dynamic\x1a^\n\x06Return\x12\x30\n\x06static\x18\x01 \x01(\x0b\x32\x16.google.protobuf.ValueH\x00R\x06static\x12\x1a\n\x07\x64ynamic\x18\x02 \x01(\tH\x00R\x07\x64ynamicB\x06\n\x04type\"\x82\x01\n\x19MetadataRequestDeprecated\x12 \n\x0bintegration\x18\x01 \x01(\tR\x0bintegration\x12\x15\n\x06\x61pi_id\x18\x02 \x01(\tR\x05\x61piId\x12,\n\x07profile\x18\x03 \x01(\x0b\x32\x12.common.v1.ProfileR\x07profile\"\xa9\x01\n\x0fMetadataRequest\x12 \n\x0bintegration\x18\x01 \x01(\tR\x0bintegration\x12,\n\x07profile\x18\x02 \x01(\x0b\x32\x12.common.v1.ProfileR\x07profile\x12\x46\n\x12step_configuration\x18\x03 \x01(\x0b\x32\x17.google.protobuf.StructR\x11stepConfiguration\"\xd1\n\n\x10MetadataResponse\x12k\n\x18\x64\x61tabase_schema_metadata\x18\x01 \x01(\x0b\x32/.api.v1.MetadataResponse.DatabaseSchemaMetadataH\x00R\x16\x64\x61tabaseSchemaMetadata\x12U\n\x10\x62uckets_metadata\x18\x02 \x01(\x0b\x32(.api.v1.MetadataResponse.BucketsMetadataH\x00R\x0f\x62ucketsMetadata\x12\x32\n\x05kafka\x18\x03 \x01(\x0b\x32\x1a.plugins.kafka.v1.MetadataH\x00R\x05kafka\x12\x42\n\x08\x63osmosdb\x18\x04 \x01(\x0b\x32$.plugins.cosmosdb.v1.Plugin.MetadataH\x00R\x08\x63osmosdb\x12\x36\n\x04\x61\x64ls\x18\x05 \x01(\x0b\x32 .plugins.adls.v1.Plugin.MetadataH\x00R\x04\x61\x64ls\x12\x36\n\x18g_sheets_next_page_token\x18\x06 \x01(\tR\x14gSheetsNextPageToken\x1a\x88\x06\n\x16\x44\x61tabaseSchemaMetadata\x12M\n\x06tables\x18\x01 \x03(\x0b\x32\x35.api.v1.MetadataResponse.DatabaseSchemaMetadata.TableR\x06tables\x12P\n\x07schemas\x18\x02 \x03(\x0b\x32\x36.api.v1.MetadataResponse.DatabaseSchemaMetadata.SchemaR\x07schemas\x1aS\n\x06\x43olumn\x12\x12\n\x04name\x18\x01 \x01(\tR\x04name\x12\x12\n\x04type\x18\x02 \x01(\tR\x04type\x12!\n\x0c\x65scaped_name\x18\x03 \x01(\tR\x0b\x65scapedName\x1aG\n\x03Key\x12\x12\n\x04name\x18\x01 \x01(\tR\x04name\x12\x12\n\x04type\x18\x02 \x01(\tR\x04type\x12\x18\n\x07\x63olumns\x18\x03 \x03(\tR\x07\x63olumns\x1a\x34\n\x08Template\x12\x14\n\x05title\x18\x01 \x01(\tR\x05title\x12\x12\n\x04\x62ody\x18\x02 \x01(\tR\x04\x62ody\x1a\xca\x02\n\x05Table\x12\x0e\n\x02id\x18\x01 \x01(\tR\x02id\x12\x12\n\x04type\x18\x02 \x01(\tR\x04type\x12\x12\n\x04name\x18\x03 \x01(\tR\x04name\x12P\n\x07\x63olumns\x18\x04 \x03(\x0b\x32\x36.api.v1.MetadataResponse.DatabaseSchemaMetadata.ColumnR\x07\x63olumns\x12G\n\x04keys\x18\x05 \x03(\x0b\x32\x33.api.v1.MetadataResponse.DatabaseSchemaMetadata.KeyR\x04keys\x12V\n\ttemplates\x18\x06 \x03(\x0b\x32\x38.api.v1.MetadataResponse.DatabaseSchemaMetadata.TemplateR\ttemplates\x12\x16\n\x06schema\x18\x07 \x01(\tR\x06schema\x1a,\n\x06Schema\x12\x0e\n\x02id\x18\x01 \x01(\tR\x02id\x12\x12\n\x04name\x18\x02 \x01(\tR\x04name\x1a$\n\x0e\x42ucketMetadata\x12\x12\n\x04name\x18\x01 \x01(\tR\x04name\x1aT\n\x0f\x42ucketsMetadata\x12\x41\n\x07\x62uckets\x18\x01 \x03(\x0b\x32\'.api.v1.MetadataResponse.BucketMetadataR\x07\x62ucketsB\n\n\x08metadata\"-\n\x0f\x44ownloadRequest\x12\x1a\n\x08location\x18\x01 \x01(\tR\x08location\"&\n\x10\x44ownloadResponse\x12\x12\n\x04\x64\x61ta\x18\x01 \x01(\x0cR\x04\x64\x61ta\"\xe6\x01\n\x10WorkflowResponse\x12*\n\x04\x64\x61ta\x18\x01 \x01(\x0b\x32\x16.google.protobuf.ValueR\x04\x64\x61ta\x12J\n\rresponse_meta\x18\x02 \x01(\x0b\x32%.api.v1.WorkflowResponse.ResponseMetaR\x0cresponseMeta\x1aZ\n\x0cResponseMeta\x12\x16\n\x06status\x18\x01 \x01(\x05R\x06status\x12\x18\n\x07message\x18\x02 \x01(\tR\x07message\x12\x18\n\x07success\x18\x03 \x01(\x08R\x07success*h\n\x08ViewMode\x12\x19\n\x15VIEW_MODE_UNSPECIFIED\x10\x00\x12\x12\n\x0eVIEW_MODE_EDIT\x10\x01\x12\x15\n\x11VIEW_MODE_PREVIEW\x10\x02\x12\x16\n\x12VIEW_MODE_DEPLOYED\x10\x03\x32q\n\x0fMetadataService\x12^\n\x06Health\x12\x15.api.v1.HealthRequest\x1a\x19.common.v1.HealthResponse\"\"\x92\x41\x10*\x0eService Health\x82\xd3\xe4\x93\x02\t\x12\x07/health2\xbc\x01\n\x11\x44\x65precatedService\x12\xa6\x01\n\x08Workflow\x12\x16.api.v1.ExecuteRequest\x1a\x18.api.v1.WorkflowResponse\"h\x92\x41\x19*\x17Sync Workflow Execution\x82\xd3\xe4\x93\x02\x46\"\x1a/v1/workflows/{fetch.id=*}:\x01*Z%\" /agent/v1/workflows/{fetch.id=*}:\x01*2\xdd\x0b\n\x0f\x45xecutorService\x12\x80\x01\n\x05\x41wait\x12\x16.api.v1.ExecuteRequest\x1a\x15.api.v1.AwaitResponse\"H\x92\x41\x10\x12\x0e\x45xecute an API\x82\xd3\xe4\x93\x02/\"\x0b/v2/execute:\x01*Z\x1d\"\x18/v2/execute/{fetch.id=*}:\x01*\x12v\n\x0cTwoWayStream\x12\x15.api.v1.TwoWayRequest\x1a\x16.api.v1.TwoWayResponse\"3\x92\x41\x13*\x11Two Way Execution\x82\xd3\xe4\x93\x02\x17\"\x12/v2/execute/twoway:\x01*(\x01\x30\x01\x12\x80\x01\n\x12MetadataDeprecated\x12!.api.v1.MetadataRequestDeprecated\x1a\x18.api.v1.MetadataResponse\"-\x92\x41\x16*\x14Integration Metadata\x82\xd3\xe4\x93\x02\x0e\x12\x0c/v2/metadata\x12o\n\x08Metadata\x12\x17.api.v1.MetadataRequest\x1a\x18.api.v1.MetadataResponse\"0\x92\x41\x16*\x14Integration Metadata\x82\xd3\xe4\x93\x02\x11\"\x0c/v2/metadata:\x01*\x12\x66\n\x04Test\x12\x13.api.v1.TestRequest\x1a\x14.api.v1.TestResponse\"3\x92\x41\x1d*\x1bIntegration Connection Test\x82\xd3\xe4\x93\x02\r\"\x08/v2/test:\x01*\x12j\n\x06\x44\x65lete\x12\x15.api.v1.DeleteRequest\x1a\x16.api.v1.DeleteResponse\"1\x92\x41\x19*\x17\x44\x65lete Integration Hook\x82\xd3\xe4\x93\x02\x0f\"\n/v2/delete:\x01*\x12h\n\x05\x41sync\x12\x16.api.v1.ExecuteRequest\x1a\x15.api.v1.AsyncResponse\"0\x92\x41\x11*\x0f\x41sync Execution\x82\xd3\xe4\x93\x02\x16\"\x11/v2/execute/async:\x01*\x12\x94\x01\n\x06Stream\x12\x16.api.v1.ExecuteRequest\x1a\x16.api.v1.StreamResponse\"X\x92\x41\x12*\x10Stream Execution\x82\xd3\xe4\x93\x02=\"\x12/v2/execute/stream:\x01*Z$\"\x1f/v2/execute/stream/{fetch.id=*}:\x01*0\x01\x12_\n\x06Status\x12\x15.api.v1.StatusRequest\x1a\x15.api.v1.AwaitResponse\"\'\x92\x41\x12*\x10\x45xecution Status\x82\xd3\xe4\x93\x02\x0c\x12\n/v2/status\x12\\\n\x06Output\x12\x15.api.v1.OutputRequest\x1a\x16.api.v1.OutputResponse\"#\x92\x41\x0e*\x0c\x42lock Output\x82\xd3\xe4\x93\x02\x0c\x12\n/v2/output\x12\x64\n\x08\x44ownload\x12\x17.api.v1.DownloadRequest\x1a\x18.api.v1.DownloadResponse\"#\x92\x41\x0f*\rDownload File\x82\xd3\xe4\x93\x02\x0b\x12\t/v2/files0\x01\x12i\n\x06\x43\x61ncel\x12\x15.api.v1.CancelRequest\x1a\x16.api.v1.CancelResponse\"0\x92\x41\x1b*\x19\x43\x61ncel an API\'s Execution\x82\xd3\xe4\x93\x02\x0c\"\n/v2/cancel\x12v\n\x08Validate\x12\x17.api.v1.ValidateRequest\x1a\x16.google.protobuf.Empty\"9\x92\x41\x1f*\x1dValidate an API specification\x82\xd3\xe4\x93\x02\x11\"\x0c/v2/validate:\x01*B\x86\x02Z4github.com/superblocksteam/agent/types/gen/go/api/v1\x92\x41\xcc\x01\x12\x8b\x01\n Superblocks API Executor Service\x12IThis is the contract that the Superblocks Orchestrator component exposes.\"\x17\x1a\x15\x66rank@superblocks.com2\x03\x31.0\x1a\x15\x61gent.superblocks.com*\x01\x02\x32\x10\x61pplication/json:\x10\x61pplication/jsonb\x06proto3')

_globals = globals()
_builder.BuildMessageAndEnumDescriptors(DESCRIPTOR, _globals)
_builder.BuildTopDescriptorsAndMessages(DESCRIPTOR, 'api.v1.service_pb2', _globals)
if not _descriptor._USE_C_DESCRIPTORS:
  _globals['DESCRIPTOR']._loaded_options = None
  _globals['DESCRIPTOR']._serialized_options = b'Z4github.com/superblocksteam/agent/types/gen/go/api/v1\222A\314\001\022\213\001\n Superblocks API Executor Service\022IThis is the contract that the Superblocks Orchestrator component exposes.\"\027\032\025frank@superblocks.com2\0031.0\032\025agent.superblocks.com*\001\0022\020application/json:\020application/json'
  _globals['_EXECUTEREQUEST_INPUTSENTRY']._loaded_options = None
  _globals['_EXECUTEREQUEST_INPUTSENTRY']._serialized_options = b'8\001'
  _globals['_EXECUTEREQUEST'].oneofs_by_name['request']._loaded_options = None
  _globals['_EXECUTEREQUEST'].oneofs_by_name['request']._serialized_options = b'\370B\001\272H\002\010\001'
  _globals['_DEFINITION_INTEGRATIONSENTRY']._loaded_options = None
  _globals['_DEFINITION_INTEGRATIONSENTRY']._serialized_options = b'8\001'
  _globals['_DEFINITION'].fields_by_name['api']._loaded_options = None
  _globals['_DEFINITION'].fields_by_name['api']._serialized_options = b'\372B\005\212\001\002\020\001\272H\003\310\001\001'
  _globals['_OUTPUTREQUEST'].fields_by_name['execution']._loaded_options = None
  _globals['_OUTPUTREQUEST'].fields_by_name['execution']._serialized_options = b'\372B\005r\003\260\001\001\272H\005r\003\260\001\001'
  _globals['_OUTPUTREQUEST'].fields_by_name['block']._loaded_options = None
  _globals['_OUTPUTREQUEST'].fields_by_name['block']._serialized_options = b'\372B\004r\002\020\001\272H\004r\002\020\001'
  _globals['_FUNCTION_REQUEST'].fields_by_name['id']._loaded_options = None
  _globals['_FUNCTION_REQUEST'].fields_by_name['id']._serialized_options = b'\272H\004r\002\020\001'
  _globals['_FUNCTION_RESPONSE'].fields_by_name['id']._loaded_options = None
  _globals['_FUNCTION_RESPONSE'].fields_by_name['id']._serialized_options = b'\272H\004r\002\020\001'
  _globals['_TWOWAYREQUEST'].oneofs_by_name['type']._loaded_options = None
  _globals['_TWOWAYREQUEST'].oneofs_by_name['type']._serialized_options = b'\272H\002\010\001'
  _globals['_TWOWAYRESPONSE'].oneofs_by_name['type']._loaded_options = None
  _globals['_TWOWAYRESPONSE'].oneofs_by_name['type']._serialized_options = b'\272H\002\010\001'
  _globals['_METADATASERVICE'].methods_by_name['Health']._loaded_options = None
  _globals['_METADATASERVICE'].methods_by_name['Health']._serialized_options = b'\222A\020*\016Service Health\202\323\344\223\002\t\022\007/health'
  _globals['_DEPRECATEDSERVICE'].methods_by_name['Workflow']._loaded_options = None
  _globals['_DEPRECATEDSERVICE'].methods_by_name['Workflow']._serialized_options = b'\222A\031*\027Sync Workflow Execution\202\323\344\223\002F\"\032/v1/workflows/{fetch.id=*}:\001*Z%\" /agent/v1/workflows/{fetch.id=*}:\001*'
  _globals['_EXECUTORSERVICE'].methods_by_name['Await']._loaded_options = None
  _globals['_EXECUTORSERVICE'].methods_by_name['Await']._serialized_options = b'\222A\020\022\016Execute an API\202\323\344\223\002/\"\013/v2/execute:\001*Z\035\"\030/v2/execute/{fetch.id=*}:\001*'
  _globals['_EXECUTORSERVICE'].methods_by_name['TwoWayStream']._loaded_options = None
  _globals['_EXECUTORSERVICE'].methods_by_name['TwoWayStream']._serialized_options = b'\222A\023*\021Two Way Execution\202\323\344\223\002\027\"\022/v2/execute/twoway:\001*'
  _globals['_EXECUTORSERVICE'].methods_by_name['MetadataDeprecated']._loaded_options = None
  _globals['_EXECUTORSERVICE'].methods_by_name['MetadataDeprecated']._serialized_options = b'\222A\026*\024Integration Metadata\202\323\344\223\002\016\022\014/v2/metadata'
  _globals['_EXECUTORSERVICE'].methods_by_name['Metadata']._loaded_options = None
  _globals['_EXECUTORSERVICE'].methods_by_name['Metadata']._serialized_options = b'\222A\026*\024Integration Metadata\202\323\344\223\002\021\"\014/v2/metadata:\001*'
  _globals['_EXECUTORSERVICE'].methods_by_name['Test']._loaded_options = None
  _globals['_EXECUTORSERVICE'].methods_by_name['Test']._serialized_options = b'\222A\035*\033Integration Connection Test\202\323\344\223\002\r\"\010/v2/test:\001*'
  _globals['_EXECUTORSERVICE'].methods_by_name['Delete']._loaded_options = None
  _globals['_EXECUTORSERVICE'].methods_by_name['Delete']._serialized_options = b'\222A\031*\027Delete Integration Hook\202\323\344\223\002\017\"\n/v2/delete:\001*'
  _globals['_EXECUTORSERVICE'].methods_by_name['Async']._loaded_options = None
  _globals['_EXECUTORSERVICE'].methods_by_name['Async']._serialized_options = b'\222A\021*\017Async Execution\202\323\344\223\002\026\"\021/v2/execute/async:\001*'
  _globals['_EXECUTORSERVICE'].methods_by_name['Stream']._loaded_options = None
  _globals['_EXECUTORSERVICE'].methods_by_name['Stream']._serialized_options = b'\222A\022*\020Stream Execution\202\323\344\223\002=\"\022/v2/execute/stream:\001*Z$\"\037/v2/execute/stream/{fetch.id=*}:\001*'
  _globals['_EXECUTORSERVICE'].methods_by_name['Status']._loaded_options = None
  _globals['_EXECUTORSERVICE'].methods_by_name['Status']._serialized_options = b'\222A\022*\020Execution Status\202\323\344\223\002\014\022\n/v2/status'
  _globals['_EXECUTORSERVICE'].methods_by_name['Output']._loaded_options = None
  _globals['_EXECUTORSERVICE'].methods_by_name['Output']._serialized_options = b'\222A\016*\014Block Output\202\323\344\223\002\014\022\n/v2/output'
  _globals['_EXECUTORSERVICE'].methods_by_name['Download']._loaded_options = None
  _globals['_EXECUTORSERVICE'].methods_by_name['Download']._serialized_options = b'\222A\017*\rDownload File\202\323\344\223\002\013\022\t/v2/files'
  _globals['_EXECUTORSERVICE'].methods_by_name['Cancel']._loaded_options = None
  _globals['_EXECUTORSERVICE'].methods_by_name['Cancel']._serialized_options = b'\222A\033*\031Cancel an API\'s Execution\202\323\344\223\002\014\"\n/v2/cancel'
  _globals['_EXECUTORSERVICE'].methods_by_name['Validate']._loaded_options = None
  _globals['_EXECUTORSERVICE'].methods_by_name['Validate']._serialized_options = b'\222A\037*\035Validate an API specification\202\323\344\223\002\021\"\014/v2/validate:\001*'
  _globals['_VIEWMODE']._serialized_start=6773
  _globals['_VIEWMODE']._serialized_end=6877
  _globals['_HEALTHREQUEST']._serialized_start=450
  _globals['_HEALTHREQUEST']._serialized_end=493
  _globals['_VALIDATEREQUEST']._serialized_start=495
  _globals['_VALIDATEREQUEST']._serialized_end=543
  _globals['_EXECUTEREQUEST']._serialized_start=546
  _globals['_EXECUTEREQUEST']._serialized_end=1757
  _globals['_EXECUTEREQUEST_OPTIONS']._serialized_start=924
  _globals['_EXECUTEREQUEST_OPTIONS']._serialized_end=1216
  _globals['_EXECUTEREQUEST_FETCH']._serialized_start=1219
  _globals['_EXECUTEREQUEST_FETCH']._serialized_end=1508
  _globals['_EXECUTEREQUEST_INPUTSENTRY']._serialized_start=1510
  _globals['_EXECUTEREQUEST_INPUTSENTRY']._serialized_end=1591
  _globals['_EXECUTEREQUEST_FILE']._serialized_start=1594
  _globals['_EXECUTEREQUEST_FILE']._serialized_end=1736
  _globals['_DEFINITION']._serialized_start=1760
  _globals['_DEFINITION']._serialized_end=2325
  _globals['_DEFINITION_METADATA']._serialized_start=1995
  _globals['_DEFINITION_METADATA']._serialized_end=2235
  _globals['_DEFINITION_INTEGRATIONSENTRY']._serialized_start=2237
  _globals['_DEFINITION_INTEGRATIONSENTRY']._serialized_end=2325
  _globals['_STATUSREQUEST']._serialized_start=2327
  _globals['_STATUSREQUEST']._serialized_end=2372
  _globals['_AWAITRESPONSE']._serialized_start=2375
  _globals['_AWAITRESPONSE']._serialized_end=2728
  _globals['_AWAITRESPONSE_STATUS']._serialized_start=2652
  _globals['_AWAITRESPONSE_STATUS']._serialized_end=2728
  _globals['_ASYNCRESPONSE']._serialized_start=2730
  _globals['_ASYNCRESPONSE']._serialized_end=2815
  _globals['_STREAMRESPONSE']._serialized_start=2817
  _globals['_STREAMRESPONSE']._serialized_end=2900
  _globals['_OUTPUTREQUEST']._serialized_start=2902
  _globals['_OUTPUTREQUEST']._serialized_end=3003
  _globals['_OUTPUTRESPONSE']._serialized_start=3006
  _globals['_OUTPUTRESPONSE']._serialized_end=3151
  _globals['_CANCELREQUEST']._serialized_start=3153
  _globals['_CANCELREQUEST']._serialized_end=3198
  _globals['_CANCELRESPONSE']._serialized_start=3200
  _globals['_CANCELRESPONSE']._serialized_end=3256
  _globals['_TESTREQUEST']._serialized_start=3259
  _globals['_TESTREQUEST']._serialized_end=3559
  _globals['_TESTRESPONSE']._serialized_start=3561
  _globals['_TESTRESPONSE']._serialized_end=3575
  _globals['_DELETEREQUEST']._serialized_start=3578
  _globals['_DELETEREQUEST']._serialized_end=3749
  _globals['_DELETERESPONSE']._serialized_start=3751
  _globals['_DELETERESPONSE']._serialized_end=3767
  _globals['_FUNCTION']._serialized_start=3770
  _globals['_FUNCTION']._serialized_end=4015
  _globals['_FUNCTION_REQUEST']._serialized_start=3782
  _globals['_FUNCTION_REQUEST']._serialized_end=3892
  _globals['_FUNCTION_RESPONSE']._serialized_start=3894
  _globals['_FUNCTION_RESPONSE']._serialized_end=4015
  _globals['_TWOWAYREQUEST']._serialized_start=4018
  _globals['_TWOWAYREQUEST']._serialized_end=4157
  _globals['_TWOWAYRESPONSE']._serialized_start=4160
  _globals['_TWOWAYRESPONSE']._serialized_end=4297
  _globals['_MOCK']._serialized_start=4300
  _globals['_MOCK']._serialized_end=4782
  _globals['_MOCK_PARAMS']._serialized_start=4387
  _globals['_MOCK_PARAMS']._serialized_end=4576
  _globals['_MOCK_ON']._serialized_start=4578
  _globals['_MOCK_ON']._serialized_end=4686
  _globals['_MOCK_RETURN']._serialized_start=4688
  _globals['_MOCK_RETURN']._serialized_end=4782
  _globals['_METADATAREQUESTDEPRECATED']._serialized_start=4785
  _globals['_METADATAREQUESTDEPRECATED']._serialized_end=4915
  _globals['_METADATAREQUEST']._serialized_start=4918
  _globals['_METADATAREQUEST']._serialized_end=5087
  _globals['_METADATARESPONSE']._serialized_start=5090
  _globals['_METADATARESPONSE']._serialized_end=6451
  _globals['_METADATARESPONSE_DATABASESCHEMAMETADATA']._serialized_start=5539
  _globals['_METADATARESPONSE_DATABASESCHEMAMETADATA']._serialized_end=6315
  _globals['_METADATARESPONSE_DATABASESCHEMAMETADATA_COLUMN']._serialized_start=5726
  _globals['_METADATARESPONSE_DATABASESCHEMAMETADATA_COLUMN']._serialized_end=5809
  _globals['_METADATARESPONSE_DATABASESCHEMAMETADATA_KEY']._serialized_start=5811
  _globals['_METADATARESPONSE_DATABASESCHEMAMETADATA_KEY']._serialized_end=5882
  _globals['_METADATARESPONSE_DATABASESCHEMAMETADATA_TEMPLATE']._serialized_start=5884
  _globals['_METADATARESPONSE_DATABASESCHEMAMETADATA_TEMPLATE']._serialized_end=5936
  _globals['_METADATARESPONSE_DATABASESCHEMAMETADATA_TABLE']._serialized_start=5939
  _globals['_METADATARESPONSE_DATABASESCHEMAMETADATA_TABLE']._serialized_end=6269
  _globals['_METADATARESPONSE_DATABASESCHEMAMETADATA_SCHEMA']._serialized_start=6271
  _globals['_METADATARESPONSE_DATABASESCHEMAMETADATA_SCHEMA']._serialized_end=6315
  _globals['_METADATARESPONSE_BUCKETMETADATA']._serialized_start=6317
  _globals['_METADATARESPONSE_BUCKETMETADATA']._serialized_end=6353
  _globals['_METADATARESPONSE_BUCKETSMETADATA']._serialized_start=6355
  _globals['_METADATARESPONSE_BUCKETSMETADATA']._serialized_end=6439
  _globals['_DOWNLOADREQUEST']._serialized_start=6453
  _globals['_DOWNLOADREQUEST']._serialized_end=6498
  _globals['_DOWNLOADRESPONSE']._serialized_start=6500
  _globals['_DOWNLOADRESPONSE']._serialized_end=6538
  _globals['_WORKFLOWRESPONSE']._serialized_start=6541
  _globals['_WORKFLOWRESPONSE']._serialized_end=6771
  _globals['_WORKFLOWRESPONSE_RESPONSEMETA']._serialized_start=6681
  _globals['_WORKFLOWRESPONSE_RESPONSEMETA']._serialized_end=6771
  _globals['_METADATASERVICE']._serialized_start=6879
  _globals['_METADATASERVICE']._serialized_end=6992
  _globals['_DEPRECATEDSERVICE']._serialized_start=6995
  _globals['_DEPRECATEDSERVICE']._serialized_end=7183
  _globals['_EXECUTORSERVICE']._serialized_start=7186
  _globals['_EXECUTORSERVICE']._serialized_end=8687
# @@protoc_insertion_point(module_scope)