// Code generated by protoc-gen-go. DO NOT EDIT.
// versions:
// 	protoc-gen-go v1.32.0
// 	protoc        (unknown)
// source: ai/v1/service.proto

package v1

import (
	_ "buf.build/gen/go/bufbuild/protovalidate/protocolbuffers/go/buf/validate"
	_ "github.com/envoyproxy/protoc-gen-validate/validate"
	_ "github.com/grpc-ecosystem/grpc-gateway/v2/protoc-gen-openapiv2/options"
	v1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
	_ "google.golang.org/genproto/googleapis/api/annotations"
	protoreflect "google.golang.org/protobuf/reflect/protoreflect"
	protoimpl "google.golang.org/protobuf/runtime/protoimpl"
	emptypb "google.golang.org/protobuf/types/known/emptypb"
	reflect "reflect"
	sync "sync"
)

const (
	// Verify that this generated code is sufficiently up-to-date.
	_ = protoimpl.EnforceVersion(20 - protoimpl.MinVersion)
	// Verify that runtime/protoimpl is sufficiently up-to-date.
	_ = protoimpl.EnforceVersion(protoimpl.MaxVersion - 20)
)

type Overrides struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Llm   LLM   `protobuf:"varint,1,opt,name=llm,proto3,enum=ai.v1.LLM" json:"llm,omitempty"`
	Model MODEL `protobuf:"varint,2,opt,name=model,proto3,enum=ai.v1.MODEL" json:"model,omitempty"`
}

func (x *Overrides) Reset() {
	*x = Overrides{}
	if protoimpl.UnsafeEnabled {
		mi := &file_ai_v1_service_proto_msgTypes[0]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *Overrides) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*Overrides) ProtoMessage() {}

func (x *Overrides) ProtoReflect() protoreflect.Message {
	mi := &file_ai_v1_service_proto_msgTypes[0]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use Overrides.ProtoReflect.Descriptor instead.
func (*Overrides) Descriptor() ([]byte, []int) {
	return file_ai_v1_service_proto_rawDescGZIP(), []int{0}
}

func (x *Overrides) GetLlm() LLM {
	if x != nil {
		return x.Llm
	}
	return LLM_LLM_UNSPECIFIED
}

func (x *Overrides) GetModel() MODEL {
	if x != nil {
		return x.Model
	}
	return MODEL_MODEL_UNSPECIFIED
}

type CreateTaskRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Task      *Task      `protobuf:"bytes,1,opt,name=task,proto3" json:"task,omitempty"`
	Overrides *Overrides `protobuf:"bytes,2,opt,name=overrides,proto3" json:"overrides,omitempty"`
}

func (x *CreateTaskRequest) Reset() {
	*x = CreateTaskRequest{}
	if protoimpl.UnsafeEnabled {
		mi := &file_ai_v1_service_proto_msgTypes[1]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *CreateTaskRequest) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*CreateTaskRequest) ProtoMessage() {}

func (x *CreateTaskRequest) ProtoReflect() protoreflect.Message {
	mi := &file_ai_v1_service_proto_msgTypes[1]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use CreateTaskRequest.ProtoReflect.Descriptor instead.
func (*CreateTaskRequest) Descriptor() ([]byte, []int) {
	return file_ai_v1_service_proto_rawDescGZIP(), []int{1}
}

func (x *CreateTaskRequest) GetTask() *Task {
	if x != nil {
		return x.Task
	}
	return nil
}

func (x *CreateTaskRequest) GetOverrides() *Overrides {
	if x != nil {
		return x.Overrides
	}
	return nil
}

// NOTE(frank): I'm considering having two event types. I'm not sure how I feel about sending
// inforamation that doesn't need to be sent every message in every message (i.e. id). Rather,
// we could send a "hello" event at the beginning with any metadata.
type TaskEvent struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Chunk string `protobuf:"bytes,1,opt,name=chunk,proto3" json:"chunk,omitempty"`
	Llm   LLM    `protobuf:"varint,2,opt,name=llm,proto3,enum=ai.v1.LLM" json:"llm,omitempty"`
	Model MODEL  `protobuf:"varint,3,opt,name=model,proto3,enum=ai.v1.MODEL" json:"model,omitempty"`
	Id    string `protobuf:"bytes,4,opt,name=id,proto3" json:"id,omitempty"`
}

func (x *TaskEvent) Reset() {
	*x = TaskEvent{}
	if protoimpl.UnsafeEnabled {
		mi := &file_ai_v1_service_proto_msgTypes[2]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *TaskEvent) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*TaskEvent) ProtoMessage() {}

func (x *TaskEvent) ProtoReflect() protoreflect.Message {
	mi := &file_ai_v1_service_proto_msgTypes[2]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use TaskEvent.ProtoReflect.Descriptor instead.
func (*TaskEvent) Descriptor() ([]byte, []int) {
	return file_ai_v1_service_proto_rawDescGZIP(), []int{2}
}

func (x *TaskEvent) GetChunk() string {
	if x != nil {
		return x.Chunk
	}
	return ""
}

func (x *TaskEvent) GetLlm() LLM {
	if x != nil {
		return x.Llm
	}
	return LLM_LLM_UNSPECIFIED
}

func (x *TaskEvent) GetModel() MODEL {
	if x != nil {
		return x.Model
	}
	return MODEL_MODEL_UNSPECIFIED
}

func (x *TaskEvent) GetId() string {
	if x != nil {
		return x.Id
	}
	return ""
}

var File_ai_v1_service_proto protoreflect.FileDescriptor

var file_ai_v1_service_proto_rawDesc = []byte{
	0x0a, 0x13, 0x61, 0x69, 0x2f, 0x76, 0x31, 0x2f, 0x73, 0x65, 0x72, 0x76, 0x69, 0x63, 0x65, 0x2e,
	0x70, 0x72, 0x6f, 0x74, 0x6f, 0x12, 0x05, 0x61, 0x69, 0x2e, 0x76, 0x31, 0x1a, 0x0e, 0x61, 0x69,
	0x2f, 0x76, 0x31, 0x2f, 0x61, 0x69, 0x2e, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x1a, 0x1b, 0x62, 0x75,
	0x66, 0x2f, 0x76, 0x61, 0x6c, 0x69, 0x64, 0x61, 0x74, 0x65, 0x2f, 0x76, 0x61, 0x6c, 0x69, 0x64,
	0x61, 0x74, 0x65, 0x2e, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x1a, 0x16, 0x63, 0x6f, 0x6d, 0x6d, 0x6f,
	0x6e, 0x2f, 0x76, 0x31, 0x2f, 0x68, 0x65, 0x61, 0x6c, 0x74, 0x68, 0x2e, 0x70, 0x72, 0x6f, 0x74,
	0x6f, 0x1a, 0x1c, 0x67, 0x6f, 0x6f, 0x67, 0x6c, 0x65, 0x2f, 0x61, 0x70, 0x69, 0x2f, 0x61, 0x6e,
	0x6e, 0x6f, 0x74, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x73, 0x2e, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x1a,
	0x1b, 0x67, 0x6f, 0x6f, 0x67, 0x6c, 0x65, 0x2f, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x62, 0x75, 0x66,
	0x2f, 0x65, 0x6d, 0x70, 0x74, 0x79, 0x2e, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x1a, 0x2e, 0x70, 0x72,
	0x6f, 0x74, 0x6f, 0x63, 0x2d, 0x67, 0x65, 0x6e, 0x2d, 0x6f, 0x70, 0x65, 0x6e, 0x61, 0x70, 0x69,
	0x76, 0x32, 0x2f, 0x6f, 0x70, 0x74, 0x69, 0x6f, 0x6e, 0x73, 0x2f, 0x61, 0x6e, 0x6e, 0x6f, 0x74,
	0x61, 0x74, 0x69, 0x6f, 0x6e, 0x73, 0x2e, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x1a, 0x17, 0x76, 0x61,
	0x6c, 0x69, 0x64, 0x61, 0x74, 0x65, 0x2f, 0x76, 0x61, 0x6c, 0x69, 0x64, 0x61, 0x74, 0x65, 0x2e,
	0x70, 0x72, 0x6f, 0x74, 0x6f, 0x22, 0x4d, 0x0a, 0x09, 0x4f, 0x76, 0x65, 0x72, 0x72, 0x69, 0x64,
	0x65, 0x73, 0x12, 0x1c, 0x0a, 0x03, 0x6c, 0x6c, 0x6d, 0x18, 0x01, 0x20, 0x01, 0x28, 0x0e, 0x32,
	0x0a, 0x2e, 0x61, 0x69, 0x2e, 0x76, 0x31, 0x2e, 0x4c, 0x4c, 0x4d, 0x52, 0x03, 0x6c, 0x6c, 0x6d,
	0x12, 0x22, 0x0a, 0x05, 0x6d, 0x6f, 0x64, 0x65, 0x6c, 0x18, 0x02, 0x20, 0x01, 0x28, 0x0e, 0x32,
	0x0c, 0x2e, 0x61, 0x69, 0x2e, 0x76, 0x31, 0x2e, 0x4d, 0x4f, 0x44, 0x45, 0x4c, 0x52, 0x05, 0x6d,
	0x6f, 0x64, 0x65, 0x6c, 0x22, 0x74, 0x0a, 0x11, 0x43, 0x72, 0x65, 0x61, 0x74, 0x65, 0x54, 0x61,
	0x73, 0x6b, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x12, 0x2f, 0x0a, 0x04, 0x74, 0x61, 0x73,
	0x6b, 0x18, 0x01, 0x20, 0x01, 0x28, 0x0b, 0x32, 0x0b, 0x2e, 0x61, 0x69, 0x2e, 0x76, 0x31, 0x2e,
	0x54, 0x61, 0x73, 0x6b, 0x42, 0x0e, 0xfa, 0x42, 0x05, 0x8a, 0x01, 0x02, 0x10, 0x01, 0xba, 0x48,
	0x03, 0xc8, 0x01, 0x01, 0x52, 0x04, 0x74, 0x61, 0x73, 0x6b, 0x12, 0x2e, 0x0a, 0x09, 0x6f, 0x76,
	0x65, 0x72, 0x72, 0x69, 0x64, 0x65, 0x73, 0x18, 0x02, 0x20, 0x01, 0x28, 0x0b, 0x32, 0x10, 0x2e,
	0x61, 0x69, 0x2e, 0x76, 0x31, 0x2e, 0x4f, 0x76, 0x65, 0x72, 0x72, 0x69, 0x64, 0x65, 0x73, 0x52,
	0x09, 0x6f, 0x76, 0x65, 0x72, 0x72, 0x69, 0x64, 0x65, 0x73, 0x22, 0x73, 0x0a, 0x09, 0x54, 0x61,
	0x73, 0x6b, 0x45, 0x76, 0x65, 0x6e, 0x74, 0x12, 0x14, 0x0a, 0x05, 0x63, 0x68, 0x75, 0x6e, 0x6b,
	0x18, 0x01, 0x20, 0x01, 0x28, 0x09, 0x52, 0x05, 0x63, 0x68, 0x75, 0x6e, 0x6b, 0x12, 0x1c, 0x0a,
	0x03, 0x6c, 0x6c, 0x6d, 0x18, 0x02, 0x20, 0x01, 0x28, 0x0e, 0x32, 0x0a, 0x2e, 0x61, 0x69, 0x2e,
	0x76, 0x31, 0x2e, 0x4c, 0x4c, 0x4d, 0x52, 0x03, 0x6c, 0x6c, 0x6d, 0x12, 0x22, 0x0a, 0x05, 0x6d,
	0x6f, 0x64, 0x65, 0x6c, 0x18, 0x03, 0x20, 0x01, 0x28, 0x0e, 0x32, 0x0c, 0x2e, 0x61, 0x69, 0x2e,
	0x76, 0x31, 0x2e, 0x4d, 0x4f, 0x44, 0x45, 0x4c, 0x52, 0x05, 0x6d, 0x6f, 0x64, 0x65, 0x6c, 0x12,
	0x0e, 0x0a, 0x02, 0x69, 0x64, 0x18, 0x04, 0x20, 0x01, 0x28, 0x09, 0x52, 0x02, 0x69, 0x64, 0x32,
	0x8d, 0x01, 0x0a, 0x0f, 0x4d, 0x65, 0x74, 0x61, 0x64, 0x61, 0x74, 0x61, 0x53, 0x65, 0x72, 0x76,
	0x69, 0x63, 0x65, 0x12, 0x7a, 0x0a, 0x06, 0x48, 0x65, 0x61, 0x6c, 0x74, 0x68, 0x12, 0x16, 0x2e,
	0x67, 0x6f, 0x6f, 0x67, 0x6c, 0x65, 0x2e, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x62, 0x75, 0x66, 0x2e,
	0x45, 0x6d, 0x70, 0x74, 0x79, 0x1a, 0x19, 0x2e, 0x63, 0x6f, 0x6d, 0x6d, 0x6f, 0x6e, 0x2e, 0x76,
	0x31, 0x2e, 0x48, 0x65, 0x61, 0x6c, 0x74, 0x68, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65,
	0x22, 0x3d, 0x92, 0x41, 0x10, 0x2a, 0x0e, 0x53, 0x65, 0x72, 0x76, 0x69, 0x63, 0x65, 0x20, 0x48,
	0x65, 0x61, 0x6c, 0x74, 0x68, 0x82, 0xd3, 0xe4, 0x93, 0x02, 0x24, 0x5a, 0x13, 0x12, 0x11, 0x2f,
	0x61, 0x70, 0x69, 0x2f, 0x76, 0x31, 0x2f, 0x61, 0x69, 0x2f, 0x68, 0x65, 0x61, 0x6c, 0x74, 0x68,
	0x12, 0x0d, 0x2f, 0x76, 0x31, 0x2f, 0x61, 0x69, 0x2f, 0x68, 0x65, 0x61, 0x6c, 0x74, 0x68, 0x32,
	0x85, 0x01, 0x0a, 0x0b, 0x54, 0x61, 0x73, 0x6b, 0x53, 0x65, 0x72, 0x76, 0x69, 0x63, 0x65, 0x12,
	0x76, 0x0a, 0x06, 0x43, 0x72, 0x65, 0x61, 0x74, 0x65, 0x12, 0x18, 0x2e, 0x61, 0x69, 0x2e, 0x76,
	0x31, 0x2e, 0x43, 0x72, 0x65, 0x61, 0x74, 0x65, 0x54, 0x61, 0x73, 0x6b, 0x52, 0x65, 0x71, 0x75,
	0x65, 0x73, 0x74, 0x1a, 0x10, 0x2e, 0x61, 0x69, 0x2e, 0x76, 0x31, 0x2e, 0x54, 0x61, 0x73, 0x6b,
	0x45, 0x76, 0x65, 0x6e, 0x74, 0x22, 0x3e, 0x92, 0x41, 0x0d, 0x2a, 0x0b, 0x43, 0x72, 0x65, 0x61,
	0x74, 0x65, 0x20, 0x54, 0x61, 0x73, 0x6b, 0x82, 0xd3, 0xe4, 0x93, 0x02, 0x28, 0x3a, 0x01, 0x2a,
	0x5a, 0x15, 0x3a, 0x01, 0x2a, 0x22, 0x10, 0x2f, 0x61, 0x70, 0x69, 0x2f, 0x76, 0x31, 0x2f, 0x61,
	0x69, 0x2f, 0x74, 0x61, 0x73, 0x6b, 0x73, 0x22, 0x0c, 0x2f, 0x76, 0x31, 0x2f, 0x61, 0x69, 0x2f,
	0x74, 0x61, 0x73, 0x6b, 0x73, 0x30, 0x01, 0x42, 0x7e, 0x92, 0x41, 0x46, 0x12, 0x1d, 0x0a, 0x16,
	0x53, 0x75, 0x70, 0x65, 0x72, 0x62, 0x6c, 0x6f, 0x63, 0x6b, 0x73, 0x20, 0x41, 0x49, 0x20, 0x53,
	0x65, 0x72, 0x76, 0x69, 0x63, 0x65, 0x32, 0x03, 0x31, 0x2e, 0x30, 0x2a, 0x01, 0x02, 0x32, 0x10,
	0x61, 0x70, 0x70, 0x6c, 0x69, 0x63, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x2f, 0x6a, 0x73, 0x6f, 0x6e,
	0x3a, 0x10, 0x61, 0x70, 0x70, 0x6c, 0x69, 0x63, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x2f, 0x6a, 0x73,
	0x6f, 0x6e, 0x5a, 0x33, 0x67, 0x69, 0x74, 0x68, 0x75, 0x62, 0x2e, 0x63, 0x6f, 0x6d, 0x2f, 0x73,
	0x75, 0x70, 0x65, 0x72, 0x62, 0x6c, 0x6f, 0x63, 0x6b, 0x73, 0x74, 0x65, 0x61, 0x6d, 0x2f, 0x61,
	0x67, 0x65, 0x6e, 0x74, 0x2f, 0x74, 0x79, 0x70, 0x65, 0x73, 0x2f, 0x67, 0x65, 0x6e, 0x2f, 0x67,
	0x6f, 0x2f, 0x61, 0x69, 0x2f, 0x76, 0x31, 0x62, 0x06, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x33,
}

var (
	file_ai_v1_service_proto_rawDescOnce sync.Once
	file_ai_v1_service_proto_rawDescData = file_ai_v1_service_proto_rawDesc
)

func file_ai_v1_service_proto_rawDescGZIP() []byte {
	file_ai_v1_service_proto_rawDescOnce.Do(func() {
		file_ai_v1_service_proto_rawDescData = protoimpl.X.CompressGZIP(file_ai_v1_service_proto_rawDescData)
	})
	return file_ai_v1_service_proto_rawDescData
}

var file_ai_v1_service_proto_msgTypes = make([]protoimpl.MessageInfo, 3)
var file_ai_v1_service_proto_goTypes = []interface{}{
	(*Overrides)(nil),         // 0: ai.v1.Overrides
	(*CreateTaskRequest)(nil), // 1: ai.v1.CreateTaskRequest
	(*TaskEvent)(nil),         // 2: ai.v1.TaskEvent
	(LLM)(0),                  // 3: ai.v1.LLM
	(MODEL)(0),                // 4: ai.v1.MODEL
	(*Task)(nil),              // 5: ai.v1.Task
	(*emptypb.Empty)(nil),     // 6: google.protobuf.Empty
	(*v1.HealthResponse)(nil), // 7: common.v1.HealthResponse
}
var file_ai_v1_service_proto_depIdxs = []int32{
	3, // 0: ai.v1.Overrides.llm:type_name -> ai.v1.LLM
	4, // 1: ai.v1.Overrides.model:type_name -> ai.v1.MODEL
	5, // 2: ai.v1.CreateTaskRequest.task:type_name -> ai.v1.Task
	0, // 3: ai.v1.CreateTaskRequest.overrides:type_name -> ai.v1.Overrides
	3, // 4: ai.v1.TaskEvent.llm:type_name -> ai.v1.LLM
	4, // 5: ai.v1.TaskEvent.model:type_name -> ai.v1.MODEL
	6, // 6: ai.v1.MetadataService.Health:input_type -> google.protobuf.Empty
	1, // 7: ai.v1.TaskService.Create:input_type -> ai.v1.CreateTaskRequest
	7, // 8: ai.v1.MetadataService.Health:output_type -> common.v1.HealthResponse
	2, // 9: ai.v1.TaskService.Create:output_type -> ai.v1.TaskEvent
	8, // [8:10] is the sub-list for method output_type
	6, // [6:8] is the sub-list for method input_type
	6, // [6:6] is the sub-list for extension type_name
	6, // [6:6] is the sub-list for extension extendee
	0, // [0:6] is the sub-list for field type_name
}

func init() { file_ai_v1_service_proto_init() }
func file_ai_v1_service_proto_init() {
	if File_ai_v1_service_proto != nil {
		return
	}
	file_ai_v1_ai_proto_init()
	if !protoimpl.UnsafeEnabled {
		file_ai_v1_service_proto_msgTypes[0].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*Overrides); i {
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
		file_ai_v1_service_proto_msgTypes[1].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*CreateTaskRequest); i {
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
		file_ai_v1_service_proto_msgTypes[2].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*TaskEvent); i {
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
			RawDescriptor: file_ai_v1_service_proto_rawDesc,
			NumEnums:      0,
			NumMessages:   3,
			NumExtensions: 0,
			NumServices:   2,
		},
		GoTypes:           file_ai_v1_service_proto_goTypes,
		DependencyIndexes: file_ai_v1_service_proto_depIdxs,
		MessageInfos:      file_ai_v1_service_proto_msgTypes,
	}.Build()
	File_ai_v1_service_proto = out.File
	file_ai_v1_service_proto_rawDesc = nil
	file_ai_v1_service_proto_goTypes = nil
	file_ai_v1_service_proto_depIdxs = nil
}