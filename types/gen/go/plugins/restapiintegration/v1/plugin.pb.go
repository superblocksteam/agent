// Code generated by protoc-gen-go. DO NOT EDIT.
// versions:
// 	protoc-gen-go v1.32.0
// 	protoc        (unknown)
// source: plugins/restapiintegration/v1/plugin.proto

package v1

import (
	v1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
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

type Plugin struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	HttpMethod              string                  `protobuf:"bytes,1,opt,name=httpMethod,proto3" json:"httpMethod,omitempty"`
	ResponseType            string                  `protobuf:"bytes,2,opt,name=responseType,proto3" json:"responseType,omitempty"`
	Headers                 []*v1.Property          `protobuf:"bytes,3,rep,name=headers,proto3" json:"headers,omitempty"`
	Params                  []*v1.Property          `protobuf:"bytes,4,rep,name=params,proto3" json:"params,omitempty"`
	BodyType                string                  `protobuf:"bytes,5,opt,name=bodyType,proto3" json:"bodyType,omitempty"`
	Body                    string                  `protobuf:"bytes,6,opt,name=body,proto3" json:"body,omitempty"`
	JsonBody                string                  `protobuf:"bytes,7,opt,name=jsonBody,proto3" json:"jsonBody,omitempty"`
	FormData                []*v1.Property          `protobuf:"bytes,8,rep,name=formData,proto3" json:"formData,omitempty"`
	FileFormKey             string                  `protobuf:"bytes,9,opt,name=fileFormKey,proto3" json:"fileFormKey,omitempty"`
	FileName                string                  `protobuf:"bytes,10,opt,name=fileName,proto3" json:"fileName,omitempty"`
	UrlBase                 string                  `protobuf:"bytes,11,opt,name=urlBase,proto3" json:"urlBase,omitempty"`
	UrlPath                 string                  `protobuf:"bytes,12,opt,name=urlPath,proto3" json:"urlPath,omitempty"`
	AuthType                string                  `protobuf:"bytes,13,opt,name=authType,proto3" json:"authType,omitempty"`
	SuperblocksMetadata     *v1.SuperblocksMetadata `protobuf:"bytes,14,opt,name=superblocksMetadata,proto3" json:"superblocksMetadata,omitempty"`
	VerboseHttpOutput       bool                    `protobuf:"varint,18,opt,name=verboseHttpOutput,proto3" json:"verboseHttpOutput,omitempty"`             // Include HTTP response metadata in output
	DoNotFailOnRequestError bool                    `protobuf:"varint,19,opt,name=doNotFailOnRequestError,proto3" json:"doNotFailOnRequestError,omitempty"` // Do not fail executions on failed requests (4xx/5xx). We use the negative here to ensure the default (falsy) behavior matches the existing API behavior.
	// OpenAPI fields
	OpenApiAction     string  `protobuf:"bytes,15,opt,name=openApiAction,proto3" json:"openApiAction,omitempty"`
	OpenApiSpecRef    string  `protobuf:"bytes,16,opt,name=openApiSpecRef,proto3" json:"openApiSpecRef,omitempty"`
	OpenApiTenantName *string `protobuf:"bytes,17,opt,name=openApiTenantName,proto3,oneof" json:"openApiTenantName,omitempty"`
}

func (x *Plugin) Reset() {
	*x = Plugin{}
	if protoimpl.UnsafeEnabled {
		mi := &file_plugins_restapiintegration_v1_plugin_proto_msgTypes[0]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *Plugin) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*Plugin) ProtoMessage() {}

func (x *Plugin) ProtoReflect() protoreflect.Message {
	mi := &file_plugins_restapiintegration_v1_plugin_proto_msgTypes[0]
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
	return file_plugins_restapiintegration_v1_plugin_proto_rawDescGZIP(), []int{0}
}

func (x *Plugin) GetHttpMethod() string {
	if x != nil {
		return x.HttpMethod
	}
	return ""
}

func (x *Plugin) GetResponseType() string {
	if x != nil {
		return x.ResponseType
	}
	return ""
}

func (x *Plugin) GetHeaders() []*v1.Property {
	if x != nil {
		return x.Headers
	}
	return nil
}

func (x *Plugin) GetParams() []*v1.Property {
	if x != nil {
		return x.Params
	}
	return nil
}

func (x *Plugin) GetBodyType() string {
	if x != nil {
		return x.BodyType
	}
	return ""
}

func (x *Plugin) GetBody() string {
	if x != nil {
		return x.Body
	}
	return ""
}

func (x *Plugin) GetJsonBody() string {
	if x != nil {
		return x.JsonBody
	}
	return ""
}

func (x *Plugin) GetFormData() []*v1.Property {
	if x != nil {
		return x.FormData
	}
	return nil
}

func (x *Plugin) GetFileFormKey() string {
	if x != nil {
		return x.FileFormKey
	}
	return ""
}

func (x *Plugin) GetFileName() string {
	if x != nil {
		return x.FileName
	}
	return ""
}

func (x *Plugin) GetUrlBase() string {
	if x != nil {
		return x.UrlBase
	}
	return ""
}

func (x *Plugin) GetUrlPath() string {
	if x != nil {
		return x.UrlPath
	}
	return ""
}

func (x *Plugin) GetAuthType() string {
	if x != nil {
		return x.AuthType
	}
	return ""
}

func (x *Plugin) GetSuperblocksMetadata() *v1.SuperblocksMetadata {
	if x != nil {
		return x.SuperblocksMetadata
	}
	return nil
}

func (x *Plugin) GetVerboseHttpOutput() bool {
	if x != nil {
		return x.VerboseHttpOutput
	}
	return false
}

func (x *Plugin) GetDoNotFailOnRequestError() bool {
	if x != nil {
		return x.DoNotFailOnRequestError
	}
	return false
}

func (x *Plugin) GetOpenApiAction() string {
	if x != nil {
		return x.OpenApiAction
	}
	return ""
}

func (x *Plugin) GetOpenApiSpecRef() string {
	if x != nil {
		return x.OpenApiSpecRef
	}
	return ""
}

func (x *Plugin) GetOpenApiTenantName() string {
	if x != nil && x.OpenApiTenantName != nil {
		return *x.OpenApiTenantName
	}
	return ""
}

var File_plugins_restapiintegration_v1_plugin_proto protoreflect.FileDescriptor

var file_plugins_restapiintegration_v1_plugin_proto_rawDesc = []byte{
	0x0a, 0x2a, 0x70, 0x6c, 0x75, 0x67, 0x69, 0x6e, 0x73, 0x2f, 0x72, 0x65, 0x73, 0x74, 0x61, 0x70,
	0x69, 0x69, 0x6e, 0x74, 0x65, 0x67, 0x72, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x2f, 0x76, 0x31, 0x2f,
	0x70, 0x6c, 0x75, 0x67, 0x69, 0x6e, 0x2e, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x12, 0x1d, 0x70, 0x6c,
	0x75, 0x67, 0x69, 0x6e, 0x73, 0x2e, 0x72, 0x65, 0x73, 0x74, 0x61, 0x70, 0x69, 0x69, 0x6e, 0x74,
	0x65, 0x67, 0x72, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x2e, 0x76, 0x31, 0x1a, 0x16, 0x63, 0x6f, 0x6d,
	0x6d, 0x6f, 0x6e, 0x2f, 0x76, 0x31, 0x2f, 0x70, 0x6c, 0x75, 0x67, 0x69, 0x6e, 0x2e, 0x70, 0x72,
	0x6f, 0x74, 0x6f, 0x22, 0x84, 0x06, 0x0a, 0x06, 0x50, 0x6c, 0x75, 0x67, 0x69, 0x6e, 0x12, 0x1e,
	0x0a, 0x0a, 0x68, 0x74, 0x74, 0x70, 0x4d, 0x65, 0x74, 0x68, 0x6f, 0x64, 0x18, 0x01, 0x20, 0x01,
	0x28, 0x09, 0x52, 0x0a, 0x68, 0x74, 0x74, 0x70, 0x4d, 0x65, 0x74, 0x68, 0x6f, 0x64, 0x12, 0x22,
	0x0a, 0x0c, 0x72, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x54, 0x79, 0x70, 0x65, 0x18, 0x02,
	0x20, 0x01, 0x28, 0x09, 0x52, 0x0c, 0x72, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x54, 0x79,
	0x70, 0x65, 0x12, 0x2d, 0x0a, 0x07, 0x68, 0x65, 0x61, 0x64, 0x65, 0x72, 0x73, 0x18, 0x03, 0x20,
	0x03, 0x28, 0x0b, 0x32, 0x13, 0x2e, 0x63, 0x6f, 0x6d, 0x6d, 0x6f, 0x6e, 0x2e, 0x76, 0x31, 0x2e,
	0x50, 0x72, 0x6f, 0x70, 0x65, 0x72, 0x74, 0x79, 0x52, 0x07, 0x68, 0x65, 0x61, 0x64, 0x65, 0x72,
	0x73, 0x12, 0x2b, 0x0a, 0x06, 0x70, 0x61, 0x72, 0x61, 0x6d, 0x73, 0x18, 0x04, 0x20, 0x03, 0x28,
	0x0b, 0x32, 0x13, 0x2e, 0x63, 0x6f, 0x6d, 0x6d, 0x6f, 0x6e, 0x2e, 0x76, 0x31, 0x2e, 0x50, 0x72,
	0x6f, 0x70, 0x65, 0x72, 0x74, 0x79, 0x52, 0x06, 0x70, 0x61, 0x72, 0x61, 0x6d, 0x73, 0x12, 0x1a,
	0x0a, 0x08, 0x62, 0x6f, 0x64, 0x79, 0x54, 0x79, 0x70, 0x65, 0x18, 0x05, 0x20, 0x01, 0x28, 0x09,
	0x52, 0x08, 0x62, 0x6f, 0x64, 0x79, 0x54, 0x79, 0x70, 0x65, 0x12, 0x12, 0x0a, 0x04, 0x62, 0x6f,
	0x64, 0x79, 0x18, 0x06, 0x20, 0x01, 0x28, 0x09, 0x52, 0x04, 0x62, 0x6f, 0x64, 0x79, 0x12, 0x1a,
	0x0a, 0x08, 0x6a, 0x73, 0x6f, 0x6e, 0x42, 0x6f, 0x64, 0x79, 0x18, 0x07, 0x20, 0x01, 0x28, 0x09,
	0x52, 0x08, 0x6a, 0x73, 0x6f, 0x6e, 0x42, 0x6f, 0x64, 0x79, 0x12, 0x2f, 0x0a, 0x08, 0x66, 0x6f,
	0x72, 0x6d, 0x44, 0x61, 0x74, 0x61, 0x18, 0x08, 0x20, 0x03, 0x28, 0x0b, 0x32, 0x13, 0x2e, 0x63,
	0x6f, 0x6d, 0x6d, 0x6f, 0x6e, 0x2e, 0x76, 0x31, 0x2e, 0x50, 0x72, 0x6f, 0x70, 0x65, 0x72, 0x74,
	0x79, 0x52, 0x08, 0x66, 0x6f, 0x72, 0x6d, 0x44, 0x61, 0x74, 0x61, 0x12, 0x20, 0x0a, 0x0b, 0x66,
	0x69, 0x6c, 0x65, 0x46, 0x6f, 0x72, 0x6d, 0x4b, 0x65, 0x79, 0x18, 0x09, 0x20, 0x01, 0x28, 0x09,
	0x52, 0x0b, 0x66, 0x69, 0x6c, 0x65, 0x46, 0x6f, 0x72, 0x6d, 0x4b, 0x65, 0x79, 0x12, 0x1a, 0x0a,
	0x08, 0x66, 0x69, 0x6c, 0x65, 0x4e, 0x61, 0x6d, 0x65, 0x18, 0x0a, 0x20, 0x01, 0x28, 0x09, 0x52,
	0x08, 0x66, 0x69, 0x6c, 0x65, 0x4e, 0x61, 0x6d, 0x65, 0x12, 0x18, 0x0a, 0x07, 0x75, 0x72, 0x6c,
	0x42, 0x61, 0x73, 0x65, 0x18, 0x0b, 0x20, 0x01, 0x28, 0x09, 0x52, 0x07, 0x75, 0x72, 0x6c, 0x42,
	0x61, 0x73, 0x65, 0x12, 0x18, 0x0a, 0x07, 0x75, 0x72, 0x6c, 0x50, 0x61, 0x74, 0x68, 0x18, 0x0c,
	0x20, 0x01, 0x28, 0x09, 0x52, 0x07, 0x75, 0x72, 0x6c, 0x50, 0x61, 0x74, 0x68, 0x12, 0x1a, 0x0a,
	0x08, 0x61, 0x75, 0x74, 0x68, 0x54, 0x79, 0x70, 0x65, 0x18, 0x0d, 0x20, 0x01, 0x28, 0x09, 0x52,
	0x08, 0x61, 0x75, 0x74, 0x68, 0x54, 0x79, 0x70, 0x65, 0x12, 0x50, 0x0a, 0x13, 0x73, 0x75, 0x70,
	0x65, 0x72, 0x62, 0x6c, 0x6f, 0x63, 0x6b, 0x73, 0x4d, 0x65, 0x74, 0x61, 0x64, 0x61, 0x74, 0x61,
	0x18, 0x0e, 0x20, 0x01, 0x28, 0x0b, 0x32, 0x1e, 0x2e, 0x63, 0x6f, 0x6d, 0x6d, 0x6f, 0x6e, 0x2e,
	0x76, 0x31, 0x2e, 0x53, 0x75, 0x70, 0x65, 0x72, 0x62, 0x6c, 0x6f, 0x63, 0x6b, 0x73, 0x4d, 0x65,
	0x74, 0x61, 0x64, 0x61, 0x74, 0x61, 0x52, 0x13, 0x73, 0x75, 0x70, 0x65, 0x72, 0x62, 0x6c, 0x6f,
	0x63, 0x6b, 0x73, 0x4d, 0x65, 0x74, 0x61, 0x64, 0x61, 0x74, 0x61, 0x12, 0x2c, 0x0a, 0x11, 0x76,
	0x65, 0x72, 0x62, 0x6f, 0x73, 0x65, 0x48, 0x74, 0x74, 0x70, 0x4f, 0x75, 0x74, 0x70, 0x75, 0x74,
	0x18, 0x12, 0x20, 0x01, 0x28, 0x08, 0x52, 0x11, 0x76, 0x65, 0x72, 0x62, 0x6f, 0x73, 0x65, 0x48,
	0x74, 0x74, 0x70, 0x4f, 0x75, 0x74, 0x70, 0x75, 0x74, 0x12, 0x38, 0x0a, 0x17, 0x64, 0x6f, 0x4e,
	0x6f, 0x74, 0x46, 0x61, 0x69, 0x6c, 0x4f, 0x6e, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x45,
	0x72, 0x72, 0x6f, 0x72, 0x18, 0x13, 0x20, 0x01, 0x28, 0x08, 0x52, 0x17, 0x64, 0x6f, 0x4e, 0x6f,
	0x74, 0x46, 0x61, 0x69, 0x6c, 0x4f, 0x6e, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x45, 0x72,
	0x72, 0x6f, 0x72, 0x12, 0x24, 0x0a, 0x0d, 0x6f, 0x70, 0x65, 0x6e, 0x41, 0x70, 0x69, 0x41, 0x63,
	0x74, 0x69, 0x6f, 0x6e, 0x18, 0x0f, 0x20, 0x01, 0x28, 0x09, 0x52, 0x0d, 0x6f, 0x70, 0x65, 0x6e,
	0x41, 0x70, 0x69, 0x41, 0x63, 0x74, 0x69, 0x6f, 0x6e, 0x12, 0x26, 0x0a, 0x0e, 0x6f, 0x70, 0x65,
	0x6e, 0x41, 0x70, 0x69, 0x53, 0x70, 0x65, 0x63, 0x52, 0x65, 0x66, 0x18, 0x10, 0x20, 0x01, 0x28,
	0x09, 0x52, 0x0e, 0x6f, 0x70, 0x65, 0x6e, 0x41, 0x70, 0x69, 0x53, 0x70, 0x65, 0x63, 0x52, 0x65,
	0x66, 0x12, 0x31, 0x0a, 0x11, 0x6f, 0x70, 0x65, 0x6e, 0x41, 0x70, 0x69, 0x54, 0x65, 0x6e, 0x61,
	0x6e, 0x74, 0x4e, 0x61, 0x6d, 0x65, 0x18, 0x11, 0x20, 0x01, 0x28, 0x09, 0x48, 0x00, 0x52, 0x11,
	0x6f, 0x70, 0x65, 0x6e, 0x41, 0x70, 0x69, 0x54, 0x65, 0x6e, 0x61, 0x6e, 0x74, 0x4e, 0x61, 0x6d,
	0x65, 0x88, 0x01, 0x01, 0x42, 0x14, 0x0a, 0x12, 0x5f, 0x6f, 0x70, 0x65, 0x6e, 0x41, 0x70, 0x69,
	0x54, 0x65, 0x6e, 0x61, 0x6e, 0x74, 0x4e, 0x61, 0x6d, 0x65, 0x42, 0x4d, 0x5a, 0x4b, 0x67, 0x69,
	0x74, 0x68, 0x75, 0x62, 0x2e, 0x63, 0x6f, 0x6d, 0x2f, 0x73, 0x75, 0x70, 0x65, 0x72, 0x62, 0x6c,
	0x6f, 0x63, 0x6b, 0x73, 0x74, 0x65, 0x61, 0x6d, 0x2f, 0x61, 0x67, 0x65, 0x6e, 0x74, 0x2f, 0x74,
	0x79, 0x70, 0x65, 0x73, 0x2f, 0x67, 0x65, 0x6e, 0x2f, 0x67, 0x6f, 0x2f, 0x70, 0x6c, 0x75, 0x67,
	0x69, 0x6e, 0x73, 0x2f, 0x72, 0x65, 0x73, 0x74, 0x61, 0x70, 0x69, 0x69, 0x6e, 0x74, 0x65, 0x67,
	0x72, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x2f, 0x76, 0x31, 0x62, 0x06, 0x70, 0x72, 0x6f, 0x74, 0x6f,
	0x33,
}

var (
	file_plugins_restapiintegration_v1_plugin_proto_rawDescOnce sync.Once
	file_plugins_restapiintegration_v1_plugin_proto_rawDescData = file_plugins_restapiintegration_v1_plugin_proto_rawDesc
)

func file_plugins_restapiintegration_v1_plugin_proto_rawDescGZIP() []byte {
	file_plugins_restapiintegration_v1_plugin_proto_rawDescOnce.Do(func() {
		file_plugins_restapiintegration_v1_plugin_proto_rawDescData = protoimpl.X.CompressGZIP(file_plugins_restapiintegration_v1_plugin_proto_rawDescData)
	})
	return file_plugins_restapiintegration_v1_plugin_proto_rawDescData
}

var file_plugins_restapiintegration_v1_plugin_proto_msgTypes = make([]protoimpl.MessageInfo, 1)
var file_plugins_restapiintegration_v1_plugin_proto_goTypes = []interface{}{
	(*Plugin)(nil),                 // 0: plugins.restapiintegration.v1.Plugin
	(*v1.Property)(nil),            // 1: common.v1.Property
	(*v1.SuperblocksMetadata)(nil), // 2: common.v1.SuperblocksMetadata
}
var file_plugins_restapiintegration_v1_plugin_proto_depIdxs = []int32{
	1, // 0: plugins.restapiintegration.v1.Plugin.headers:type_name -> common.v1.Property
	1, // 1: plugins.restapiintegration.v1.Plugin.params:type_name -> common.v1.Property
	1, // 2: plugins.restapiintegration.v1.Plugin.formData:type_name -> common.v1.Property
	2, // 3: plugins.restapiintegration.v1.Plugin.superblocksMetadata:type_name -> common.v1.SuperblocksMetadata
	4, // [4:4] is the sub-list for method output_type
	4, // [4:4] is the sub-list for method input_type
	4, // [4:4] is the sub-list for extension type_name
	4, // [4:4] is the sub-list for extension extendee
	0, // [0:4] is the sub-list for field type_name
}

func init() { file_plugins_restapiintegration_v1_plugin_proto_init() }
func file_plugins_restapiintegration_v1_plugin_proto_init() {
	if File_plugins_restapiintegration_v1_plugin_proto != nil {
		return
	}
	if !protoimpl.UnsafeEnabled {
		file_plugins_restapiintegration_v1_plugin_proto_msgTypes[0].Exporter = func(v interface{}, i int) interface{} {
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
	}
	file_plugins_restapiintegration_v1_plugin_proto_msgTypes[0].OneofWrappers = []interface{}{}
	type x struct{}
	out := protoimpl.TypeBuilder{
		File: protoimpl.DescBuilder{
			GoPackagePath: reflect.TypeOf(x{}).PkgPath(),
			RawDescriptor: file_plugins_restapiintegration_v1_plugin_proto_rawDesc,
			NumEnums:      0,
			NumMessages:   1,
			NumExtensions: 0,
			NumServices:   0,
		},
		GoTypes:           file_plugins_restapiintegration_v1_plugin_proto_goTypes,
		DependencyIndexes: file_plugins_restapiintegration_v1_plugin_proto_depIdxs,
		MessageInfos:      file_plugins_restapiintegration_v1_plugin_proto_msgTypes,
	}.Build()
	File_plugins_restapiintegration_v1_plugin_proto = out.File
	file_plugins_restapiintegration_v1_plugin_proto_rawDesc = nil
	file_plugins_restapiintegration_v1_plugin_proto_goTypes = nil
	file_plugins_restapiintegration_v1_plugin_proto_depIdxs = nil
}
