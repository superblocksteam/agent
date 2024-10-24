// Code generated by protoc-gen-go. DO NOT EDIT.
// versions:
// 	protoc-gen-go v1.32.0
// 	protoc        (unknown)
// source: common/v1/plugin.proto

package v1

import (
	protoreflect "google.golang.org/protobuf/reflect/protoreflect"
	protoimpl "google.golang.org/protobuf/runtime/protoimpl"
	structpb "google.golang.org/protobuf/types/known/structpb"
	reflect "reflect"
	sync "sync"
)

const (
	// Verify that this generated code is sufficiently up-to-date.
	_ = protoimpl.EnforceVersion(20 - protoimpl.MinVersion)
	// Verify that runtime/protoimpl is sufficiently up-to-date.
	_ = protoimpl.EnforceVersion(protoimpl.MaxVersion - 20)
)

type Property struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Key          *string       `protobuf:"bytes,1,opt,name=key,proto3,oneof" json:"key,omitempty"`
	Value        *string       `protobuf:"bytes,2,opt,name=value,proto3,oneof" json:"value,omitempty"`
	Editable     *bool         `protobuf:"varint,3,opt,name=editable,proto3,oneof" json:"editable,omitempty"`
	Internal     *bool         `protobuf:"varint,4,opt,name=internal,proto3,oneof" json:"internal,omitempty"`
	Description  *string       `protobuf:"bytes,5,opt,name=description,proto3,oneof" json:"description,omitempty"`
	Mandatory    *bool         `protobuf:"varint,6,opt,name=mandatory,proto3,oneof" json:"mandatory,omitempty"`
	Type         *string       `protobuf:"bytes,7,opt,name=type,proto3,oneof" json:"type,omitempty"`
	DefaultValue *string       `protobuf:"bytes,8,opt,name=defaultValue,proto3,oneof" json:"defaultValue,omitempty"`
	MinRange     *string       `protobuf:"bytes,9,opt,name=minRange,proto3,oneof" json:"minRange,omitempty"`
	MaxRange     *string       `protobuf:"bytes,10,opt,name=maxRange,proto3,oneof" json:"maxRange,omitempty"`
	ValueOptions []string      `protobuf:"bytes,11,rep,name=valueOptions,proto3" json:"valueOptions,omitempty"`
	System       *bool         `protobuf:"varint,12,opt,name=system,proto3,oneof" json:"system,omitempty"` // system properties are ones injected by the system
	File         *FileMetadata `protobuf:"bytes,13,opt,name=file,proto3,oneof" json:"file,omitempty"`
}

func (x *Property) Reset() {
	*x = Property{}
	if protoimpl.UnsafeEnabled {
		mi := &file_common_v1_plugin_proto_msgTypes[0]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *Property) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*Property) ProtoMessage() {}

func (x *Property) ProtoReflect() protoreflect.Message {
	mi := &file_common_v1_plugin_proto_msgTypes[0]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use Property.ProtoReflect.Descriptor instead.
func (*Property) Descriptor() ([]byte, []int) {
	return file_common_v1_plugin_proto_rawDescGZIP(), []int{0}
}

func (x *Property) GetKey() string {
	if x != nil && x.Key != nil {
		return *x.Key
	}
	return ""
}

func (x *Property) GetValue() string {
	if x != nil && x.Value != nil {
		return *x.Value
	}
	return ""
}

func (x *Property) GetEditable() bool {
	if x != nil && x.Editable != nil {
		return *x.Editable
	}
	return false
}

func (x *Property) GetInternal() bool {
	if x != nil && x.Internal != nil {
		return *x.Internal
	}
	return false
}

func (x *Property) GetDescription() string {
	if x != nil && x.Description != nil {
		return *x.Description
	}
	return ""
}

func (x *Property) GetMandatory() bool {
	if x != nil && x.Mandatory != nil {
		return *x.Mandatory
	}
	return false
}

func (x *Property) GetType() string {
	if x != nil && x.Type != nil {
		return *x.Type
	}
	return ""
}

func (x *Property) GetDefaultValue() string {
	if x != nil && x.DefaultValue != nil {
		return *x.DefaultValue
	}
	return ""
}

func (x *Property) GetMinRange() string {
	if x != nil && x.MinRange != nil {
		return *x.MinRange
	}
	return ""
}

func (x *Property) GetMaxRange() string {
	if x != nil && x.MaxRange != nil {
		return *x.MaxRange
	}
	return ""
}

func (x *Property) GetValueOptions() []string {
	if x != nil {
		return x.ValueOptions
	}
	return nil
}

func (x *Property) GetSystem() bool {
	if x != nil && x.System != nil {
		return *x.System
	}
	return false
}

func (x *Property) GetFile() *FileMetadata {
	if x != nil {
		return x.File
	}
	return nil
}

type SuperblocksMetadata struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	PluginVersion string `protobuf:"bytes,1,opt,name=pluginVersion,proto3" json:"pluginVersion,omitempty"`
}

func (x *SuperblocksMetadata) Reset() {
	*x = SuperblocksMetadata{}
	if protoimpl.UnsafeEnabled {
		mi := &file_common_v1_plugin_proto_msgTypes[1]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *SuperblocksMetadata) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*SuperblocksMetadata) ProtoMessage() {}

func (x *SuperblocksMetadata) ProtoReflect() protoreflect.Message {
	mi := &file_common_v1_plugin_proto_msgTypes[1]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use SuperblocksMetadata.ProtoReflect.Descriptor instead.
func (*SuperblocksMetadata) Descriptor() ([]byte, []int) {
	return file_common_v1_plugin_proto_rawDescGZIP(), []int{1}
}

func (x *SuperblocksMetadata) GetPluginVersion() string {
	if x != nil {
		return x.PluginVersion
	}
	return ""
}

type HttpParameters struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	// NOTE(frank): I originally was using `google.protobuf.Value`.bool
	// However, we actually take these in as a string. If it's json,
	// it will be passed in as an escaped value. I don't think this is
	// the right way to do this as for API inputs, we take those in as
	// real encoded JSON.
	Query map[string]*structpb.Value `protobuf:"bytes,1,rep,name=query,proto3" json:"query,omitempty" protobuf_key:"bytes,1,opt,name=key,proto3" protobuf_val:"bytes,2,opt,name=value,proto3"`
	Body  map[string]*structpb.Value `protobuf:"bytes,2,rep,name=body,proto3" json:"body,omitempty" protobuf_key:"bytes,1,opt,name=key,proto3" protobuf_val:"bytes,2,opt,name=value,proto3"`
}

func (x *HttpParameters) Reset() {
	*x = HttpParameters{}
	if protoimpl.UnsafeEnabled {
		mi := &file_common_v1_plugin_proto_msgTypes[2]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *HttpParameters) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*HttpParameters) ProtoMessage() {}

func (x *HttpParameters) ProtoReflect() protoreflect.Message {
	mi := &file_common_v1_plugin_proto_msgTypes[2]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use HttpParameters.ProtoReflect.Descriptor instead.
func (*HttpParameters) Descriptor() ([]byte, []int) {
	return file_common_v1_plugin_proto_rawDescGZIP(), []int{2}
}

func (x *HttpParameters) GetQuery() map[string]*structpb.Value {
	if x != nil {
		return x.Query
	}
	return nil
}

func (x *HttpParameters) GetBody() map[string]*structpb.Value {
	if x != nil {
		return x.Body
	}
	return nil
}

type FileMetadata struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Filename string `protobuf:"bytes,1,opt,name=filename,proto3" json:"filename,omitempty"`
}

func (x *FileMetadata) Reset() {
	*x = FileMetadata{}
	if protoimpl.UnsafeEnabled {
		mi := &file_common_v1_plugin_proto_msgTypes[3]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *FileMetadata) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*FileMetadata) ProtoMessage() {}

func (x *FileMetadata) ProtoReflect() protoreflect.Message {
	mi := &file_common_v1_plugin_proto_msgTypes[3]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use FileMetadata.ProtoReflect.Descriptor instead.
func (*FileMetadata) Descriptor() ([]byte, []int) {
	return file_common_v1_plugin_proto_rawDescGZIP(), []int{3}
}

func (x *FileMetadata) GetFilename() string {
	if x != nil {
		return x.Filename
	}
	return ""
}

var File_common_v1_plugin_proto protoreflect.FileDescriptor

var file_common_v1_plugin_proto_rawDesc = []byte{
	0x0a, 0x16, 0x63, 0x6f, 0x6d, 0x6d, 0x6f, 0x6e, 0x2f, 0x76, 0x31, 0x2f, 0x70, 0x6c, 0x75, 0x67,
	0x69, 0x6e, 0x2e, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x12, 0x09, 0x63, 0x6f, 0x6d, 0x6d, 0x6f, 0x6e,
	0x2e, 0x76, 0x31, 0x1a, 0x1c, 0x67, 0x6f, 0x6f, 0x67, 0x6c, 0x65, 0x2f, 0x70, 0x72, 0x6f, 0x74,
	0x6f, 0x62, 0x75, 0x66, 0x2f, 0x73, 0x74, 0x72, 0x75, 0x63, 0x74, 0x2e, 0x70, 0x72, 0x6f, 0x74,
	0x6f, 0x22, 0xd1, 0x04, 0x0a, 0x08, 0x50, 0x72, 0x6f, 0x70, 0x65, 0x72, 0x74, 0x79, 0x12, 0x15,
	0x0a, 0x03, 0x6b, 0x65, 0x79, 0x18, 0x01, 0x20, 0x01, 0x28, 0x09, 0x48, 0x00, 0x52, 0x03, 0x6b,
	0x65, 0x79, 0x88, 0x01, 0x01, 0x12, 0x19, 0x0a, 0x05, 0x76, 0x61, 0x6c, 0x75, 0x65, 0x18, 0x02,
	0x20, 0x01, 0x28, 0x09, 0x48, 0x01, 0x52, 0x05, 0x76, 0x61, 0x6c, 0x75, 0x65, 0x88, 0x01, 0x01,
	0x12, 0x1f, 0x0a, 0x08, 0x65, 0x64, 0x69, 0x74, 0x61, 0x62, 0x6c, 0x65, 0x18, 0x03, 0x20, 0x01,
	0x28, 0x08, 0x48, 0x02, 0x52, 0x08, 0x65, 0x64, 0x69, 0x74, 0x61, 0x62, 0x6c, 0x65, 0x88, 0x01,
	0x01, 0x12, 0x1f, 0x0a, 0x08, 0x69, 0x6e, 0x74, 0x65, 0x72, 0x6e, 0x61, 0x6c, 0x18, 0x04, 0x20,
	0x01, 0x28, 0x08, 0x48, 0x03, 0x52, 0x08, 0x69, 0x6e, 0x74, 0x65, 0x72, 0x6e, 0x61, 0x6c, 0x88,
	0x01, 0x01, 0x12, 0x25, 0x0a, 0x0b, 0x64, 0x65, 0x73, 0x63, 0x72, 0x69, 0x70, 0x74, 0x69, 0x6f,
	0x6e, 0x18, 0x05, 0x20, 0x01, 0x28, 0x09, 0x48, 0x04, 0x52, 0x0b, 0x64, 0x65, 0x73, 0x63, 0x72,
	0x69, 0x70, 0x74, 0x69, 0x6f, 0x6e, 0x88, 0x01, 0x01, 0x12, 0x21, 0x0a, 0x09, 0x6d, 0x61, 0x6e,
	0x64, 0x61, 0x74, 0x6f, 0x72, 0x79, 0x18, 0x06, 0x20, 0x01, 0x28, 0x08, 0x48, 0x05, 0x52, 0x09,
	0x6d, 0x61, 0x6e, 0x64, 0x61, 0x74, 0x6f, 0x72, 0x79, 0x88, 0x01, 0x01, 0x12, 0x17, 0x0a, 0x04,
	0x74, 0x79, 0x70, 0x65, 0x18, 0x07, 0x20, 0x01, 0x28, 0x09, 0x48, 0x06, 0x52, 0x04, 0x74, 0x79,
	0x70, 0x65, 0x88, 0x01, 0x01, 0x12, 0x27, 0x0a, 0x0c, 0x64, 0x65, 0x66, 0x61, 0x75, 0x6c, 0x74,
	0x56, 0x61, 0x6c, 0x75, 0x65, 0x18, 0x08, 0x20, 0x01, 0x28, 0x09, 0x48, 0x07, 0x52, 0x0c, 0x64,
	0x65, 0x66, 0x61, 0x75, 0x6c, 0x74, 0x56, 0x61, 0x6c, 0x75, 0x65, 0x88, 0x01, 0x01, 0x12, 0x1f,
	0x0a, 0x08, 0x6d, 0x69, 0x6e, 0x52, 0x61, 0x6e, 0x67, 0x65, 0x18, 0x09, 0x20, 0x01, 0x28, 0x09,
	0x48, 0x08, 0x52, 0x08, 0x6d, 0x69, 0x6e, 0x52, 0x61, 0x6e, 0x67, 0x65, 0x88, 0x01, 0x01, 0x12,
	0x1f, 0x0a, 0x08, 0x6d, 0x61, 0x78, 0x52, 0x61, 0x6e, 0x67, 0x65, 0x18, 0x0a, 0x20, 0x01, 0x28,
	0x09, 0x48, 0x09, 0x52, 0x08, 0x6d, 0x61, 0x78, 0x52, 0x61, 0x6e, 0x67, 0x65, 0x88, 0x01, 0x01,
	0x12, 0x22, 0x0a, 0x0c, 0x76, 0x61, 0x6c, 0x75, 0x65, 0x4f, 0x70, 0x74, 0x69, 0x6f, 0x6e, 0x73,
	0x18, 0x0b, 0x20, 0x03, 0x28, 0x09, 0x52, 0x0c, 0x76, 0x61, 0x6c, 0x75, 0x65, 0x4f, 0x70, 0x74,
	0x69, 0x6f, 0x6e, 0x73, 0x12, 0x1b, 0x0a, 0x06, 0x73, 0x79, 0x73, 0x74, 0x65, 0x6d, 0x18, 0x0c,
	0x20, 0x01, 0x28, 0x08, 0x48, 0x0a, 0x52, 0x06, 0x73, 0x79, 0x73, 0x74, 0x65, 0x6d, 0x88, 0x01,
	0x01, 0x12, 0x30, 0x0a, 0x04, 0x66, 0x69, 0x6c, 0x65, 0x18, 0x0d, 0x20, 0x01, 0x28, 0x0b, 0x32,
	0x17, 0x2e, 0x63, 0x6f, 0x6d, 0x6d, 0x6f, 0x6e, 0x2e, 0x76, 0x31, 0x2e, 0x46, 0x69, 0x6c, 0x65,
	0x4d, 0x65, 0x74, 0x61, 0x64, 0x61, 0x74, 0x61, 0x48, 0x0b, 0x52, 0x04, 0x66, 0x69, 0x6c, 0x65,
	0x88, 0x01, 0x01, 0x42, 0x06, 0x0a, 0x04, 0x5f, 0x6b, 0x65, 0x79, 0x42, 0x08, 0x0a, 0x06, 0x5f,
	0x76, 0x61, 0x6c, 0x75, 0x65, 0x42, 0x0b, 0x0a, 0x09, 0x5f, 0x65, 0x64, 0x69, 0x74, 0x61, 0x62,
	0x6c, 0x65, 0x42, 0x0b, 0x0a, 0x09, 0x5f, 0x69, 0x6e, 0x74, 0x65, 0x72, 0x6e, 0x61, 0x6c, 0x42,
	0x0e, 0x0a, 0x0c, 0x5f, 0x64, 0x65, 0x73, 0x63, 0x72, 0x69, 0x70, 0x74, 0x69, 0x6f, 0x6e, 0x42,
	0x0c, 0x0a, 0x0a, 0x5f, 0x6d, 0x61, 0x6e, 0x64, 0x61, 0x74, 0x6f, 0x72, 0x79, 0x42, 0x07, 0x0a,
	0x05, 0x5f, 0x74, 0x79, 0x70, 0x65, 0x42, 0x0f, 0x0a, 0x0d, 0x5f, 0x64, 0x65, 0x66, 0x61, 0x75,
	0x6c, 0x74, 0x56, 0x61, 0x6c, 0x75, 0x65, 0x42, 0x0b, 0x0a, 0x09, 0x5f, 0x6d, 0x69, 0x6e, 0x52,
	0x61, 0x6e, 0x67, 0x65, 0x42, 0x0b, 0x0a, 0x09, 0x5f, 0x6d, 0x61, 0x78, 0x52, 0x61, 0x6e, 0x67,
	0x65, 0x42, 0x09, 0x0a, 0x07, 0x5f, 0x73, 0x79, 0x73, 0x74, 0x65, 0x6d, 0x42, 0x07, 0x0a, 0x05,
	0x5f, 0x66, 0x69, 0x6c, 0x65, 0x22, 0x3b, 0x0a, 0x13, 0x53, 0x75, 0x70, 0x65, 0x72, 0x62, 0x6c,
	0x6f, 0x63, 0x6b, 0x73, 0x4d, 0x65, 0x74, 0x61, 0x64, 0x61, 0x74, 0x61, 0x12, 0x24, 0x0a, 0x0d,
	0x70, 0x6c, 0x75, 0x67, 0x69, 0x6e, 0x56, 0x65, 0x72, 0x73, 0x69, 0x6f, 0x6e, 0x18, 0x01, 0x20,
	0x01, 0x28, 0x09, 0x52, 0x0d, 0x70, 0x6c, 0x75, 0x67, 0x69, 0x6e, 0x56, 0x65, 0x72, 0x73, 0x69,
	0x6f, 0x6e, 0x22, 0xa8, 0x02, 0x0a, 0x0e, 0x48, 0x74, 0x74, 0x70, 0x50, 0x61, 0x72, 0x61, 0x6d,
	0x65, 0x74, 0x65, 0x72, 0x73, 0x12, 0x3a, 0x0a, 0x05, 0x71, 0x75, 0x65, 0x72, 0x79, 0x18, 0x01,
	0x20, 0x03, 0x28, 0x0b, 0x32, 0x24, 0x2e, 0x63, 0x6f, 0x6d, 0x6d, 0x6f, 0x6e, 0x2e, 0x76, 0x31,
	0x2e, 0x48, 0x74, 0x74, 0x70, 0x50, 0x61, 0x72, 0x61, 0x6d, 0x65, 0x74, 0x65, 0x72, 0x73, 0x2e,
	0x51, 0x75, 0x65, 0x72, 0x79, 0x45, 0x6e, 0x74, 0x72, 0x79, 0x52, 0x05, 0x71, 0x75, 0x65, 0x72,
	0x79, 0x12, 0x37, 0x0a, 0x04, 0x62, 0x6f, 0x64, 0x79, 0x18, 0x02, 0x20, 0x03, 0x28, 0x0b, 0x32,
	0x23, 0x2e, 0x63, 0x6f, 0x6d, 0x6d, 0x6f, 0x6e, 0x2e, 0x76, 0x31, 0x2e, 0x48, 0x74, 0x74, 0x70,
	0x50, 0x61, 0x72, 0x61, 0x6d, 0x65, 0x74, 0x65, 0x72, 0x73, 0x2e, 0x42, 0x6f, 0x64, 0x79, 0x45,
	0x6e, 0x74, 0x72, 0x79, 0x52, 0x04, 0x62, 0x6f, 0x64, 0x79, 0x1a, 0x50, 0x0a, 0x0a, 0x51, 0x75,
	0x65, 0x72, 0x79, 0x45, 0x6e, 0x74, 0x72, 0x79, 0x12, 0x10, 0x0a, 0x03, 0x6b, 0x65, 0x79, 0x18,
	0x01, 0x20, 0x01, 0x28, 0x09, 0x52, 0x03, 0x6b, 0x65, 0x79, 0x12, 0x2c, 0x0a, 0x05, 0x76, 0x61,
	0x6c, 0x75, 0x65, 0x18, 0x02, 0x20, 0x01, 0x28, 0x0b, 0x32, 0x16, 0x2e, 0x67, 0x6f, 0x6f, 0x67,
	0x6c, 0x65, 0x2e, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x62, 0x75, 0x66, 0x2e, 0x56, 0x61, 0x6c, 0x75,
	0x65, 0x52, 0x05, 0x76, 0x61, 0x6c, 0x75, 0x65, 0x3a, 0x02, 0x38, 0x01, 0x1a, 0x4f, 0x0a, 0x09,
	0x42, 0x6f, 0x64, 0x79, 0x45, 0x6e, 0x74, 0x72, 0x79, 0x12, 0x10, 0x0a, 0x03, 0x6b, 0x65, 0x79,
	0x18, 0x01, 0x20, 0x01, 0x28, 0x09, 0x52, 0x03, 0x6b, 0x65, 0x79, 0x12, 0x2c, 0x0a, 0x05, 0x76,
	0x61, 0x6c, 0x75, 0x65, 0x18, 0x02, 0x20, 0x01, 0x28, 0x0b, 0x32, 0x16, 0x2e, 0x67, 0x6f, 0x6f,
	0x67, 0x6c, 0x65, 0x2e, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x62, 0x75, 0x66, 0x2e, 0x56, 0x61, 0x6c,
	0x75, 0x65, 0x52, 0x05, 0x76, 0x61, 0x6c, 0x75, 0x65, 0x3a, 0x02, 0x38, 0x01, 0x22, 0x2a, 0x0a,
	0x0c, 0x46, 0x69, 0x6c, 0x65, 0x4d, 0x65, 0x74, 0x61, 0x64, 0x61, 0x74, 0x61, 0x12, 0x1a, 0x0a,
	0x08, 0x66, 0x69, 0x6c, 0x65, 0x6e, 0x61, 0x6d, 0x65, 0x18, 0x01, 0x20, 0x01, 0x28, 0x09, 0x52,
	0x08, 0x66, 0x69, 0x6c, 0x65, 0x6e, 0x61, 0x6d, 0x65, 0x42, 0x39, 0x5a, 0x37, 0x67, 0x69, 0x74,
	0x68, 0x75, 0x62, 0x2e, 0x63, 0x6f, 0x6d, 0x2f, 0x73, 0x75, 0x70, 0x65, 0x72, 0x62, 0x6c, 0x6f,
	0x63, 0x6b, 0x73, 0x74, 0x65, 0x61, 0x6d, 0x2f, 0x61, 0x67, 0x65, 0x6e, 0x74, 0x2f, 0x74, 0x79,
	0x70, 0x65, 0x73, 0x2f, 0x67, 0x65, 0x6e, 0x2f, 0x67, 0x6f, 0x2f, 0x63, 0x6f, 0x6d, 0x6d, 0x6f,
	0x6e, 0x2f, 0x76, 0x31, 0x62, 0x06, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x33,
}

var (
	file_common_v1_plugin_proto_rawDescOnce sync.Once
	file_common_v1_plugin_proto_rawDescData = file_common_v1_plugin_proto_rawDesc
)

func file_common_v1_plugin_proto_rawDescGZIP() []byte {
	file_common_v1_plugin_proto_rawDescOnce.Do(func() {
		file_common_v1_plugin_proto_rawDescData = protoimpl.X.CompressGZIP(file_common_v1_plugin_proto_rawDescData)
	})
	return file_common_v1_plugin_proto_rawDescData
}

var file_common_v1_plugin_proto_msgTypes = make([]protoimpl.MessageInfo, 6)
var file_common_v1_plugin_proto_goTypes = []interface{}{
	(*Property)(nil),            // 0: common.v1.Property
	(*SuperblocksMetadata)(nil), // 1: common.v1.SuperblocksMetadata
	(*HttpParameters)(nil),      // 2: common.v1.HttpParameters
	(*FileMetadata)(nil),        // 3: common.v1.FileMetadata
	nil,                         // 4: common.v1.HttpParameters.QueryEntry
	nil,                         // 5: common.v1.HttpParameters.BodyEntry
	(*structpb.Value)(nil),      // 6: google.protobuf.Value
}
var file_common_v1_plugin_proto_depIdxs = []int32{
	3, // 0: common.v1.Property.file:type_name -> common.v1.FileMetadata
	4, // 1: common.v1.HttpParameters.query:type_name -> common.v1.HttpParameters.QueryEntry
	5, // 2: common.v1.HttpParameters.body:type_name -> common.v1.HttpParameters.BodyEntry
	6, // 3: common.v1.HttpParameters.QueryEntry.value:type_name -> google.protobuf.Value
	6, // 4: common.v1.HttpParameters.BodyEntry.value:type_name -> google.protobuf.Value
	5, // [5:5] is the sub-list for method output_type
	5, // [5:5] is the sub-list for method input_type
	5, // [5:5] is the sub-list for extension type_name
	5, // [5:5] is the sub-list for extension extendee
	0, // [0:5] is the sub-list for field type_name
}

func init() { file_common_v1_plugin_proto_init() }
func file_common_v1_plugin_proto_init() {
	if File_common_v1_plugin_proto != nil {
		return
	}
	if !protoimpl.UnsafeEnabled {
		file_common_v1_plugin_proto_msgTypes[0].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*Property); i {
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
		file_common_v1_plugin_proto_msgTypes[1].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*SuperblocksMetadata); i {
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
		file_common_v1_plugin_proto_msgTypes[2].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*HttpParameters); i {
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
		file_common_v1_plugin_proto_msgTypes[3].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*FileMetadata); i {
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
	file_common_v1_plugin_proto_msgTypes[0].OneofWrappers = []interface{}{}
	type x struct{}
	out := protoimpl.TypeBuilder{
		File: protoimpl.DescBuilder{
			GoPackagePath: reflect.TypeOf(x{}).PkgPath(),
			RawDescriptor: file_common_v1_plugin_proto_rawDesc,
			NumEnums:      0,
			NumMessages:   6,
			NumExtensions: 0,
			NumServices:   0,
		},
		GoTypes:           file_common_v1_plugin_proto_goTypes,
		DependencyIndexes: file_common_v1_plugin_proto_depIdxs,
		MessageInfos:      file_common_v1_plugin_proto_msgTypes,
	}.Build()
	File_common_v1_plugin_proto = out.File
	file_common_v1_plugin_proto_rawDesc = nil
	file_common_v1_plugin_proto_goTypes = nil
	file_common_v1_plugin_proto_depIdxs = nil
}
