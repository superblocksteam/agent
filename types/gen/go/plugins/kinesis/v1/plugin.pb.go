// Code generated by protoc-gen-go. DO NOT EDIT.
// versions:
// 	protoc-gen-go v1.32.0
// 	protoc        (unknown)
// source: plugins/kinesis/v1/plugin.proto

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

// https://docs.aws.amazon.com/kinesis/latest/APIReference/API_GetShardIterator.html#API_GetShardIterator_RequestSyntax
type Plugin_ShardIteratorType int32

const (
	Plugin_SHARD_ITERATOR_TYPE_UNSPECIFIED           Plugin_ShardIteratorType = 0
	Plugin_SHARD_ITERATOR_TYPE_AT_SEQUENCE_NUMBER    Plugin_ShardIteratorType = 1
	Plugin_SHARD_ITERATOR_TYPE_AFTER_SEQUENCE_NUMBER Plugin_ShardIteratorType = 2
	Plugin_SHARD_ITERATOR_TYPE_AT_TIMESTAMP          Plugin_ShardIteratorType = 3
	Plugin_SHARD_ITERATOR_TYPE_TRIM_HORIZON          Plugin_ShardIteratorType = 4
	Plugin_SHARD_ITERATOR_TYPE_LATEST                Plugin_ShardIteratorType = 5
)

// Enum value maps for Plugin_ShardIteratorType.
var (
	Plugin_ShardIteratorType_name = map[int32]string{
		0: "SHARD_ITERATOR_TYPE_UNSPECIFIED",
		1: "SHARD_ITERATOR_TYPE_AT_SEQUENCE_NUMBER",
		2: "SHARD_ITERATOR_TYPE_AFTER_SEQUENCE_NUMBER",
		3: "SHARD_ITERATOR_TYPE_AT_TIMESTAMP",
		4: "SHARD_ITERATOR_TYPE_TRIM_HORIZON",
		5: "SHARD_ITERATOR_TYPE_LATEST",
	}
	Plugin_ShardIteratorType_value = map[string]int32{
		"SHARD_ITERATOR_TYPE_UNSPECIFIED":           0,
		"SHARD_ITERATOR_TYPE_AT_SEQUENCE_NUMBER":    1,
		"SHARD_ITERATOR_TYPE_AFTER_SEQUENCE_NUMBER": 2,
		"SHARD_ITERATOR_TYPE_AT_TIMESTAMP":          3,
		"SHARD_ITERATOR_TYPE_TRIM_HORIZON":          4,
		"SHARD_ITERATOR_TYPE_LATEST":                5,
	}
)

func (x Plugin_ShardIteratorType) Enum() *Plugin_ShardIteratorType {
	p := new(Plugin_ShardIteratorType)
	*p = x
	return p
}

func (x Plugin_ShardIteratorType) String() string {
	return protoimpl.X.EnumStringOf(x.Descriptor(), protoreflect.EnumNumber(x))
}

func (Plugin_ShardIteratorType) Descriptor() protoreflect.EnumDescriptor {
	return file_plugins_kinesis_v1_plugin_proto_enumTypes[0].Descriptor()
}

func (Plugin_ShardIteratorType) Type() protoreflect.EnumType {
	return &file_plugins_kinesis_v1_plugin_proto_enumTypes[0]
}

func (x Plugin_ShardIteratorType) Number() protoreflect.EnumNumber {
	return protoreflect.EnumNumber(x)
}

// Deprecated: Use Plugin_ShardIteratorType.Descriptor instead.
func (Plugin_ShardIteratorType) EnumDescriptor() ([]byte, []int) {
	return file_plugins_kinesis_v1_plugin_proto_rawDescGZIP(), []int{0, 0}
}

type Plugin_OperationType int32

const (
	Plugin_OPERATION_TYPE_UNSPECIFIED Plugin_OperationType = 0
	Plugin_OPERATION_TYPE_GET         Plugin_OperationType = 1
	Plugin_OPERATION_TYPE_PUT         Plugin_OperationType = 2
)

// Enum value maps for Plugin_OperationType.
var (
	Plugin_OperationType_name = map[int32]string{
		0: "OPERATION_TYPE_UNSPECIFIED",
		1: "OPERATION_TYPE_GET",
		2: "OPERATION_TYPE_PUT",
	}
	Plugin_OperationType_value = map[string]int32{
		"OPERATION_TYPE_UNSPECIFIED": 0,
		"OPERATION_TYPE_GET":         1,
		"OPERATION_TYPE_PUT":         2,
	}
)

func (x Plugin_OperationType) Enum() *Plugin_OperationType {
	p := new(Plugin_OperationType)
	*p = x
	return p
}

func (x Plugin_OperationType) String() string {
	return protoimpl.X.EnumStringOf(x.Descriptor(), protoreflect.EnumNumber(x))
}

func (Plugin_OperationType) Descriptor() protoreflect.EnumDescriptor {
	return file_plugins_kinesis_v1_plugin_proto_enumTypes[1].Descriptor()
}

func (Plugin_OperationType) Type() protoreflect.EnumType {
	return &file_plugins_kinesis_v1_plugin_proto_enumTypes[1]
}

func (x Plugin_OperationType) Number() protoreflect.EnumNumber {
	return protoreflect.EnumNumber(x)
}

// Deprecated: Use Plugin_OperationType.Descriptor instead.
func (Plugin_OperationType) EnumDescriptor() ([]byte, []int) {
	return file_plugins_kinesis_v1_plugin_proto_rawDescGZIP(), []int{0, 1}
}

type Plugin_StreamIdentifier int32

const (
	Plugin_STREAM_IDENTIFIER_UNSPECIFIED Plugin_StreamIdentifier = 0
	Plugin_STREAM_IDENTIFIER_STREAM_NAME Plugin_StreamIdentifier = 1
	Plugin_STREAM_IDENTIFIER_STREAM_ARN  Plugin_StreamIdentifier = 2
)

// Enum value maps for Plugin_StreamIdentifier.
var (
	Plugin_StreamIdentifier_name = map[int32]string{
		0: "STREAM_IDENTIFIER_UNSPECIFIED",
		1: "STREAM_IDENTIFIER_STREAM_NAME",
		2: "STREAM_IDENTIFIER_STREAM_ARN",
	}
	Plugin_StreamIdentifier_value = map[string]int32{
		"STREAM_IDENTIFIER_UNSPECIFIED": 0,
		"STREAM_IDENTIFIER_STREAM_NAME": 1,
		"STREAM_IDENTIFIER_STREAM_ARN":  2,
	}
)

func (x Plugin_StreamIdentifier) Enum() *Plugin_StreamIdentifier {
	p := new(Plugin_StreamIdentifier)
	*p = x
	return p
}

func (x Plugin_StreamIdentifier) String() string {
	return protoimpl.X.EnumStringOf(x.Descriptor(), protoreflect.EnumNumber(x))
}

func (Plugin_StreamIdentifier) Descriptor() protoreflect.EnumDescriptor {
	return file_plugins_kinesis_v1_plugin_proto_enumTypes[2].Descriptor()
}

func (Plugin_StreamIdentifier) Type() protoreflect.EnumType {
	return &file_plugins_kinesis_v1_plugin_proto_enumTypes[2]
}

func (x Plugin_StreamIdentifier) Number() protoreflect.EnumNumber {
	return protoreflect.EnumNumber(x)
}

// Deprecated: Use Plugin_StreamIdentifier.Descriptor instead.
func (Plugin_StreamIdentifier) EnumDescriptor() ([]byte, []int) {
	return file_plugins_kinesis_v1_plugin_proto_rawDescGZIP(), []int{0, 2}
}

type Plugin struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Name                         *string                          `protobuf:"bytes,1,opt,name=name,proto3,oneof" json:"name,omitempty"`
	Connection                   *Plugin_KinesisConnection        `protobuf:"bytes,2,opt,name=connection,proto3" json:"connection,omitempty"`
	OperationType                Plugin_OperationType             `protobuf:"varint,3,opt,name=operation_type,json=operationType,proto3,enum=plugins.kinesis.v1.Plugin_OperationType" json:"operation_type,omitempty"`
	Put                          *Plugin_KinesisPut               `protobuf:"bytes,4,opt,name=put,proto3,oneof" json:"put,omitempty"`
	Get                          *Plugin_KinesisGet               `protobuf:"bytes,5,opt,name=get,proto3,oneof" json:"get,omitempty"`
	DynamicWorkflowConfiguration *v1.DynamicWorkflowConfiguration `protobuf:"bytes,6,opt,name=dynamic_workflow_configuration,json=dynamicWorkflowConfiguration,proto3,oneof" json:"dynamic_workflow_configuration,omitempty"`
}

func (x *Plugin) Reset() {
	*x = Plugin{}
	if protoimpl.UnsafeEnabled {
		mi := &file_plugins_kinesis_v1_plugin_proto_msgTypes[0]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *Plugin) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*Plugin) ProtoMessage() {}

func (x *Plugin) ProtoReflect() protoreflect.Message {
	mi := &file_plugins_kinesis_v1_plugin_proto_msgTypes[0]
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
	return file_plugins_kinesis_v1_plugin_proto_rawDescGZIP(), []int{0}
}

func (x *Plugin) GetName() string {
	if x != nil && x.Name != nil {
		return *x.Name
	}
	return ""
}

func (x *Plugin) GetConnection() *Plugin_KinesisConnection {
	if x != nil {
		return x.Connection
	}
	return nil
}

func (x *Plugin) GetOperationType() Plugin_OperationType {
	if x != nil {
		return x.OperationType
	}
	return Plugin_OPERATION_TYPE_UNSPECIFIED
}

func (x *Plugin) GetPut() *Plugin_KinesisPut {
	if x != nil {
		return x.Put
	}
	return nil
}

func (x *Plugin) GetGet() *Plugin_KinesisGet {
	if x != nil {
		return x.Get
	}
	return nil
}

func (x *Plugin) GetDynamicWorkflowConfiguration() *v1.DynamicWorkflowConfiguration {
	if x != nil {
		return x.DynamicWorkflowConfiguration
	}
	return nil
}

type Metadata struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Streams []string `protobuf:"bytes,1,rep,name=streams,proto3" json:"streams,omitempty"`
}

func (x *Metadata) Reset() {
	*x = Metadata{}
	if protoimpl.UnsafeEnabled {
		mi := &file_plugins_kinesis_v1_plugin_proto_msgTypes[1]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *Metadata) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*Metadata) ProtoMessage() {}

func (x *Metadata) ProtoReflect() protoreflect.Message {
	mi := &file_plugins_kinesis_v1_plugin_proto_msgTypes[1]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use Metadata.ProtoReflect.Descriptor instead.
func (*Metadata) Descriptor() ([]byte, []int) {
	return file_plugins_kinesis_v1_plugin_proto_rawDescGZIP(), []int{1}
}

func (x *Metadata) GetStreams() []string {
	if x != nil {
		return x.Streams
	}
	return nil
}

type Plugin_KinesisConnection struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	AwsConfig *v1.AWSConfig `protobuf:"bytes,1,opt,name=aws_config,json=awsConfig,proto3" json:"aws_config,omitempty"`
}

func (x *Plugin_KinesisConnection) Reset() {
	*x = Plugin_KinesisConnection{}
	if protoimpl.UnsafeEnabled {
		mi := &file_plugins_kinesis_v1_plugin_proto_msgTypes[2]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *Plugin_KinesisConnection) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*Plugin_KinesisConnection) ProtoMessage() {}

func (x *Plugin_KinesisConnection) ProtoReflect() protoreflect.Message {
	mi := &file_plugins_kinesis_v1_plugin_proto_msgTypes[2]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use Plugin_KinesisConnection.ProtoReflect.Descriptor instead.
func (*Plugin_KinesisConnection) Descriptor() ([]byte, []int) {
	return file_plugins_kinesis_v1_plugin_proto_rawDescGZIP(), []int{0, 0}
}

func (x *Plugin_KinesisConnection) GetAwsConfig() *v1.AWSConfig {
	if x != nil {
		return x.AwsConfig
	}
	return nil
}

// https://docs.aws.amazon.com/kinesis/latest/APIReference/API_PutRecord.html
// https://docs.aws.amazon.com/kinesis/latest/APIReference/API_PutRecords.html
type Plugin_KinesisPut struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Data                 string                  `protobuf:"bytes,1,opt,name=data,proto3" json:"data,omitempty"`
	PartitionKey         string                  `protobuf:"bytes,2,opt,name=partition_key,json=partitionKey,proto3" json:"partition_key,omitempty"`
	StreamIdentifierType Plugin_StreamIdentifier `protobuf:"varint,3,opt,name=stream_identifier_type,json=streamIdentifierType,proto3,enum=plugins.kinesis.v1.Plugin_StreamIdentifier" json:"stream_identifier_type,omitempty"`
	StreamName           *string                 `protobuf:"bytes,4,opt,name=stream_name,json=streamName,proto3,oneof" json:"stream_name,omitempty"`
	StreamArn            *string                 `protobuf:"bytes,5,opt,name=stream_arn,json=streamArn,proto3,oneof" json:"stream_arn,omitempty"`
}

func (x *Plugin_KinesisPut) Reset() {
	*x = Plugin_KinesisPut{}
	if protoimpl.UnsafeEnabled {
		mi := &file_plugins_kinesis_v1_plugin_proto_msgTypes[3]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *Plugin_KinesisPut) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*Plugin_KinesisPut) ProtoMessage() {}

func (x *Plugin_KinesisPut) ProtoReflect() protoreflect.Message {
	mi := &file_plugins_kinesis_v1_plugin_proto_msgTypes[3]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use Plugin_KinesisPut.ProtoReflect.Descriptor instead.
func (*Plugin_KinesisPut) Descriptor() ([]byte, []int) {
	return file_plugins_kinesis_v1_plugin_proto_rawDescGZIP(), []int{0, 1}
}

func (x *Plugin_KinesisPut) GetData() string {
	if x != nil {
		return x.Data
	}
	return ""
}

func (x *Plugin_KinesisPut) GetPartitionKey() string {
	if x != nil {
		return x.PartitionKey
	}
	return ""
}

func (x *Plugin_KinesisPut) GetStreamIdentifierType() Plugin_StreamIdentifier {
	if x != nil {
		return x.StreamIdentifierType
	}
	return Plugin_STREAM_IDENTIFIER_UNSPECIFIED
}

func (x *Plugin_KinesisPut) GetStreamName() string {
	if x != nil && x.StreamName != nil {
		return *x.StreamName
	}
	return ""
}

func (x *Plugin_KinesisPut) GetStreamArn() string {
	if x != nil && x.StreamArn != nil {
		return *x.StreamArn
	}
	return ""
}

// https://docs.aws.amazon.com/kinesis/latest/APIReference/API_GetRecords.html
// we will need to get a shard iterator first
// https://docs.aws.amazon.com/kinesis/latest/APIReference/API_GetShardIterator.html
type Plugin_KinesisGet struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	ShardId           string                   `protobuf:"bytes,2,opt,name=shard_id,json=shardId,proto3" json:"shard_id,omitempty"`
	ShardIteratorType Plugin_ShardIteratorType `protobuf:"varint,3,opt,name=shard_iterator_type,json=shardIteratorType,proto3,enum=plugins.kinesis.v1.Plugin_ShardIteratorType" json:"shard_iterator_type,omitempty"`
	Limit             int32                    `protobuf:"varint,4,opt,name=limit,proto3" json:"limit,omitempty"`
	// not required by kinesis, but something we want to allow users to configure
	// this is the amount of time in milliseconds between asking kinesis to get records when polling in a loop
	PollingCooldownMs int32 `protobuf:"varint,5,opt,name=polling_cooldown_ms,json=pollingCooldownMs,proto3" json:"polling_cooldown_ms,omitempty"`
	// these 2 are required depending on the shard iterator type selected
	StartingSequenceNumber *string                 `protobuf:"bytes,6,opt,name=starting_sequence_number,json=startingSequenceNumber,proto3,oneof" json:"starting_sequence_number,omitempty"`
	Timestamp              *string                 `protobuf:"bytes,7,opt,name=timestamp,proto3,oneof" json:"timestamp,omitempty"`
	StreamIdentifierType   Plugin_StreamIdentifier `protobuf:"varint,8,opt,name=stream_identifier_type,json=streamIdentifierType,proto3,enum=plugins.kinesis.v1.Plugin_StreamIdentifier" json:"stream_identifier_type,omitempty"`
	StreamName             *string                 `protobuf:"bytes,9,opt,name=stream_name,json=streamName,proto3,oneof" json:"stream_name,omitempty"`
	StreamArn              *string                 `protobuf:"bytes,10,opt,name=stream_arn,json=streamArn,proto3,oneof" json:"stream_arn,omitempty"`
}

func (x *Plugin_KinesisGet) Reset() {
	*x = Plugin_KinesisGet{}
	if protoimpl.UnsafeEnabled {
		mi := &file_plugins_kinesis_v1_plugin_proto_msgTypes[4]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *Plugin_KinesisGet) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*Plugin_KinesisGet) ProtoMessage() {}

func (x *Plugin_KinesisGet) ProtoReflect() protoreflect.Message {
	mi := &file_plugins_kinesis_v1_plugin_proto_msgTypes[4]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use Plugin_KinesisGet.ProtoReflect.Descriptor instead.
func (*Plugin_KinesisGet) Descriptor() ([]byte, []int) {
	return file_plugins_kinesis_v1_plugin_proto_rawDescGZIP(), []int{0, 2}
}

func (x *Plugin_KinesisGet) GetShardId() string {
	if x != nil {
		return x.ShardId
	}
	return ""
}

func (x *Plugin_KinesisGet) GetShardIteratorType() Plugin_ShardIteratorType {
	if x != nil {
		return x.ShardIteratorType
	}
	return Plugin_SHARD_ITERATOR_TYPE_UNSPECIFIED
}

func (x *Plugin_KinesisGet) GetLimit() int32 {
	if x != nil {
		return x.Limit
	}
	return 0
}

func (x *Plugin_KinesisGet) GetPollingCooldownMs() int32 {
	if x != nil {
		return x.PollingCooldownMs
	}
	return 0
}

func (x *Plugin_KinesisGet) GetStartingSequenceNumber() string {
	if x != nil && x.StartingSequenceNumber != nil {
		return *x.StartingSequenceNumber
	}
	return ""
}

func (x *Plugin_KinesisGet) GetTimestamp() string {
	if x != nil && x.Timestamp != nil {
		return *x.Timestamp
	}
	return ""
}

func (x *Plugin_KinesisGet) GetStreamIdentifierType() Plugin_StreamIdentifier {
	if x != nil {
		return x.StreamIdentifierType
	}
	return Plugin_STREAM_IDENTIFIER_UNSPECIFIED
}

func (x *Plugin_KinesisGet) GetStreamName() string {
	if x != nil && x.StreamName != nil {
		return *x.StreamName
	}
	return ""
}

func (x *Plugin_KinesisGet) GetStreamArn() string {
	if x != nil && x.StreamArn != nil {
		return *x.StreamArn
	}
	return ""
}

var File_plugins_kinesis_v1_plugin_proto protoreflect.FileDescriptor

var file_plugins_kinesis_v1_plugin_proto_rawDesc = []byte{
	0x0a, 0x1f, 0x70, 0x6c, 0x75, 0x67, 0x69, 0x6e, 0x73, 0x2f, 0x6b, 0x69, 0x6e, 0x65, 0x73, 0x69,
	0x73, 0x2f, 0x76, 0x31, 0x2f, 0x70, 0x6c, 0x75, 0x67, 0x69, 0x6e, 0x2e, 0x70, 0x72, 0x6f, 0x74,
	0x6f, 0x12, 0x12, 0x70, 0x6c, 0x75, 0x67, 0x69, 0x6e, 0x73, 0x2e, 0x6b, 0x69, 0x6e, 0x65, 0x73,
	0x69, 0x73, 0x2e, 0x76, 0x31, 0x1a, 0x1e, 0x70, 0x6c, 0x75, 0x67, 0x69, 0x6e, 0x73, 0x2f, 0x63,
	0x6f, 0x6d, 0x6d, 0x6f, 0x6e, 0x2f, 0x76, 0x31, 0x2f, 0x70, 0x6c, 0x75, 0x67, 0x69, 0x6e, 0x2e,
	0x70, 0x72, 0x6f, 0x74, 0x6f, 0x22, 0xe0, 0x0e, 0x0a, 0x06, 0x50, 0x6c, 0x75, 0x67, 0x69, 0x6e,
	0x12, 0x17, 0x0a, 0x04, 0x6e, 0x61, 0x6d, 0x65, 0x18, 0x01, 0x20, 0x01, 0x28, 0x09, 0x48, 0x00,
	0x52, 0x04, 0x6e, 0x61, 0x6d, 0x65, 0x88, 0x01, 0x01, 0x12, 0x4c, 0x0a, 0x0a, 0x63, 0x6f, 0x6e,
	0x6e, 0x65, 0x63, 0x74, 0x69, 0x6f, 0x6e, 0x18, 0x02, 0x20, 0x01, 0x28, 0x0b, 0x32, 0x2c, 0x2e,
	0x70, 0x6c, 0x75, 0x67, 0x69, 0x6e, 0x73, 0x2e, 0x6b, 0x69, 0x6e, 0x65, 0x73, 0x69, 0x73, 0x2e,
	0x76, 0x31, 0x2e, 0x50, 0x6c, 0x75, 0x67, 0x69, 0x6e, 0x2e, 0x4b, 0x69, 0x6e, 0x65, 0x73, 0x69,
	0x73, 0x43, 0x6f, 0x6e, 0x6e, 0x65, 0x63, 0x74, 0x69, 0x6f, 0x6e, 0x52, 0x0a, 0x63, 0x6f, 0x6e,
	0x6e, 0x65, 0x63, 0x74, 0x69, 0x6f, 0x6e, 0x12, 0x4f, 0x0a, 0x0e, 0x6f, 0x70, 0x65, 0x72, 0x61,
	0x74, 0x69, 0x6f, 0x6e, 0x5f, 0x74, 0x79, 0x70, 0x65, 0x18, 0x03, 0x20, 0x01, 0x28, 0x0e, 0x32,
	0x28, 0x2e, 0x70, 0x6c, 0x75, 0x67, 0x69, 0x6e, 0x73, 0x2e, 0x6b, 0x69, 0x6e, 0x65, 0x73, 0x69,
	0x73, 0x2e, 0x76, 0x31, 0x2e, 0x50, 0x6c, 0x75, 0x67, 0x69, 0x6e, 0x2e, 0x4f, 0x70, 0x65, 0x72,
	0x61, 0x74, 0x69, 0x6f, 0x6e, 0x54, 0x79, 0x70, 0x65, 0x52, 0x0d, 0x6f, 0x70, 0x65, 0x72, 0x61,
	0x74, 0x69, 0x6f, 0x6e, 0x54, 0x79, 0x70, 0x65, 0x12, 0x3c, 0x0a, 0x03, 0x70, 0x75, 0x74, 0x18,
	0x04, 0x20, 0x01, 0x28, 0x0b, 0x32, 0x25, 0x2e, 0x70, 0x6c, 0x75, 0x67, 0x69, 0x6e, 0x73, 0x2e,
	0x6b, 0x69, 0x6e, 0x65, 0x73, 0x69, 0x73, 0x2e, 0x76, 0x31, 0x2e, 0x50, 0x6c, 0x75, 0x67, 0x69,
	0x6e, 0x2e, 0x4b, 0x69, 0x6e, 0x65, 0x73, 0x69, 0x73, 0x50, 0x75, 0x74, 0x48, 0x01, 0x52, 0x03,
	0x70, 0x75, 0x74, 0x88, 0x01, 0x01, 0x12, 0x3c, 0x0a, 0x03, 0x67, 0x65, 0x74, 0x18, 0x05, 0x20,
	0x01, 0x28, 0x0b, 0x32, 0x25, 0x2e, 0x70, 0x6c, 0x75, 0x67, 0x69, 0x6e, 0x73, 0x2e, 0x6b, 0x69,
	0x6e, 0x65, 0x73, 0x69, 0x73, 0x2e, 0x76, 0x31, 0x2e, 0x50, 0x6c, 0x75, 0x67, 0x69, 0x6e, 0x2e,
	0x4b, 0x69, 0x6e, 0x65, 0x73, 0x69, 0x73, 0x47, 0x65, 0x74, 0x48, 0x02, 0x52, 0x03, 0x67, 0x65,
	0x74, 0x88, 0x01, 0x01, 0x12, 0x7a, 0x0a, 0x1e, 0x64, 0x79, 0x6e, 0x61, 0x6d, 0x69, 0x63, 0x5f,
	0x77, 0x6f, 0x72, 0x6b, 0x66, 0x6c, 0x6f, 0x77, 0x5f, 0x63, 0x6f, 0x6e, 0x66, 0x69, 0x67, 0x75,
	0x72, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x18, 0x06, 0x20, 0x01, 0x28, 0x0b, 0x32, 0x2f, 0x2e, 0x70,
	0x6c, 0x75, 0x67, 0x69, 0x6e, 0x73, 0x2e, 0x63, 0x6f, 0x6d, 0x6d, 0x6f, 0x6e, 0x2e, 0x76, 0x31,
	0x2e, 0x44, 0x79, 0x6e, 0x61, 0x6d, 0x69, 0x63, 0x57, 0x6f, 0x72, 0x6b, 0x66, 0x6c, 0x6f, 0x77,
	0x43, 0x6f, 0x6e, 0x66, 0x69, 0x67, 0x75, 0x72, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x48, 0x03, 0x52,
	0x1c, 0x64, 0x79, 0x6e, 0x61, 0x6d, 0x69, 0x63, 0x57, 0x6f, 0x72, 0x6b, 0x66, 0x6c, 0x6f, 0x77,
	0x43, 0x6f, 0x6e, 0x66, 0x69, 0x67, 0x75, 0x72, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x88, 0x01, 0x01,
	0x1a, 0x50, 0x0a, 0x11, 0x4b, 0x69, 0x6e, 0x65, 0x73, 0x69, 0x73, 0x43, 0x6f, 0x6e, 0x6e, 0x65,
	0x63, 0x74, 0x69, 0x6f, 0x6e, 0x12, 0x3b, 0x0a, 0x0a, 0x61, 0x77, 0x73, 0x5f, 0x63, 0x6f, 0x6e,
	0x66, 0x69, 0x67, 0x18, 0x01, 0x20, 0x01, 0x28, 0x0b, 0x32, 0x1c, 0x2e, 0x70, 0x6c, 0x75, 0x67,
	0x69, 0x6e, 0x73, 0x2e, 0x63, 0x6f, 0x6d, 0x6d, 0x6f, 0x6e, 0x2e, 0x76, 0x31, 0x2e, 0x41, 0x57,
	0x53, 0x43, 0x6f, 0x6e, 0x66, 0x69, 0x67, 0x52, 0x09, 0x61, 0x77, 0x73, 0x43, 0x6f, 0x6e, 0x66,
	0x69, 0x67, 0x1a, 0x91, 0x02, 0x0a, 0x0a, 0x4b, 0x69, 0x6e, 0x65, 0x73, 0x69, 0x73, 0x50, 0x75,
	0x74, 0x12, 0x12, 0x0a, 0x04, 0x64, 0x61, 0x74, 0x61, 0x18, 0x01, 0x20, 0x01, 0x28, 0x09, 0x52,
	0x04, 0x64, 0x61, 0x74, 0x61, 0x12, 0x23, 0x0a, 0x0d, 0x70, 0x61, 0x72, 0x74, 0x69, 0x74, 0x69,
	0x6f, 0x6e, 0x5f, 0x6b, 0x65, 0x79, 0x18, 0x02, 0x20, 0x01, 0x28, 0x09, 0x52, 0x0c, 0x70, 0x61,
	0x72, 0x74, 0x69, 0x74, 0x69, 0x6f, 0x6e, 0x4b, 0x65, 0x79, 0x12, 0x61, 0x0a, 0x16, 0x73, 0x74,
	0x72, 0x65, 0x61, 0x6d, 0x5f, 0x69, 0x64, 0x65, 0x6e, 0x74, 0x69, 0x66, 0x69, 0x65, 0x72, 0x5f,
	0x74, 0x79, 0x70, 0x65, 0x18, 0x03, 0x20, 0x01, 0x28, 0x0e, 0x32, 0x2b, 0x2e, 0x70, 0x6c, 0x75,
	0x67, 0x69, 0x6e, 0x73, 0x2e, 0x6b, 0x69, 0x6e, 0x65, 0x73, 0x69, 0x73, 0x2e, 0x76, 0x31, 0x2e,
	0x50, 0x6c, 0x75, 0x67, 0x69, 0x6e, 0x2e, 0x53, 0x74, 0x72, 0x65, 0x61, 0x6d, 0x49, 0x64, 0x65,
	0x6e, 0x74, 0x69, 0x66, 0x69, 0x65, 0x72, 0x52, 0x14, 0x73, 0x74, 0x72, 0x65, 0x61, 0x6d, 0x49,
	0x64, 0x65, 0x6e, 0x74, 0x69, 0x66, 0x69, 0x65, 0x72, 0x54, 0x79, 0x70, 0x65, 0x12, 0x24, 0x0a,
	0x0b, 0x73, 0x74, 0x72, 0x65, 0x61, 0x6d, 0x5f, 0x6e, 0x61, 0x6d, 0x65, 0x18, 0x04, 0x20, 0x01,
	0x28, 0x09, 0x48, 0x00, 0x52, 0x0a, 0x73, 0x74, 0x72, 0x65, 0x61, 0x6d, 0x4e, 0x61, 0x6d, 0x65,
	0x88, 0x01, 0x01, 0x12, 0x22, 0x0a, 0x0a, 0x73, 0x74, 0x72, 0x65, 0x61, 0x6d, 0x5f, 0x61, 0x72,
	0x6e, 0x18, 0x05, 0x20, 0x01, 0x28, 0x09, 0x48, 0x01, 0x52, 0x09, 0x73, 0x74, 0x72, 0x65, 0x61,
	0x6d, 0x41, 0x72, 0x6e, 0x88, 0x01, 0x01, 0x42, 0x0e, 0x0a, 0x0c, 0x5f, 0x73, 0x74, 0x72, 0x65,
	0x61, 0x6d, 0x5f, 0x6e, 0x61, 0x6d, 0x65, 0x42, 0x0d, 0x0a, 0x0b, 0x5f, 0x73, 0x74, 0x72, 0x65,
	0x61, 0x6d, 0x5f, 0x61, 0x72, 0x6e, 0x1a, 0xa4, 0x04, 0x0a, 0x0a, 0x4b, 0x69, 0x6e, 0x65, 0x73,
	0x69, 0x73, 0x47, 0x65, 0x74, 0x12, 0x19, 0x0a, 0x08, 0x73, 0x68, 0x61, 0x72, 0x64, 0x5f, 0x69,
	0x64, 0x18, 0x02, 0x20, 0x01, 0x28, 0x09, 0x52, 0x07, 0x73, 0x68, 0x61, 0x72, 0x64, 0x49, 0x64,
	0x12, 0x5c, 0x0a, 0x13, 0x73, 0x68, 0x61, 0x72, 0x64, 0x5f, 0x69, 0x74, 0x65, 0x72, 0x61, 0x74,
	0x6f, 0x72, 0x5f, 0x74, 0x79, 0x70, 0x65, 0x18, 0x03, 0x20, 0x01, 0x28, 0x0e, 0x32, 0x2c, 0x2e,
	0x70, 0x6c, 0x75, 0x67, 0x69, 0x6e, 0x73, 0x2e, 0x6b, 0x69, 0x6e, 0x65, 0x73, 0x69, 0x73, 0x2e,
	0x76, 0x31, 0x2e, 0x50, 0x6c, 0x75, 0x67, 0x69, 0x6e, 0x2e, 0x53, 0x68, 0x61, 0x72, 0x64, 0x49,
	0x74, 0x65, 0x72, 0x61, 0x74, 0x6f, 0x72, 0x54, 0x79, 0x70, 0x65, 0x52, 0x11, 0x73, 0x68, 0x61,
	0x72, 0x64, 0x49, 0x74, 0x65, 0x72, 0x61, 0x74, 0x6f, 0x72, 0x54, 0x79, 0x70, 0x65, 0x12, 0x14,
	0x0a, 0x05, 0x6c, 0x69, 0x6d, 0x69, 0x74, 0x18, 0x04, 0x20, 0x01, 0x28, 0x05, 0x52, 0x05, 0x6c,
	0x69, 0x6d, 0x69, 0x74, 0x12, 0x2e, 0x0a, 0x13, 0x70, 0x6f, 0x6c, 0x6c, 0x69, 0x6e, 0x67, 0x5f,
	0x63, 0x6f, 0x6f, 0x6c, 0x64, 0x6f, 0x77, 0x6e, 0x5f, 0x6d, 0x73, 0x18, 0x05, 0x20, 0x01, 0x28,
	0x05, 0x52, 0x11, 0x70, 0x6f, 0x6c, 0x6c, 0x69, 0x6e, 0x67, 0x43, 0x6f, 0x6f, 0x6c, 0x64, 0x6f,
	0x77, 0x6e, 0x4d, 0x73, 0x12, 0x3d, 0x0a, 0x18, 0x73, 0x74, 0x61, 0x72, 0x74, 0x69, 0x6e, 0x67,
	0x5f, 0x73, 0x65, 0x71, 0x75, 0x65, 0x6e, 0x63, 0x65, 0x5f, 0x6e, 0x75, 0x6d, 0x62, 0x65, 0x72,
	0x18, 0x06, 0x20, 0x01, 0x28, 0x09, 0x48, 0x00, 0x52, 0x16, 0x73, 0x74, 0x61, 0x72, 0x74, 0x69,
	0x6e, 0x67, 0x53, 0x65, 0x71, 0x75, 0x65, 0x6e, 0x63, 0x65, 0x4e, 0x75, 0x6d, 0x62, 0x65, 0x72,
	0x88, 0x01, 0x01, 0x12, 0x21, 0x0a, 0x09, 0x74, 0x69, 0x6d, 0x65, 0x73, 0x74, 0x61, 0x6d, 0x70,
	0x18, 0x07, 0x20, 0x01, 0x28, 0x09, 0x48, 0x01, 0x52, 0x09, 0x74, 0x69, 0x6d, 0x65, 0x73, 0x74,
	0x61, 0x6d, 0x70, 0x88, 0x01, 0x01, 0x12, 0x61, 0x0a, 0x16, 0x73, 0x74, 0x72, 0x65, 0x61, 0x6d,
	0x5f, 0x69, 0x64, 0x65, 0x6e, 0x74, 0x69, 0x66, 0x69, 0x65, 0x72, 0x5f, 0x74, 0x79, 0x70, 0x65,
	0x18, 0x08, 0x20, 0x01, 0x28, 0x0e, 0x32, 0x2b, 0x2e, 0x70, 0x6c, 0x75, 0x67, 0x69, 0x6e, 0x73,
	0x2e, 0x6b, 0x69, 0x6e, 0x65, 0x73, 0x69, 0x73, 0x2e, 0x76, 0x31, 0x2e, 0x50, 0x6c, 0x75, 0x67,
	0x69, 0x6e, 0x2e, 0x53, 0x74, 0x72, 0x65, 0x61, 0x6d, 0x49, 0x64, 0x65, 0x6e, 0x74, 0x69, 0x66,
	0x69, 0x65, 0x72, 0x52, 0x14, 0x73, 0x74, 0x72, 0x65, 0x61, 0x6d, 0x49, 0x64, 0x65, 0x6e, 0x74,
	0x69, 0x66, 0x69, 0x65, 0x72, 0x54, 0x79, 0x70, 0x65, 0x12, 0x24, 0x0a, 0x0b, 0x73, 0x74, 0x72,
	0x65, 0x61, 0x6d, 0x5f, 0x6e, 0x61, 0x6d, 0x65, 0x18, 0x09, 0x20, 0x01, 0x28, 0x09, 0x48, 0x02,
	0x52, 0x0a, 0x73, 0x74, 0x72, 0x65, 0x61, 0x6d, 0x4e, 0x61, 0x6d, 0x65, 0x88, 0x01, 0x01, 0x12,
	0x22, 0x0a, 0x0a, 0x73, 0x74, 0x72, 0x65, 0x61, 0x6d, 0x5f, 0x61, 0x72, 0x6e, 0x18, 0x0a, 0x20,
	0x01, 0x28, 0x09, 0x48, 0x03, 0x52, 0x09, 0x73, 0x74, 0x72, 0x65, 0x61, 0x6d, 0x41, 0x72, 0x6e,
	0x88, 0x01, 0x01, 0x42, 0x1b, 0x0a, 0x19, 0x5f, 0x73, 0x74, 0x61, 0x72, 0x74, 0x69, 0x6e, 0x67,
	0x5f, 0x73, 0x65, 0x71, 0x75, 0x65, 0x6e, 0x63, 0x65, 0x5f, 0x6e, 0x75, 0x6d, 0x62, 0x65, 0x72,
	0x42, 0x0c, 0x0a, 0x0a, 0x5f, 0x74, 0x69, 0x6d, 0x65, 0x73, 0x74, 0x61, 0x6d, 0x70, 0x42, 0x0e,
	0x0a, 0x0c, 0x5f, 0x73, 0x74, 0x72, 0x65, 0x61, 0x6d, 0x5f, 0x6e, 0x61, 0x6d, 0x65, 0x42, 0x0d,
	0x0a, 0x0b, 0x5f, 0x73, 0x74, 0x72, 0x65, 0x61, 0x6d, 0x5f, 0x61, 0x72, 0x6e, 0x22, 0xff, 0x01,
	0x0a, 0x11, 0x53, 0x68, 0x61, 0x72, 0x64, 0x49, 0x74, 0x65, 0x72, 0x61, 0x74, 0x6f, 0x72, 0x54,
	0x79, 0x70, 0x65, 0x12, 0x23, 0x0a, 0x1f, 0x53, 0x48, 0x41, 0x52, 0x44, 0x5f, 0x49, 0x54, 0x45,
	0x52, 0x41, 0x54, 0x4f, 0x52, 0x5f, 0x54, 0x59, 0x50, 0x45, 0x5f, 0x55, 0x4e, 0x53, 0x50, 0x45,
	0x43, 0x49, 0x46, 0x49, 0x45, 0x44, 0x10, 0x00, 0x12, 0x2a, 0x0a, 0x26, 0x53, 0x48, 0x41, 0x52,
	0x44, 0x5f, 0x49, 0x54, 0x45, 0x52, 0x41, 0x54, 0x4f, 0x52, 0x5f, 0x54, 0x59, 0x50, 0x45, 0x5f,
	0x41, 0x54, 0x5f, 0x53, 0x45, 0x51, 0x55, 0x45, 0x4e, 0x43, 0x45, 0x5f, 0x4e, 0x55, 0x4d, 0x42,
	0x45, 0x52, 0x10, 0x01, 0x12, 0x2d, 0x0a, 0x29, 0x53, 0x48, 0x41, 0x52, 0x44, 0x5f, 0x49, 0x54,
	0x45, 0x52, 0x41, 0x54, 0x4f, 0x52, 0x5f, 0x54, 0x59, 0x50, 0x45, 0x5f, 0x41, 0x46, 0x54, 0x45,
	0x52, 0x5f, 0x53, 0x45, 0x51, 0x55, 0x45, 0x4e, 0x43, 0x45, 0x5f, 0x4e, 0x55, 0x4d, 0x42, 0x45,
	0x52, 0x10, 0x02, 0x12, 0x24, 0x0a, 0x20, 0x53, 0x48, 0x41, 0x52, 0x44, 0x5f, 0x49, 0x54, 0x45,
	0x52, 0x41, 0x54, 0x4f, 0x52, 0x5f, 0x54, 0x59, 0x50, 0x45, 0x5f, 0x41, 0x54, 0x5f, 0x54, 0x49,
	0x4d, 0x45, 0x53, 0x54, 0x41, 0x4d, 0x50, 0x10, 0x03, 0x12, 0x24, 0x0a, 0x20, 0x53, 0x48, 0x41,
	0x52, 0x44, 0x5f, 0x49, 0x54, 0x45, 0x52, 0x41, 0x54, 0x4f, 0x52, 0x5f, 0x54, 0x59, 0x50, 0x45,
	0x5f, 0x54, 0x52, 0x49, 0x4d, 0x5f, 0x48, 0x4f, 0x52, 0x49, 0x5a, 0x4f, 0x4e, 0x10, 0x04, 0x12,
	0x1e, 0x0a, 0x1a, 0x53, 0x48, 0x41, 0x52, 0x44, 0x5f, 0x49, 0x54, 0x45, 0x52, 0x41, 0x54, 0x4f,
	0x52, 0x5f, 0x54, 0x59, 0x50, 0x45, 0x5f, 0x4c, 0x41, 0x54, 0x45, 0x53, 0x54, 0x10, 0x05, 0x22,
	0x5f, 0x0a, 0x0d, 0x4f, 0x70, 0x65, 0x72, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x54, 0x79, 0x70, 0x65,
	0x12, 0x1e, 0x0a, 0x1a, 0x4f, 0x50, 0x45, 0x52, 0x41, 0x54, 0x49, 0x4f, 0x4e, 0x5f, 0x54, 0x59,
	0x50, 0x45, 0x5f, 0x55, 0x4e, 0x53, 0x50, 0x45, 0x43, 0x49, 0x46, 0x49, 0x45, 0x44, 0x10, 0x00,
	0x12, 0x16, 0x0a, 0x12, 0x4f, 0x50, 0x45, 0x52, 0x41, 0x54, 0x49, 0x4f, 0x4e, 0x5f, 0x54, 0x59,
	0x50, 0x45, 0x5f, 0x47, 0x45, 0x54, 0x10, 0x01, 0x12, 0x16, 0x0a, 0x12, 0x4f, 0x50, 0x45, 0x52,
	0x41, 0x54, 0x49, 0x4f, 0x4e, 0x5f, 0x54, 0x59, 0x50, 0x45, 0x5f, 0x50, 0x55, 0x54, 0x10, 0x02,
	0x22, 0x7a, 0x0a, 0x10, 0x53, 0x74, 0x72, 0x65, 0x61, 0x6d, 0x49, 0x64, 0x65, 0x6e, 0x74, 0x69,
	0x66, 0x69, 0x65, 0x72, 0x12, 0x21, 0x0a, 0x1d, 0x53, 0x54, 0x52, 0x45, 0x41, 0x4d, 0x5f, 0x49,
	0x44, 0x45, 0x4e, 0x54, 0x49, 0x46, 0x49, 0x45, 0x52, 0x5f, 0x55, 0x4e, 0x53, 0x50, 0x45, 0x43,
	0x49, 0x46, 0x49, 0x45, 0x44, 0x10, 0x00, 0x12, 0x21, 0x0a, 0x1d, 0x53, 0x54, 0x52, 0x45, 0x41,
	0x4d, 0x5f, 0x49, 0x44, 0x45, 0x4e, 0x54, 0x49, 0x46, 0x49, 0x45, 0x52, 0x5f, 0x53, 0x54, 0x52,
	0x45, 0x41, 0x4d, 0x5f, 0x4e, 0x41, 0x4d, 0x45, 0x10, 0x01, 0x12, 0x20, 0x0a, 0x1c, 0x53, 0x54,
	0x52, 0x45, 0x41, 0x4d, 0x5f, 0x49, 0x44, 0x45, 0x4e, 0x54, 0x49, 0x46, 0x49, 0x45, 0x52, 0x5f,
	0x53, 0x54, 0x52, 0x45, 0x41, 0x4d, 0x5f, 0x41, 0x52, 0x4e, 0x10, 0x02, 0x42, 0x07, 0x0a, 0x05,
	0x5f, 0x6e, 0x61, 0x6d, 0x65, 0x42, 0x06, 0x0a, 0x04, 0x5f, 0x70, 0x75, 0x74, 0x42, 0x06, 0x0a,
	0x04, 0x5f, 0x67, 0x65, 0x74, 0x42, 0x21, 0x0a, 0x1f, 0x5f, 0x64, 0x79, 0x6e, 0x61, 0x6d, 0x69,
	0x63, 0x5f, 0x77, 0x6f, 0x72, 0x6b, 0x66, 0x6c, 0x6f, 0x77, 0x5f, 0x63, 0x6f, 0x6e, 0x66, 0x69,
	0x67, 0x75, 0x72, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x22, 0x24, 0x0a, 0x08, 0x4d, 0x65, 0x74, 0x61,
	0x64, 0x61, 0x74, 0x61, 0x12, 0x18, 0x0a, 0x07, 0x73, 0x74, 0x72, 0x65, 0x61, 0x6d, 0x73, 0x18,
	0x01, 0x20, 0x03, 0x28, 0x09, 0x52, 0x07, 0x73, 0x74, 0x72, 0x65, 0x61, 0x6d, 0x73, 0x42, 0x42,
	0x5a, 0x40, 0x67, 0x69, 0x74, 0x68, 0x75, 0x62, 0x2e, 0x63, 0x6f, 0x6d, 0x2f, 0x73, 0x75, 0x70,
	0x65, 0x72, 0x62, 0x6c, 0x6f, 0x63, 0x6b, 0x73, 0x74, 0x65, 0x61, 0x6d, 0x2f, 0x61, 0x67, 0x65,
	0x6e, 0x74, 0x2f, 0x74, 0x79, 0x70, 0x65, 0x73, 0x2f, 0x67, 0x65, 0x6e, 0x2f, 0x67, 0x6f, 0x2f,
	0x70, 0x6c, 0x75, 0x67, 0x69, 0x6e, 0x73, 0x2f, 0x6b, 0x69, 0x6e, 0x65, 0x73, 0x69, 0x73, 0x2f,
	0x76, 0x31, 0x62, 0x06, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x33,
}

var (
	file_plugins_kinesis_v1_plugin_proto_rawDescOnce sync.Once
	file_plugins_kinesis_v1_plugin_proto_rawDescData = file_plugins_kinesis_v1_plugin_proto_rawDesc
)

func file_plugins_kinesis_v1_plugin_proto_rawDescGZIP() []byte {
	file_plugins_kinesis_v1_plugin_proto_rawDescOnce.Do(func() {
		file_plugins_kinesis_v1_plugin_proto_rawDescData = protoimpl.X.CompressGZIP(file_plugins_kinesis_v1_plugin_proto_rawDescData)
	})
	return file_plugins_kinesis_v1_plugin_proto_rawDescData
}

var file_plugins_kinesis_v1_plugin_proto_enumTypes = make([]protoimpl.EnumInfo, 3)
var file_plugins_kinesis_v1_plugin_proto_msgTypes = make([]protoimpl.MessageInfo, 5)
var file_plugins_kinesis_v1_plugin_proto_goTypes = []interface{}{
	(Plugin_ShardIteratorType)(0),           // 0: plugins.kinesis.v1.Plugin.ShardIteratorType
	(Plugin_OperationType)(0),               // 1: plugins.kinesis.v1.Plugin.OperationType
	(Plugin_StreamIdentifier)(0),            // 2: plugins.kinesis.v1.Plugin.StreamIdentifier
	(*Plugin)(nil),                          // 3: plugins.kinesis.v1.Plugin
	(*Metadata)(nil),                        // 4: plugins.kinesis.v1.Metadata
	(*Plugin_KinesisConnection)(nil),        // 5: plugins.kinesis.v1.Plugin.KinesisConnection
	(*Plugin_KinesisPut)(nil),               // 6: plugins.kinesis.v1.Plugin.KinesisPut
	(*Plugin_KinesisGet)(nil),               // 7: plugins.kinesis.v1.Plugin.KinesisGet
	(*v1.DynamicWorkflowConfiguration)(nil), // 8: plugins.common.v1.DynamicWorkflowConfiguration
	(*v1.AWSConfig)(nil),                    // 9: plugins.common.v1.AWSConfig
}
var file_plugins_kinesis_v1_plugin_proto_depIdxs = []int32{
	5, // 0: plugins.kinesis.v1.Plugin.connection:type_name -> plugins.kinesis.v1.Plugin.KinesisConnection
	1, // 1: plugins.kinesis.v1.Plugin.operation_type:type_name -> plugins.kinesis.v1.Plugin.OperationType
	6, // 2: plugins.kinesis.v1.Plugin.put:type_name -> plugins.kinesis.v1.Plugin.KinesisPut
	7, // 3: plugins.kinesis.v1.Plugin.get:type_name -> plugins.kinesis.v1.Plugin.KinesisGet
	8, // 4: plugins.kinesis.v1.Plugin.dynamic_workflow_configuration:type_name -> plugins.common.v1.DynamicWorkflowConfiguration
	9, // 5: plugins.kinesis.v1.Plugin.KinesisConnection.aws_config:type_name -> plugins.common.v1.AWSConfig
	2, // 6: plugins.kinesis.v1.Plugin.KinesisPut.stream_identifier_type:type_name -> plugins.kinesis.v1.Plugin.StreamIdentifier
	0, // 7: plugins.kinesis.v1.Plugin.KinesisGet.shard_iterator_type:type_name -> plugins.kinesis.v1.Plugin.ShardIteratorType
	2, // 8: plugins.kinesis.v1.Plugin.KinesisGet.stream_identifier_type:type_name -> plugins.kinesis.v1.Plugin.StreamIdentifier
	9, // [9:9] is the sub-list for method output_type
	9, // [9:9] is the sub-list for method input_type
	9, // [9:9] is the sub-list for extension type_name
	9, // [9:9] is the sub-list for extension extendee
	0, // [0:9] is the sub-list for field type_name
}

func init() { file_plugins_kinesis_v1_plugin_proto_init() }
func file_plugins_kinesis_v1_plugin_proto_init() {
	if File_plugins_kinesis_v1_plugin_proto != nil {
		return
	}
	if !protoimpl.UnsafeEnabled {
		file_plugins_kinesis_v1_plugin_proto_msgTypes[0].Exporter = func(v interface{}, i int) interface{} {
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
		file_plugins_kinesis_v1_plugin_proto_msgTypes[1].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*Metadata); i {
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
		file_plugins_kinesis_v1_plugin_proto_msgTypes[2].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*Plugin_KinesisConnection); i {
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
		file_plugins_kinesis_v1_plugin_proto_msgTypes[3].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*Plugin_KinesisPut); i {
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
		file_plugins_kinesis_v1_plugin_proto_msgTypes[4].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*Plugin_KinesisGet); i {
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
	file_plugins_kinesis_v1_plugin_proto_msgTypes[0].OneofWrappers = []interface{}{}
	file_plugins_kinesis_v1_plugin_proto_msgTypes[3].OneofWrappers = []interface{}{}
	file_plugins_kinesis_v1_plugin_proto_msgTypes[4].OneofWrappers = []interface{}{}
	type x struct{}
	out := protoimpl.TypeBuilder{
		File: protoimpl.DescBuilder{
			GoPackagePath: reflect.TypeOf(x{}).PkgPath(),
			RawDescriptor: file_plugins_kinesis_v1_plugin_proto_rawDesc,
			NumEnums:      3,
			NumMessages:   5,
			NumExtensions: 0,
			NumServices:   0,
		},
		GoTypes:           file_plugins_kinesis_v1_plugin_proto_goTypes,
		DependencyIndexes: file_plugins_kinesis_v1_plugin_proto_depIdxs,
		EnumInfos:         file_plugins_kinesis_v1_plugin_proto_enumTypes,
		MessageInfos:      file_plugins_kinesis_v1_plugin_proto_msgTypes,
	}.Build()
	File_plugins_kinesis_v1_plugin_proto = out.File
	file_plugins_kinesis_v1_plugin_proto_rawDesc = nil
	file_plugins_kinesis_v1_plugin_proto_goTypes = nil
	file_plugins_kinesis_v1_plugin_proto_depIdxs = nil
}
