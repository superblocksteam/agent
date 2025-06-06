// Code generated by protoc-gen-go. DO NOT EDIT.
// versions:
// 	protoc-gen-go v1.32.0
// 	protoc        (unknown)
// source: event/v1/service.proto

package v1

import (
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

type IngestEventRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Events [][]byte `protobuf:"bytes,1,rep,name=events,proto3" json:"events,omitempty"`
}

func (x *IngestEventRequest) Reset() {
	*x = IngestEventRequest{}
	if protoimpl.UnsafeEnabled {
		mi := &file_event_v1_service_proto_msgTypes[0]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *IngestEventRequest) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*IngestEventRequest) ProtoMessage() {}

func (x *IngestEventRequest) ProtoReflect() protoreflect.Message {
	mi := &file_event_v1_service_proto_msgTypes[0]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use IngestEventRequest.ProtoReflect.Descriptor instead.
func (*IngestEventRequest) Descriptor() ([]byte, []int) {
	return file_event_v1_service_proto_rawDescGZIP(), []int{0}
}

func (x *IngestEventRequest) GetEvents() [][]byte {
	if x != nil {
		return x.Events
	}
	return nil
}

type IngestEventResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Success int32                               `protobuf:"varint,1,opt,name=success,proto3" json:"success,omitempty"`
	Errors  []*IngestEventResponse_ErrorWrapper `protobuf:"bytes,2,rep,name=errors,proto3" json:"errors,omitempty"`
}

func (x *IngestEventResponse) Reset() {
	*x = IngestEventResponse{}
	if protoimpl.UnsafeEnabled {
		mi := &file_event_v1_service_proto_msgTypes[1]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *IngestEventResponse) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*IngestEventResponse) ProtoMessage() {}

func (x *IngestEventResponse) ProtoReflect() protoreflect.Message {
	mi := &file_event_v1_service_proto_msgTypes[1]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use IngestEventResponse.ProtoReflect.Descriptor instead.
func (*IngestEventResponse) Descriptor() ([]byte, []int) {
	return file_event_v1_service_proto_rawDescGZIP(), []int{1}
}

func (x *IngestEventResponse) GetSuccess() int32 {
	if x != nil {
		return x.Success
	}
	return 0
}

func (x *IngestEventResponse) GetErrors() []*IngestEventResponse_ErrorWrapper {
	if x != nil {
		return x.Errors
	}
	return nil
}

type IngestEventResponse_ErrorWrapper struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Id    string `protobuf:"bytes,1,opt,name=id,proto3" json:"id,omitempty"`
	Error string `protobuf:"bytes,2,opt,name=error,proto3" json:"error,omitempty"`
}

func (x *IngestEventResponse_ErrorWrapper) Reset() {
	*x = IngestEventResponse_ErrorWrapper{}
	if protoimpl.UnsafeEnabled {
		mi := &file_event_v1_service_proto_msgTypes[2]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *IngestEventResponse_ErrorWrapper) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*IngestEventResponse_ErrorWrapper) ProtoMessage() {}

func (x *IngestEventResponse_ErrorWrapper) ProtoReflect() protoreflect.Message {
	mi := &file_event_v1_service_proto_msgTypes[2]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use IngestEventResponse_ErrorWrapper.ProtoReflect.Descriptor instead.
func (*IngestEventResponse_ErrorWrapper) Descriptor() ([]byte, []int) {
	return file_event_v1_service_proto_rawDescGZIP(), []int{1, 0}
}

func (x *IngestEventResponse_ErrorWrapper) GetId() string {
	if x != nil {
		return x.Id
	}
	return ""
}

func (x *IngestEventResponse_ErrorWrapper) GetError() string {
	if x != nil {
		return x.Error
	}
	return ""
}

var File_event_v1_service_proto protoreflect.FileDescriptor

var file_event_v1_service_proto_rawDesc = []byte{
	0x0a, 0x16, 0x65, 0x76, 0x65, 0x6e, 0x74, 0x2f, 0x76, 0x31, 0x2f, 0x73, 0x65, 0x72, 0x76, 0x69,
	0x63, 0x65, 0x2e, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x12, 0x08, 0x65, 0x76, 0x65, 0x6e, 0x74, 0x2e,
	0x76, 0x31, 0x22, 0x2c, 0x0a, 0x12, 0x49, 0x6e, 0x67, 0x65, 0x73, 0x74, 0x45, 0x76, 0x65, 0x6e,
	0x74, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x12, 0x16, 0x0a, 0x06, 0x65, 0x76, 0x65, 0x6e,
	0x74, 0x73, 0x18, 0x01, 0x20, 0x03, 0x28, 0x0c, 0x52, 0x06, 0x65, 0x76, 0x65, 0x6e, 0x74, 0x73,
	0x22, 0xa9, 0x01, 0x0a, 0x13, 0x49, 0x6e, 0x67, 0x65, 0x73, 0x74, 0x45, 0x76, 0x65, 0x6e, 0x74,
	0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x12, 0x18, 0x0a, 0x07, 0x73, 0x75, 0x63, 0x63,
	0x65, 0x73, 0x73, 0x18, 0x01, 0x20, 0x01, 0x28, 0x05, 0x52, 0x07, 0x73, 0x75, 0x63, 0x63, 0x65,
	0x73, 0x73, 0x12, 0x42, 0x0a, 0x06, 0x65, 0x72, 0x72, 0x6f, 0x72, 0x73, 0x18, 0x02, 0x20, 0x03,
	0x28, 0x0b, 0x32, 0x2a, 0x2e, 0x65, 0x76, 0x65, 0x6e, 0x74, 0x2e, 0x76, 0x31, 0x2e, 0x49, 0x6e,
	0x67, 0x65, 0x73, 0x74, 0x45, 0x76, 0x65, 0x6e, 0x74, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73,
	0x65, 0x2e, 0x45, 0x72, 0x72, 0x6f, 0x72, 0x57, 0x72, 0x61, 0x70, 0x70, 0x65, 0x72, 0x52, 0x06,
	0x65, 0x72, 0x72, 0x6f, 0x72, 0x73, 0x1a, 0x34, 0x0a, 0x0c, 0x45, 0x72, 0x72, 0x6f, 0x72, 0x57,
	0x72, 0x61, 0x70, 0x70, 0x65, 0x72, 0x12, 0x0e, 0x0a, 0x02, 0x69, 0x64, 0x18, 0x01, 0x20, 0x01,
	0x28, 0x09, 0x52, 0x02, 0x69, 0x64, 0x12, 0x14, 0x0a, 0x05, 0x65, 0x72, 0x72, 0x6f, 0x72, 0x18,
	0x02, 0x20, 0x01, 0x28, 0x09, 0x52, 0x05, 0x65, 0x72, 0x72, 0x6f, 0x72, 0x42, 0x38, 0x5a, 0x36,
	0x67, 0x69, 0x74, 0x68, 0x75, 0x62, 0x2e, 0x63, 0x6f, 0x6d, 0x2f, 0x73, 0x75, 0x70, 0x65, 0x72,
	0x62, 0x6c, 0x6f, 0x63, 0x6b, 0x73, 0x74, 0x65, 0x61, 0x6d, 0x2f, 0x61, 0x67, 0x65, 0x6e, 0x74,
	0x2f, 0x74, 0x79, 0x70, 0x65, 0x73, 0x2f, 0x67, 0x65, 0x6e, 0x2f, 0x67, 0x6f, 0x2f, 0x65, 0x76,
	0x65, 0x6e, 0x74, 0x2f, 0x76, 0x31, 0x62, 0x06, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x33,
}

var (
	file_event_v1_service_proto_rawDescOnce sync.Once
	file_event_v1_service_proto_rawDescData = file_event_v1_service_proto_rawDesc
)

func file_event_v1_service_proto_rawDescGZIP() []byte {
	file_event_v1_service_proto_rawDescOnce.Do(func() {
		file_event_v1_service_proto_rawDescData = protoimpl.X.CompressGZIP(file_event_v1_service_proto_rawDescData)
	})
	return file_event_v1_service_proto_rawDescData
}

var file_event_v1_service_proto_msgTypes = make([]protoimpl.MessageInfo, 3)
var file_event_v1_service_proto_goTypes = []interface{}{
	(*IngestEventRequest)(nil),               // 0: event.v1.IngestEventRequest
	(*IngestEventResponse)(nil),              // 1: event.v1.IngestEventResponse
	(*IngestEventResponse_ErrorWrapper)(nil), // 2: event.v1.IngestEventResponse.ErrorWrapper
}
var file_event_v1_service_proto_depIdxs = []int32{
	2, // 0: event.v1.IngestEventResponse.errors:type_name -> event.v1.IngestEventResponse.ErrorWrapper
	1, // [1:1] is the sub-list for method output_type
	1, // [1:1] is the sub-list for method input_type
	1, // [1:1] is the sub-list for extension type_name
	1, // [1:1] is the sub-list for extension extendee
	0, // [0:1] is the sub-list for field type_name
}

func init() { file_event_v1_service_proto_init() }
func file_event_v1_service_proto_init() {
	if File_event_v1_service_proto != nil {
		return
	}
	if !protoimpl.UnsafeEnabled {
		file_event_v1_service_proto_msgTypes[0].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*IngestEventRequest); i {
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
		file_event_v1_service_proto_msgTypes[1].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*IngestEventResponse); i {
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
		file_event_v1_service_proto_msgTypes[2].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*IngestEventResponse_ErrorWrapper); i {
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
	type x struct{}
	out := protoimpl.TypeBuilder{
		File: protoimpl.DescBuilder{
			GoPackagePath: reflect.TypeOf(x{}).PkgPath(),
			RawDescriptor: file_event_v1_service_proto_rawDesc,
			NumEnums:      0,
			NumMessages:   3,
			NumExtensions: 0,
			NumServices:   0,
		},
		GoTypes:           file_event_v1_service_proto_goTypes,
		DependencyIndexes: file_event_v1_service_proto_depIdxs,
		MessageInfos:      file_event_v1_service_proto_msgTypes,
	}.Build()
	File_event_v1_service_proto = out.File
	file_event_v1_service_proto_rawDesc = nil
	file_event_v1_service_proto_goTypes = nil
	file_event_v1_service_proto_depIdxs = nil
}
