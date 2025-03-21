// Code generated by protoc-gen-go. DO NOT EDIT.
// versions:
// 	protoc-gen-go v1.32.0
// 	protoc        (unknown)
// source: plugins/databricks/v1/plugin.proto

package v1

import (
	v1 "github.com/superblocksteam/agent/types/gen/go/plugins/common/v1"
	protoreflect "google.golang.org/protobuf/reflect/protoreflect"
	protoimpl "google.golang.org/protobuf/runtime/protoimpl"
	reflect "reflect"
	sync "sync"
)

const (
	// Verify that this generated code is sufficiently up-to-date.
	_ = protoimpl.EnforceVersion(20 - protoimpl.MinVersion)
	// Verify that runtime/protoimpl is sufficiently up-to-date.
	_ = protoimpl.EnforceVersion(protoimpl.MaxVersion - 20)
)

type Plugin_ConnectionType int32

const (
	Plugin_CONNECTION_TYPE_UNSPECIFIED Plugin_ConnectionType = 0
	// PERSONAL ACCESS TOKEN
	// https://docs.databricks.com/en/dev-tools/nodejs-sql-driver.html#databricks-personal-access-token-authentication
	Plugin_CONNECTION_TYPE_PAT Plugin_ConnectionType = 1
	// MACHINE TO MACHINE
	// https://docs.databricks.com/en/dev-tools/nodejs-sql-driver.html#oauth-machine-to-machine-m2m-authentication
	Plugin_CONNECTION_TYPE_M2M Plugin_ConnectionType = 2
)

// Enum value maps for Plugin_ConnectionType.
var (
	Plugin_ConnectionType_name = map[int32]string{
		0: "CONNECTION_TYPE_UNSPECIFIED",
		1: "CONNECTION_TYPE_PAT",
		2: "CONNECTION_TYPE_M2M",
	}
	Plugin_ConnectionType_value = map[string]int32{
		"CONNECTION_TYPE_UNSPECIFIED": 0,
		"CONNECTION_TYPE_PAT":         1,
		"CONNECTION_TYPE_M2M":         2,
	}
)

func (x Plugin_ConnectionType) Enum() *Plugin_ConnectionType {
	p := new(Plugin_ConnectionType)
	*p = x
	return p
}

func (x Plugin_ConnectionType) String() string {
	return protoimpl.X.EnumStringOf(x.Descriptor(), protoreflect.EnumNumber(x))
}

func (Plugin_ConnectionType) Descriptor() protoreflect.EnumDescriptor {
	return file_plugins_databricks_v1_plugin_proto_enumTypes[0].Descriptor()
}

func (Plugin_ConnectionType) Type() protoreflect.EnumType {
	return &file_plugins_databricks_v1_plugin_proto_enumTypes[0]
}

func (x Plugin_ConnectionType) Number() protoreflect.EnumNumber {
	return protoreflect.EnumNumber(x)
}

// Deprecated: Use Plugin_ConnectionType.Descriptor instead.
func (Plugin_ConnectionType) EnumDescriptor() ([]byte, []int) {
	return file_plugins_databricks_v1_plugin_proto_rawDescGZIP(), []int{0, 0}
}

type Plugin struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Name                         string                           `protobuf:"bytes,1,opt,name=name,proto3" json:"name,omitempty"`
	Connection                   *Plugin_DatabricksConnection     `protobuf:"bytes,2,opt,name=connection,proto3" json:"connection,omitempty"`
	Operation                    v1.SQLOperation                  `protobuf:"varint,3,opt,name=operation,proto3,enum=plugins.common.v1.SQLOperation" json:"operation,omitempty"`
	RunSql                       *v1.SQLExecution                 `protobuf:"bytes,4,opt,name=run_sql,json=runSql,proto3" json:"run_sql,omitempty"`
	BulkEdit                     *v1.SQLBulkEdit                  `protobuf:"bytes,5,opt,name=bulk_edit,json=bulkEdit,proto3" json:"bulk_edit,omitempty"`
	DynamicWorkflowConfiguration *v1.DynamicWorkflowConfiguration `protobuf:"bytes,6,opt,name=dynamic_workflow_configuration,json=dynamicWorkflowConfiguration,proto3,oneof" json:"dynamic_workflow_configuration,omitempty"`
}

func (x *Plugin) Reset() {
	*x = Plugin{}
	if protoimpl.UnsafeEnabled {
		mi := &file_plugins_databricks_v1_plugin_proto_msgTypes[0]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *Plugin) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*Plugin) ProtoMessage() {}

func (x *Plugin) ProtoReflect() protoreflect.Message {
	mi := &file_plugins_databricks_v1_plugin_proto_msgTypes[0]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use Plugin.ProtoReflect.Descriptor instead.
func (*Plugin) Descriptor() ([]byte, []int) {
	return file_plugins_databricks_v1_plugin_proto_rawDescGZIP(), []int{0}
}

func (x *Plugin) GetName() string {
	if x != nil {
		return x.Name
	}
	return ""
}

func (x *Plugin) GetConnection() *Plugin_DatabricksConnection {
	if x != nil {
		return x.Connection
	}
	return nil
}

func (x *Plugin) GetOperation() v1.SQLOperation {
	if x != nil {
		return x.Operation
	}
	return v1.SQLOperation(0)
}

func (x *Plugin) GetRunSql() *v1.SQLExecution {
	if x != nil {
		return x.RunSql
	}
	return nil
}

func (x *Plugin) GetBulkEdit() *v1.SQLBulkEdit {
	if x != nil {
		return x.BulkEdit
	}
	return nil
}

func (x *Plugin) GetDynamicWorkflowConfiguration() *v1.DynamicWorkflowConfiguration {
	if x != nil {
		return x.DynamicWorkflowConfiguration
	}
	return nil
}

type Plugin_DatabricksConnection struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	DefaultCatalog *string                `protobuf:"bytes,1,opt,name=default_catalog,json=defaultCatalog,proto3,oneof" json:"default_catalog,omitempty"`
	DefaultSchema  *string                `protobuf:"bytes,2,opt,name=default_schema,json=defaultSchema,proto3,oneof" json:"default_schema,omitempty"`
	HostUrl        string                 `protobuf:"bytes,3,opt,name=host_url,json=hostUrl,proto3" json:"host_url,omitempty"`
	Path           string                 `protobuf:"bytes,4,opt,name=path,proto3" json:"path,omitempty"`
	Port           int32                  `protobuf:"varint,5,opt,name=port,proto3" json:"port,omitempty"`
	ConnectionType *Plugin_ConnectionType `protobuf:"varint,7,opt,name=connection_type,json=connectionType,proto3,enum=plugins.databricks.v1.Plugin_ConnectionType,oneof" json:"connection_type,omitempty"`
	// PAT
	Token *string `protobuf:"bytes,6,opt,name=token,proto3,oneof" json:"token,omitempty"`
	// M2M
	OauthClientId     *string `protobuf:"bytes,8,opt,name=oauth_client_id,json=oauthClientId,proto3,oneof" json:"oauth_client_id,omitempty"`
	OauthClientSecret *string `protobuf:"bytes,9,opt,name=oauth_client_secret,json=oauthClientSecret,proto3,oneof" json:"oauth_client_secret,omitempty"`
}

func (x *Plugin_DatabricksConnection) Reset() {
	*x = Plugin_DatabricksConnection{}
	if protoimpl.UnsafeEnabled {
		mi := &file_plugins_databricks_v1_plugin_proto_msgTypes[1]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *Plugin_DatabricksConnection) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*Plugin_DatabricksConnection) ProtoMessage() {}

func (x *Plugin_DatabricksConnection) ProtoReflect() protoreflect.Message {
	mi := &file_plugins_databricks_v1_plugin_proto_msgTypes[1]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use Plugin_DatabricksConnection.ProtoReflect.Descriptor instead.
func (*Plugin_DatabricksConnection) Descriptor() ([]byte, []int) {
	return file_plugins_databricks_v1_plugin_proto_rawDescGZIP(), []int{0, 0}
}

func (x *Plugin_DatabricksConnection) GetDefaultCatalog() string {
	if x != nil && x.DefaultCatalog != nil {
		return *x.DefaultCatalog
	}
	return ""
}

func (x *Plugin_DatabricksConnection) GetDefaultSchema() string {
	if x != nil && x.DefaultSchema != nil {
		return *x.DefaultSchema
	}
	return ""
}

func (x *Plugin_DatabricksConnection) GetHostUrl() string {
	if x != nil {
		return x.HostUrl
	}
	return ""
}

func (x *Plugin_DatabricksConnection) GetPath() string {
	if x != nil {
		return x.Path
	}
	return ""
}

func (x *Plugin_DatabricksConnection) GetPort() int32 {
	if x != nil {
		return x.Port
	}
	return 0
}

func (x *Plugin_DatabricksConnection) GetConnectionType() Plugin_ConnectionType {
	if x != nil && x.ConnectionType != nil {
		return *x.ConnectionType
	}
	return Plugin_CONNECTION_TYPE_UNSPECIFIED
}

func (x *Plugin_DatabricksConnection) GetToken() string {
	if x != nil && x.Token != nil {
		return *x.Token
	}
	return ""
}

func (x *Plugin_DatabricksConnection) GetOauthClientId() string {
	if x != nil && x.OauthClientId != nil {
		return *x.OauthClientId
	}
	return ""
}

func (x *Plugin_DatabricksConnection) GetOauthClientSecret() string {
	if x != nil && x.OauthClientSecret != nil {
		return *x.OauthClientSecret
	}
	return ""
}

var File_plugins_databricks_v1_plugin_proto protoreflect.FileDescriptor

var file_plugins_databricks_v1_plugin_proto_rawDesc = []byte{
	0x0a, 0x22, 0x70, 0x6c, 0x75, 0x67, 0x69, 0x6e, 0x73, 0x2f, 0x64, 0x61, 0x74, 0x61, 0x62, 0x72,
	0x69, 0x63, 0x6b, 0x73, 0x2f, 0x76, 0x31, 0x2f, 0x70, 0x6c, 0x75, 0x67, 0x69, 0x6e, 0x2e, 0x70,
	0x72, 0x6f, 0x74, 0x6f, 0x12, 0x15, 0x70, 0x6c, 0x75, 0x67, 0x69, 0x6e, 0x73, 0x2e, 0x64, 0x61,
	0x74, 0x61, 0x62, 0x72, 0x69, 0x63, 0x6b, 0x73, 0x2e, 0x76, 0x31, 0x1a, 0x1e, 0x70, 0x6c, 0x75,
	0x67, 0x69, 0x6e, 0x73, 0x2f, 0x63, 0x6f, 0x6d, 0x6d, 0x6f, 0x6e, 0x2f, 0x76, 0x31, 0x2f, 0x70,
	0x6c, 0x75, 0x67, 0x69, 0x6e, 0x2e, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x22, 0xaa, 0x08, 0x0a, 0x06,
	0x50, 0x6c, 0x75, 0x67, 0x69, 0x6e, 0x12, 0x12, 0x0a, 0x04, 0x6e, 0x61, 0x6d, 0x65, 0x18, 0x01,
	0x20, 0x01, 0x28, 0x09, 0x52, 0x04, 0x6e, 0x61, 0x6d, 0x65, 0x12, 0x52, 0x0a, 0x0a, 0x63, 0x6f,
	0x6e, 0x6e, 0x65, 0x63, 0x74, 0x69, 0x6f, 0x6e, 0x18, 0x02, 0x20, 0x01, 0x28, 0x0b, 0x32, 0x32,
	0x2e, 0x70, 0x6c, 0x75, 0x67, 0x69, 0x6e, 0x73, 0x2e, 0x64, 0x61, 0x74, 0x61, 0x62, 0x72, 0x69,
	0x63, 0x6b, 0x73, 0x2e, 0x76, 0x31, 0x2e, 0x50, 0x6c, 0x75, 0x67, 0x69, 0x6e, 0x2e, 0x44, 0x61,
	0x74, 0x61, 0x62, 0x72, 0x69, 0x63, 0x6b, 0x73, 0x43, 0x6f, 0x6e, 0x6e, 0x65, 0x63, 0x74, 0x69,
	0x6f, 0x6e, 0x52, 0x0a, 0x63, 0x6f, 0x6e, 0x6e, 0x65, 0x63, 0x74, 0x69, 0x6f, 0x6e, 0x12, 0x3d,
	0x0a, 0x09, 0x6f, 0x70, 0x65, 0x72, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x18, 0x03, 0x20, 0x01, 0x28,
	0x0e, 0x32, 0x1f, 0x2e, 0x70, 0x6c, 0x75, 0x67, 0x69, 0x6e, 0x73, 0x2e, 0x63, 0x6f, 0x6d, 0x6d,
	0x6f, 0x6e, 0x2e, 0x76, 0x31, 0x2e, 0x53, 0x51, 0x4c, 0x4f, 0x70, 0x65, 0x72, 0x61, 0x74, 0x69,
	0x6f, 0x6e, 0x52, 0x09, 0x6f, 0x70, 0x65, 0x72, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x12, 0x38, 0x0a,
	0x07, 0x72, 0x75, 0x6e, 0x5f, 0x73, 0x71, 0x6c, 0x18, 0x04, 0x20, 0x01, 0x28, 0x0b, 0x32, 0x1f,
	0x2e, 0x70, 0x6c, 0x75, 0x67, 0x69, 0x6e, 0x73, 0x2e, 0x63, 0x6f, 0x6d, 0x6d, 0x6f, 0x6e, 0x2e,
	0x76, 0x31, 0x2e, 0x53, 0x51, 0x4c, 0x45, 0x78, 0x65, 0x63, 0x75, 0x74, 0x69, 0x6f, 0x6e, 0x52,
	0x06, 0x72, 0x75, 0x6e, 0x53, 0x71, 0x6c, 0x12, 0x3b, 0x0a, 0x09, 0x62, 0x75, 0x6c, 0x6b, 0x5f,
	0x65, 0x64, 0x69, 0x74, 0x18, 0x05, 0x20, 0x01, 0x28, 0x0b, 0x32, 0x1e, 0x2e, 0x70, 0x6c, 0x75,
	0x67, 0x69, 0x6e, 0x73, 0x2e, 0x63, 0x6f, 0x6d, 0x6d, 0x6f, 0x6e, 0x2e, 0x76, 0x31, 0x2e, 0x53,
	0x51, 0x4c, 0x42, 0x75, 0x6c, 0x6b, 0x45, 0x64, 0x69, 0x74, 0x52, 0x08, 0x62, 0x75, 0x6c, 0x6b,
	0x45, 0x64, 0x69, 0x74, 0x12, 0x7a, 0x0a, 0x1e, 0x64, 0x79, 0x6e, 0x61, 0x6d, 0x69, 0x63, 0x5f,
	0x77, 0x6f, 0x72, 0x6b, 0x66, 0x6c, 0x6f, 0x77, 0x5f, 0x63, 0x6f, 0x6e, 0x66, 0x69, 0x67, 0x75,
	0x72, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x18, 0x06, 0x20, 0x01, 0x28, 0x0b, 0x32, 0x2f, 0x2e, 0x70,
	0x6c, 0x75, 0x67, 0x69, 0x6e, 0x73, 0x2e, 0x63, 0x6f, 0x6d, 0x6d, 0x6f, 0x6e, 0x2e, 0x76, 0x31,
	0x2e, 0x44, 0x79, 0x6e, 0x61, 0x6d, 0x69, 0x63, 0x57, 0x6f, 0x72, 0x6b, 0x66, 0x6c, 0x6f, 0x77,
	0x43, 0x6f, 0x6e, 0x66, 0x69, 0x67, 0x75, 0x72, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x48, 0x00, 0x52,
	0x1c, 0x64, 0x79, 0x6e, 0x61, 0x6d, 0x69, 0x63, 0x57, 0x6f, 0x72, 0x6b, 0x66, 0x6c, 0x6f, 0x77,
	0x43, 0x6f, 0x6e, 0x66, 0x69, 0x67, 0x75, 0x72, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x88, 0x01, 0x01,
	0x1a, 0xfd, 0x03, 0x0a, 0x14, 0x44, 0x61, 0x74, 0x61, 0x62, 0x72, 0x69, 0x63, 0x6b, 0x73, 0x43,
	0x6f, 0x6e, 0x6e, 0x65, 0x63, 0x74, 0x69, 0x6f, 0x6e, 0x12, 0x2c, 0x0a, 0x0f, 0x64, 0x65, 0x66,
	0x61, 0x75, 0x6c, 0x74, 0x5f, 0x63, 0x61, 0x74, 0x61, 0x6c, 0x6f, 0x67, 0x18, 0x01, 0x20, 0x01,
	0x28, 0x09, 0x48, 0x00, 0x52, 0x0e, 0x64, 0x65, 0x66, 0x61, 0x75, 0x6c, 0x74, 0x43, 0x61, 0x74,
	0x61, 0x6c, 0x6f, 0x67, 0x88, 0x01, 0x01, 0x12, 0x2a, 0x0a, 0x0e, 0x64, 0x65, 0x66, 0x61, 0x75,
	0x6c, 0x74, 0x5f, 0x73, 0x63, 0x68, 0x65, 0x6d, 0x61, 0x18, 0x02, 0x20, 0x01, 0x28, 0x09, 0x48,
	0x01, 0x52, 0x0d, 0x64, 0x65, 0x66, 0x61, 0x75, 0x6c, 0x74, 0x53, 0x63, 0x68, 0x65, 0x6d, 0x61,
	0x88, 0x01, 0x01, 0x12, 0x19, 0x0a, 0x08, 0x68, 0x6f, 0x73, 0x74, 0x5f, 0x75, 0x72, 0x6c, 0x18,
	0x03, 0x20, 0x01, 0x28, 0x09, 0x52, 0x07, 0x68, 0x6f, 0x73, 0x74, 0x55, 0x72, 0x6c, 0x12, 0x12,
	0x0a, 0x04, 0x70, 0x61, 0x74, 0x68, 0x18, 0x04, 0x20, 0x01, 0x28, 0x09, 0x52, 0x04, 0x70, 0x61,
	0x74, 0x68, 0x12, 0x12, 0x0a, 0x04, 0x70, 0x6f, 0x72, 0x74, 0x18, 0x05, 0x20, 0x01, 0x28, 0x05,
	0x52, 0x04, 0x70, 0x6f, 0x72, 0x74, 0x12, 0x5a, 0x0a, 0x0f, 0x63, 0x6f, 0x6e, 0x6e, 0x65, 0x63,
	0x74, 0x69, 0x6f, 0x6e, 0x5f, 0x74, 0x79, 0x70, 0x65, 0x18, 0x07, 0x20, 0x01, 0x28, 0x0e, 0x32,
	0x2c, 0x2e, 0x70, 0x6c, 0x75, 0x67, 0x69, 0x6e, 0x73, 0x2e, 0x64, 0x61, 0x74, 0x61, 0x62, 0x72,
	0x69, 0x63, 0x6b, 0x73, 0x2e, 0x76, 0x31, 0x2e, 0x50, 0x6c, 0x75, 0x67, 0x69, 0x6e, 0x2e, 0x43,
	0x6f, 0x6e, 0x6e, 0x65, 0x63, 0x74, 0x69, 0x6f, 0x6e, 0x54, 0x79, 0x70, 0x65, 0x48, 0x02, 0x52,
	0x0e, 0x63, 0x6f, 0x6e, 0x6e, 0x65, 0x63, 0x74, 0x69, 0x6f, 0x6e, 0x54, 0x79, 0x70, 0x65, 0x88,
	0x01, 0x01, 0x12, 0x19, 0x0a, 0x05, 0x74, 0x6f, 0x6b, 0x65, 0x6e, 0x18, 0x06, 0x20, 0x01, 0x28,
	0x09, 0x48, 0x03, 0x52, 0x05, 0x74, 0x6f, 0x6b, 0x65, 0x6e, 0x88, 0x01, 0x01, 0x12, 0x2b, 0x0a,
	0x0f, 0x6f, 0x61, 0x75, 0x74, 0x68, 0x5f, 0x63, 0x6c, 0x69, 0x65, 0x6e, 0x74, 0x5f, 0x69, 0x64,
	0x18, 0x08, 0x20, 0x01, 0x28, 0x09, 0x48, 0x04, 0x52, 0x0d, 0x6f, 0x61, 0x75, 0x74, 0x68, 0x43,
	0x6c, 0x69, 0x65, 0x6e, 0x74, 0x49, 0x64, 0x88, 0x01, 0x01, 0x12, 0x33, 0x0a, 0x13, 0x6f, 0x61,
	0x75, 0x74, 0x68, 0x5f, 0x63, 0x6c, 0x69, 0x65, 0x6e, 0x74, 0x5f, 0x73, 0x65, 0x63, 0x72, 0x65,
	0x74, 0x18, 0x09, 0x20, 0x01, 0x28, 0x09, 0x48, 0x05, 0x52, 0x11, 0x6f, 0x61, 0x75, 0x74, 0x68,
	0x43, 0x6c, 0x69, 0x65, 0x6e, 0x74, 0x53, 0x65, 0x63, 0x72, 0x65, 0x74, 0x88, 0x01, 0x01, 0x42,
	0x12, 0x0a, 0x10, 0x5f, 0x64, 0x65, 0x66, 0x61, 0x75, 0x6c, 0x74, 0x5f, 0x63, 0x61, 0x74, 0x61,
	0x6c, 0x6f, 0x67, 0x42, 0x11, 0x0a, 0x0f, 0x5f, 0x64, 0x65, 0x66, 0x61, 0x75, 0x6c, 0x74, 0x5f,
	0x73, 0x63, 0x68, 0x65, 0x6d, 0x61, 0x42, 0x12, 0x0a, 0x10, 0x5f, 0x63, 0x6f, 0x6e, 0x6e, 0x65,
	0x63, 0x74, 0x69, 0x6f, 0x6e, 0x5f, 0x74, 0x79, 0x70, 0x65, 0x42, 0x08, 0x0a, 0x06, 0x5f, 0x74,
	0x6f, 0x6b, 0x65, 0x6e, 0x42, 0x12, 0x0a, 0x10, 0x5f, 0x6f, 0x61, 0x75, 0x74, 0x68, 0x5f, 0x63,
	0x6c, 0x69, 0x65, 0x6e, 0x74, 0x5f, 0x69, 0x64, 0x42, 0x16, 0x0a, 0x14, 0x5f, 0x6f, 0x61, 0x75,
	0x74, 0x68, 0x5f, 0x63, 0x6c, 0x69, 0x65, 0x6e, 0x74, 0x5f, 0x73, 0x65, 0x63, 0x72, 0x65, 0x74,
	0x22, 0x63, 0x0a, 0x0e, 0x43, 0x6f, 0x6e, 0x6e, 0x65, 0x63, 0x74, 0x69, 0x6f, 0x6e, 0x54, 0x79,
	0x70, 0x65, 0x12, 0x1f, 0x0a, 0x1b, 0x43, 0x4f, 0x4e, 0x4e, 0x45, 0x43, 0x54, 0x49, 0x4f, 0x4e,
	0x5f, 0x54, 0x59, 0x50, 0x45, 0x5f, 0x55, 0x4e, 0x53, 0x50, 0x45, 0x43, 0x49, 0x46, 0x49, 0x45,
	0x44, 0x10, 0x00, 0x12, 0x17, 0x0a, 0x13, 0x43, 0x4f, 0x4e, 0x4e, 0x45, 0x43, 0x54, 0x49, 0x4f,
	0x4e, 0x5f, 0x54, 0x59, 0x50, 0x45, 0x5f, 0x50, 0x41, 0x54, 0x10, 0x01, 0x12, 0x17, 0x0a, 0x13,
	0x43, 0x4f, 0x4e, 0x4e, 0x45, 0x43, 0x54, 0x49, 0x4f, 0x4e, 0x5f, 0x54, 0x59, 0x50, 0x45, 0x5f,
	0x4d, 0x32, 0x4d, 0x10, 0x02, 0x42, 0x21, 0x0a, 0x1f, 0x5f, 0x64, 0x79, 0x6e, 0x61, 0x6d, 0x69,
	0x63, 0x5f, 0x77, 0x6f, 0x72, 0x6b, 0x66, 0x6c, 0x6f, 0x77, 0x5f, 0x63, 0x6f, 0x6e, 0x66, 0x69,
	0x67, 0x75, 0x72, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x42, 0x45, 0x5a, 0x43, 0x67, 0x69, 0x74, 0x68,
	0x75, 0x62, 0x2e, 0x63, 0x6f, 0x6d, 0x2f, 0x73, 0x75, 0x70, 0x65, 0x72, 0x62, 0x6c, 0x6f, 0x63,
	0x6b, 0x73, 0x74, 0x65, 0x61, 0x6d, 0x2f, 0x61, 0x67, 0x65, 0x6e, 0x74, 0x2f, 0x74, 0x79, 0x70,
	0x65, 0x73, 0x2f, 0x67, 0x65, 0x6e, 0x2f, 0x67, 0x6f, 0x2f, 0x70, 0x6c, 0x75, 0x67, 0x69, 0x6e,
	0x73, 0x2f, 0x64, 0x61, 0x74, 0x61, 0x62, 0x72, 0x69, 0x63, 0x6b, 0x73, 0x2f, 0x76, 0x31, 0x62,
	0x06, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x33,
}

var (
	file_plugins_databricks_v1_plugin_proto_rawDescOnce sync.Once
	file_plugins_databricks_v1_plugin_proto_rawDescData = file_plugins_databricks_v1_plugin_proto_rawDesc
)

func file_plugins_databricks_v1_plugin_proto_rawDescGZIP() []byte {
	file_plugins_databricks_v1_plugin_proto_rawDescOnce.Do(func() {
		file_plugins_databricks_v1_plugin_proto_rawDescData = protoimpl.X.CompressGZIP(file_plugins_databricks_v1_plugin_proto_rawDescData)
	})
	return file_plugins_databricks_v1_plugin_proto_rawDescData
}

var file_plugins_databricks_v1_plugin_proto_enumTypes = make([]protoimpl.EnumInfo, 1)
var file_plugins_databricks_v1_plugin_proto_msgTypes = make([]protoimpl.MessageInfo, 2)
var file_plugins_databricks_v1_plugin_proto_goTypes = []interface{}{
	(Plugin_ConnectionType)(0),              // 0: plugins.databricks.v1.Plugin.ConnectionType
	(*Plugin)(nil),                          // 1: plugins.databricks.v1.Plugin
	(*Plugin_DatabricksConnection)(nil),     // 2: plugins.databricks.v1.Plugin.DatabricksConnection
	(v1.SQLOperation)(0),                    // 3: plugins.common.v1.SQLOperation
	(*v1.SQLExecution)(nil),                 // 4: plugins.common.v1.SQLExecution
	(*v1.SQLBulkEdit)(nil),                  // 5: plugins.common.v1.SQLBulkEdit
	(*v1.DynamicWorkflowConfiguration)(nil), // 6: plugins.common.v1.DynamicWorkflowConfiguration
}
var file_plugins_databricks_v1_plugin_proto_depIdxs = []int32{
	2, // 0: plugins.databricks.v1.Plugin.connection:type_name -> plugins.databricks.v1.Plugin.DatabricksConnection
	3, // 1: plugins.databricks.v1.Plugin.operation:type_name -> plugins.common.v1.SQLOperation
	4, // 2: plugins.databricks.v1.Plugin.run_sql:type_name -> plugins.common.v1.SQLExecution
	5, // 3: plugins.databricks.v1.Plugin.bulk_edit:type_name -> plugins.common.v1.SQLBulkEdit
	6, // 4: plugins.databricks.v1.Plugin.dynamic_workflow_configuration:type_name -> plugins.common.v1.DynamicWorkflowConfiguration
	0, // 5: plugins.databricks.v1.Plugin.DatabricksConnection.connection_type:type_name -> plugins.databricks.v1.Plugin.ConnectionType
	6, // [6:6] is the sub-list for method output_type
	6, // [6:6] is the sub-list for method input_type
	6, // [6:6] is the sub-list for extension type_name
	6, // [6:6] is the sub-list for extension extendee
	0, // [0:6] is the sub-list for field type_name
}

func init() { file_plugins_databricks_v1_plugin_proto_init() }
func file_plugins_databricks_v1_plugin_proto_init() {
	if File_plugins_databricks_v1_plugin_proto != nil {
		return
	}
	if !protoimpl.UnsafeEnabled {
		file_plugins_databricks_v1_plugin_proto_msgTypes[0].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*Plugin); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_plugins_databricks_v1_plugin_proto_msgTypes[1].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*Plugin_DatabricksConnection); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
	}
	file_plugins_databricks_v1_plugin_proto_msgTypes[0].OneofWrappers = []interface{}{}
	file_plugins_databricks_v1_plugin_proto_msgTypes[1].OneofWrappers = []interface{}{}
	type x struct{}
	out := protoimpl.TypeBuilder{
		File: protoimpl.DescBuilder{
			GoPackagePath: reflect.TypeOf(x{}).PkgPath(),
			RawDescriptor: file_plugins_databricks_v1_plugin_proto_rawDesc,
			NumEnums:      1,
			NumMessages:   2,
			NumExtensions: 0,
			NumServices:   0,
		},
		GoTypes:           file_plugins_databricks_v1_plugin_proto_goTypes,
		DependencyIndexes: file_plugins_databricks_v1_plugin_proto_depIdxs,
		EnumInfos:         file_plugins_databricks_v1_plugin_proto_enumTypes,
		MessageInfos:      file_plugins_databricks_v1_plugin_proto_msgTypes,
	}.Build()
	File_plugins_databricks_v1_plugin_proto = out.File
	file_plugins_databricks_v1_plugin_proto_rawDesc = nil
	file_plugins_databricks_v1_plugin_proto_goTypes = nil
	file_plugins_databricks_v1_plugin_proto_depIdxs = nil
}
