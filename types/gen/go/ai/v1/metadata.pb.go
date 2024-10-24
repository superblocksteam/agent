// Code generated by protoc-gen-go. DO NOT EDIT.
// versions:
// 	protoc-gen-go v1.32.0
// 	protoc        (unknown)
// source: ai/v1/metadata.proto

package v1

import (
	_ "buf.build/gen/go/bufbuild/protovalidate/protocolbuffers/go/buf/validate"
	_ "github.com/envoyproxy/protoc-gen-validate/validate"
	v1 "github.com/superblocksteam/agent/types/gen/go/plugins/common/v1"
	v11 "github.com/superblocksteam/agent/types/gen/go/plugins/kafka/v1"
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

// This represents the metadata that the "AI stack" cares about. It is
// not guaranteed to be the same as the metadata for the "plugin stack".
// This is more than likely a minified representation of it.
type Metadata struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	// Types that are assignable to Config:
	//
	//	*Metadata_Mariadb
	//	*Metadata_Mssql
	//	*Metadata_Mysql
	//	*Metadata_Postgres
	//	*Metadata_Rockset
	//	*Metadata_Snowflake
	//	*Metadata_Cockroachdb
	//	*Metadata_Kafka
	//	*Metadata_Confluent
	//	*Metadata_Msk
	//	*Metadata_Redpanda
	//	*Metadata_Aivenkafka
	Config isMetadata_Config `protobuf_oneof:"config"`
}

func (x *Metadata) Reset() {
	*x = Metadata{}
	if protoimpl.UnsafeEnabled {
		mi := &file_ai_v1_metadata_proto_msgTypes[0]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *Metadata) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*Metadata) ProtoMessage() {}

func (x *Metadata) ProtoReflect() protoreflect.Message {
	mi := &file_ai_v1_metadata_proto_msgTypes[0]
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
	return file_ai_v1_metadata_proto_rawDescGZIP(), []int{0}
}

func (m *Metadata) GetConfig() isMetadata_Config {
	if m != nil {
		return m.Config
	}
	return nil
}

func (x *Metadata) GetMariadb() *v1.SQLMetadata_Minified {
	if x, ok := x.GetConfig().(*Metadata_Mariadb); ok {
		return x.Mariadb
	}
	return nil
}

func (x *Metadata) GetMssql() *v1.SQLMetadata_Minified {
	if x, ok := x.GetConfig().(*Metadata_Mssql); ok {
		return x.Mssql
	}
	return nil
}

func (x *Metadata) GetMysql() *v1.SQLMetadata_Minified {
	if x, ok := x.GetConfig().(*Metadata_Mysql); ok {
		return x.Mysql
	}
	return nil
}

func (x *Metadata) GetPostgres() *v1.SQLMetadata_Minified {
	if x, ok := x.GetConfig().(*Metadata_Postgres); ok {
		return x.Postgres
	}
	return nil
}

func (x *Metadata) GetRockset() *v1.SQLMetadata_Minified {
	if x, ok := x.GetConfig().(*Metadata_Rockset); ok {
		return x.Rockset
	}
	return nil
}

func (x *Metadata) GetSnowflake() *v1.SQLMetadata_Minified {
	if x, ok := x.GetConfig().(*Metadata_Snowflake); ok {
		return x.Snowflake
	}
	return nil
}

func (x *Metadata) GetCockroachdb() *v1.SQLMetadata_Minified {
	if x, ok := x.GetConfig().(*Metadata_Cockroachdb); ok {
		return x.Cockroachdb
	}
	return nil
}

func (x *Metadata) GetKafka() *v11.Metadata_Minified {
	if x, ok := x.GetConfig().(*Metadata_Kafka); ok {
		return x.Kafka
	}
	return nil
}

func (x *Metadata) GetConfluent() *v11.Metadata_Minified {
	if x, ok := x.GetConfig().(*Metadata_Confluent); ok {
		return x.Confluent
	}
	return nil
}

func (x *Metadata) GetMsk() *v11.Metadata_Minified {
	if x, ok := x.GetConfig().(*Metadata_Msk); ok {
		return x.Msk
	}
	return nil
}

func (x *Metadata) GetRedpanda() *v11.Metadata_Minified {
	if x, ok := x.GetConfig().(*Metadata_Redpanda); ok {
		return x.Redpanda
	}
	return nil
}

func (x *Metadata) GetAivenkafka() *v11.Metadata_Minified {
	if x, ok := x.GetConfig().(*Metadata_Aivenkafka); ok {
		return x.Aivenkafka
	}
	return nil
}

type isMetadata_Config interface {
	isMetadata_Config()
}

type Metadata_Mariadb struct {
	Mariadb *v1.SQLMetadata_Minified `protobuf:"bytes,1,opt,name=mariadb,proto3,oneof"`
}

type Metadata_Mssql struct {
	Mssql *v1.SQLMetadata_Minified `protobuf:"bytes,2,opt,name=mssql,proto3,oneof"`
}

type Metadata_Mysql struct {
	Mysql *v1.SQLMetadata_Minified `protobuf:"bytes,3,opt,name=mysql,proto3,oneof"`
}

type Metadata_Postgres struct {
	Postgres *v1.SQLMetadata_Minified `protobuf:"bytes,4,opt,name=postgres,proto3,oneof"`
}

type Metadata_Rockset struct {
	Rockset *v1.SQLMetadata_Minified `protobuf:"bytes,5,opt,name=rockset,proto3,oneof"`
}

type Metadata_Snowflake struct {
	Snowflake *v1.SQLMetadata_Minified `protobuf:"bytes,6,opt,name=snowflake,proto3,oneof"`
}

type Metadata_Cockroachdb struct {
	Cockroachdb *v1.SQLMetadata_Minified `protobuf:"bytes,7,opt,name=cockroachdb,proto3,oneof"`
}

type Metadata_Kafka struct {
	Kafka *v11.Metadata_Minified `protobuf:"bytes,8,opt,name=kafka,proto3,oneof"`
}

type Metadata_Confluent struct {
	Confluent *v11.Metadata_Minified `protobuf:"bytes,9,opt,name=confluent,proto3,oneof"`
}

type Metadata_Msk struct {
	Msk *v11.Metadata_Minified `protobuf:"bytes,10,opt,name=msk,proto3,oneof"`
}

type Metadata_Redpanda struct {
	Redpanda *v11.Metadata_Minified `protobuf:"bytes,11,opt,name=redpanda,proto3,oneof"`
}

type Metadata_Aivenkafka struct {
	Aivenkafka *v11.Metadata_Minified `protobuf:"bytes,12,opt,name=aivenkafka,proto3,oneof"`
}

func (*Metadata_Mariadb) isMetadata_Config() {}

func (*Metadata_Mssql) isMetadata_Config() {}

func (*Metadata_Mysql) isMetadata_Config() {}

func (*Metadata_Postgres) isMetadata_Config() {}

func (*Metadata_Rockset) isMetadata_Config() {}

func (*Metadata_Snowflake) isMetadata_Config() {}

func (*Metadata_Cockroachdb) isMetadata_Config() {}

func (*Metadata_Kafka) isMetadata_Config() {}

func (*Metadata_Confluent) isMetadata_Config() {}

func (*Metadata_Msk) isMetadata_Config() {}

func (*Metadata_Redpanda) isMetadata_Config() {}

func (*Metadata_Aivenkafka) isMetadata_Config() {}

var File_ai_v1_metadata_proto protoreflect.FileDescriptor

var file_ai_v1_metadata_proto_rawDesc = []byte{
	0x0a, 0x14, 0x61, 0x69, 0x2f, 0x76, 0x31, 0x2f, 0x6d, 0x65, 0x74, 0x61, 0x64, 0x61, 0x74, 0x61,
	0x2e, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x12, 0x05, 0x61, 0x69, 0x2e, 0x76, 0x31, 0x1a, 0x1b, 0x62,
	0x75, 0x66, 0x2f, 0x76, 0x61, 0x6c, 0x69, 0x64, 0x61, 0x74, 0x65, 0x2f, 0x76, 0x61, 0x6c, 0x69,
	0x64, 0x61, 0x74, 0x65, 0x2e, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x1a, 0x20, 0x70, 0x6c, 0x75, 0x67,
	0x69, 0x6e, 0x73, 0x2f, 0x63, 0x6f, 0x6d, 0x6d, 0x6f, 0x6e, 0x2f, 0x76, 0x31, 0x2f, 0x6d, 0x65,
	0x74, 0x61, 0x64, 0x61, 0x74, 0x61, 0x2e, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x1a, 0x1d, 0x70, 0x6c,
	0x75, 0x67, 0x69, 0x6e, 0x73, 0x2f, 0x6b, 0x61, 0x66, 0x6b, 0x61, 0x2f, 0x76, 0x31, 0x2f, 0x70,
	0x6c, 0x75, 0x67, 0x69, 0x6e, 0x2e, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x1a, 0x17, 0x76, 0x61, 0x6c,
	0x69, 0x64, 0x61, 0x74, 0x65, 0x2f, 0x76, 0x61, 0x6c, 0x69, 0x64, 0x61, 0x74, 0x65, 0x2e, 0x70,
	0x72, 0x6f, 0x74, 0x6f, 0x22, 0xcc, 0x06, 0x0a, 0x08, 0x4d, 0x65, 0x74, 0x61, 0x64, 0x61, 0x74,
	0x61, 0x12, 0x43, 0x0a, 0x07, 0x6d, 0x61, 0x72, 0x69, 0x61, 0x64, 0x62, 0x18, 0x01, 0x20, 0x01,
	0x28, 0x0b, 0x32, 0x27, 0x2e, 0x70, 0x6c, 0x75, 0x67, 0x69, 0x6e, 0x73, 0x2e, 0x63, 0x6f, 0x6d,
	0x6d, 0x6f, 0x6e, 0x2e, 0x76, 0x31, 0x2e, 0x53, 0x51, 0x4c, 0x4d, 0x65, 0x74, 0x61, 0x64, 0x61,
	0x74, 0x61, 0x2e, 0x4d, 0x69, 0x6e, 0x69, 0x66, 0x69, 0x65, 0x64, 0x48, 0x00, 0x52, 0x07, 0x6d,
	0x61, 0x72, 0x69, 0x61, 0x64, 0x62, 0x12, 0x3f, 0x0a, 0x05, 0x6d, 0x73, 0x73, 0x71, 0x6c, 0x18,
	0x02, 0x20, 0x01, 0x28, 0x0b, 0x32, 0x27, 0x2e, 0x70, 0x6c, 0x75, 0x67, 0x69, 0x6e, 0x73, 0x2e,
	0x63, 0x6f, 0x6d, 0x6d, 0x6f, 0x6e, 0x2e, 0x76, 0x31, 0x2e, 0x53, 0x51, 0x4c, 0x4d, 0x65, 0x74,
	0x61, 0x64, 0x61, 0x74, 0x61, 0x2e, 0x4d, 0x69, 0x6e, 0x69, 0x66, 0x69, 0x65, 0x64, 0x48, 0x00,
	0x52, 0x05, 0x6d, 0x73, 0x73, 0x71, 0x6c, 0x12, 0x3f, 0x0a, 0x05, 0x6d, 0x79, 0x73, 0x71, 0x6c,
	0x18, 0x03, 0x20, 0x01, 0x28, 0x0b, 0x32, 0x27, 0x2e, 0x70, 0x6c, 0x75, 0x67, 0x69, 0x6e, 0x73,
	0x2e, 0x63, 0x6f, 0x6d, 0x6d, 0x6f, 0x6e, 0x2e, 0x76, 0x31, 0x2e, 0x53, 0x51, 0x4c, 0x4d, 0x65,
	0x74, 0x61, 0x64, 0x61, 0x74, 0x61, 0x2e, 0x4d, 0x69, 0x6e, 0x69, 0x66, 0x69, 0x65, 0x64, 0x48,
	0x00, 0x52, 0x05, 0x6d, 0x79, 0x73, 0x71, 0x6c, 0x12, 0x45, 0x0a, 0x08, 0x70, 0x6f, 0x73, 0x74,
	0x67, 0x72, 0x65, 0x73, 0x18, 0x04, 0x20, 0x01, 0x28, 0x0b, 0x32, 0x27, 0x2e, 0x70, 0x6c, 0x75,
	0x67, 0x69, 0x6e, 0x73, 0x2e, 0x63, 0x6f, 0x6d, 0x6d, 0x6f, 0x6e, 0x2e, 0x76, 0x31, 0x2e, 0x53,
	0x51, 0x4c, 0x4d, 0x65, 0x74, 0x61, 0x64, 0x61, 0x74, 0x61, 0x2e, 0x4d, 0x69, 0x6e, 0x69, 0x66,
	0x69, 0x65, 0x64, 0x48, 0x00, 0x52, 0x08, 0x70, 0x6f, 0x73, 0x74, 0x67, 0x72, 0x65, 0x73, 0x12,
	0x43, 0x0a, 0x07, 0x72, 0x6f, 0x63, 0x6b, 0x73, 0x65, 0x74, 0x18, 0x05, 0x20, 0x01, 0x28, 0x0b,
	0x32, 0x27, 0x2e, 0x70, 0x6c, 0x75, 0x67, 0x69, 0x6e, 0x73, 0x2e, 0x63, 0x6f, 0x6d, 0x6d, 0x6f,
	0x6e, 0x2e, 0x76, 0x31, 0x2e, 0x53, 0x51, 0x4c, 0x4d, 0x65, 0x74, 0x61, 0x64, 0x61, 0x74, 0x61,
	0x2e, 0x4d, 0x69, 0x6e, 0x69, 0x66, 0x69, 0x65, 0x64, 0x48, 0x00, 0x52, 0x07, 0x72, 0x6f, 0x63,
	0x6b, 0x73, 0x65, 0x74, 0x12, 0x47, 0x0a, 0x09, 0x73, 0x6e, 0x6f, 0x77, 0x66, 0x6c, 0x61, 0x6b,
	0x65, 0x18, 0x06, 0x20, 0x01, 0x28, 0x0b, 0x32, 0x27, 0x2e, 0x70, 0x6c, 0x75, 0x67, 0x69, 0x6e,
	0x73, 0x2e, 0x63, 0x6f, 0x6d, 0x6d, 0x6f, 0x6e, 0x2e, 0x76, 0x31, 0x2e, 0x53, 0x51, 0x4c, 0x4d,
	0x65, 0x74, 0x61, 0x64, 0x61, 0x74, 0x61, 0x2e, 0x4d, 0x69, 0x6e, 0x69, 0x66, 0x69, 0x65, 0x64,
	0x48, 0x00, 0x52, 0x09, 0x73, 0x6e, 0x6f, 0x77, 0x66, 0x6c, 0x61, 0x6b, 0x65, 0x12, 0x4b, 0x0a,
	0x0b, 0x63, 0x6f, 0x63, 0x6b, 0x72, 0x6f, 0x61, 0x63, 0x68, 0x64, 0x62, 0x18, 0x07, 0x20, 0x01,
	0x28, 0x0b, 0x32, 0x27, 0x2e, 0x70, 0x6c, 0x75, 0x67, 0x69, 0x6e, 0x73, 0x2e, 0x63, 0x6f, 0x6d,
	0x6d, 0x6f, 0x6e, 0x2e, 0x76, 0x31, 0x2e, 0x53, 0x51, 0x4c, 0x4d, 0x65, 0x74, 0x61, 0x64, 0x61,
	0x74, 0x61, 0x2e, 0x4d, 0x69, 0x6e, 0x69, 0x66, 0x69, 0x65, 0x64, 0x48, 0x00, 0x52, 0x0b, 0x63,
	0x6f, 0x63, 0x6b, 0x72, 0x6f, 0x61, 0x63, 0x68, 0x64, 0x62, 0x12, 0x3b, 0x0a, 0x05, 0x6b, 0x61,
	0x66, 0x6b, 0x61, 0x18, 0x08, 0x20, 0x01, 0x28, 0x0b, 0x32, 0x23, 0x2e, 0x70, 0x6c, 0x75, 0x67,
	0x69, 0x6e, 0x73, 0x2e, 0x6b, 0x61, 0x66, 0x6b, 0x61, 0x2e, 0x76, 0x31, 0x2e, 0x4d, 0x65, 0x74,
	0x61, 0x64, 0x61, 0x74, 0x61, 0x2e, 0x4d, 0x69, 0x6e, 0x69, 0x66, 0x69, 0x65, 0x64, 0x48, 0x00,
	0x52, 0x05, 0x6b, 0x61, 0x66, 0x6b, 0x61, 0x12, 0x43, 0x0a, 0x09, 0x63, 0x6f, 0x6e, 0x66, 0x6c,
	0x75, 0x65, 0x6e, 0x74, 0x18, 0x09, 0x20, 0x01, 0x28, 0x0b, 0x32, 0x23, 0x2e, 0x70, 0x6c, 0x75,
	0x67, 0x69, 0x6e, 0x73, 0x2e, 0x6b, 0x61, 0x66, 0x6b, 0x61, 0x2e, 0x76, 0x31, 0x2e, 0x4d, 0x65,
	0x74, 0x61, 0x64, 0x61, 0x74, 0x61, 0x2e, 0x4d, 0x69, 0x6e, 0x69, 0x66, 0x69, 0x65, 0x64, 0x48,
	0x00, 0x52, 0x09, 0x63, 0x6f, 0x6e, 0x66, 0x6c, 0x75, 0x65, 0x6e, 0x74, 0x12, 0x37, 0x0a, 0x03,
	0x6d, 0x73, 0x6b, 0x18, 0x0a, 0x20, 0x01, 0x28, 0x0b, 0x32, 0x23, 0x2e, 0x70, 0x6c, 0x75, 0x67,
	0x69, 0x6e, 0x73, 0x2e, 0x6b, 0x61, 0x66, 0x6b, 0x61, 0x2e, 0x76, 0x31, 0x2e, 0x4d, 0x65, 0x74,
	0x61, 0x64, 0x61, 0x74, 0x61, 0x2e, 0x4d, 0x69, 0x6e, 0x69, 0x66, 0x69, 0x65, 0x64, 0x48, 0x00,
	0x52, 0x03, 0x6d, 0x73, 0x6b, 0x12, 0x41, 0x0a, 0x08, 0x72, 0x65, 0x64, 0x70, 0x61, 0x6e, 0x64,
	0x61, 0x18, 0x0b, 0x20, 0x01, 0x28, 0x0b, 0x32, 0x23, 0x2e, 0x70, 0x6c, 0x75, 0x67, 0x69, 0x6e,
	0x73, 0x2e, 0x6b, 0x61, 0x66, 0x6b, 0x61, 0x2e, 0x76, 0x31, 0x2e, 0x4d, 0x65, 0x74, 0x61, 0x64,
	0x61, 0x74, 0x61, 0x2e, 0x4d, 0x69, 0x6e, 0x69, 0x66, 0x69, 0x65, 0x64, 0x48, 0x00, 0x52, 0x08,
	0x72, 0x65, 0x64, 0x70, 0x61, 0x6e, 0x64, 0x61, 0x12, 0x45, 0x0a, 0x0a, 0x61, 0x69, 0x76, 0x65,
	0x6e, 0x6b, 0x61, 0x66, 0x6b, 0x61, 0x18, 0x0c, 0x20, 0x01, 0x28, 0x0b, 0x32, 0x23, 0x2e, 0x70,
	0x6c, 0x75, 0x67, 0x69, 0x6e, 0x73, 0x2e, 0x6b, 0x61, 0x66, 0x6b, 0x61, 0x2e, 0x76, 0x31, 0x2e,
	0x4d, 0x65, 0x74, 0x61, 0x64, 0x61, 0x74, 0x61, 0x2e, 0x4d, 0x69, 0x6e, 0x69, 0x66, 0x69, 0x65,
	0x64, 0x48, 0x00, 0x52, 0x0a, 0x61, 0x69, 0x76, 0x65, 0x6e, 0x6b, 0x61, 0x66, 0x6b, 0x61, 0x42,
	0x12, 0x0a, 0x06, 0x63, 0x6f, 0x6e, 0x66, 0x69, 0x67, 0x12, 0x08, 0xf8, 0x42, 0x01, 0xba, 0x48,
	0x02, 0x08, 0x01, 0x42, 0x35, 0x5a, 0x33, 0x67, 0x69, 0x74, 0x68, 0x75, 0x62, 0x2e, 0x63, 0x6f,
	0x6d, 0x2f, 0x73, 0x75, 0x70, 0x65, 0x72, 0x62, 0x6c, 0x6f, 0x63, 0x6b, 0x73, 0x74, 0x65, 0x61,
	0x6d, 0x2f, 0x61, 0x67, 0x65, 0x6e, 0x74, 0x2f, 0x74, 0x79, 0x70, 0x65, 0x73, 0x2f, 0x67, 0x65,
	0x6e, 0x2f, 0x67, 0x6f, 0x2f, 0x61, 0x69, 0x2f, 0x76, 0x31, 0x62, 0x06, 0x70, 0x72, 0x6f, 0x74,
	0x6f, 0x33,
}

var (
	file_ai_v1_metadata_proto_rawDescOnce sync.Once
	file_ai_v1_metadata_proto_rawDescData = file_ai_v1_metadata_proto_rawDesc
)

func file_ai_v1_metadata_proto_rawDescGZIP() []byte {
	file_ai_v1_metadata_proto_rawDescOnce.Do(func() {
		file_ai_v1_metadata_proto_rawDescData = protoimpl.X.CompressGZIP(file_ai_v1_metadata_proto_rawDescData)
	})
	return file_ai_v1_metadata_proto_rawDescData
}

var file_ai_v1_metadata_proto_msgTypes = make([]protoimpl.MessageInfo, 1)
var file_ai_v1_metadata_proto_goTypes = []interface{}{
	(*Metadata)(nil),                // 0: ai.v1.Metadata
	(*v1.SQLMetadata_Minified)(nil), // 1: plugins.common.v1.SQLMetadata.Minified
	(*v11.Metadata_Minified)(nil),   // 2: plugins.kafka.v1.Metadata.Minified
}
var file_ai_v1_metadata_proto_depIdxs = []int32{
	1,  // 0: ai.v1.Metadata.mariadb:type_name -> plugins.common.v1.SQLMetadata.Minified
	1,  // 1: ai.v1.Metadata.mssql:type_name -> plugins.common.v1.SQLMetadata.Minified
	1,  // 2: ai.v1.Metadata.mysql:type_name -> plugins.common.v1.SQLMetadata.Minified
	1,  // 3: ai.v1.Metadata.postgres:type_name -> plugins.common.v1.SQLMetadata.Minified
	1,  // 4: ai.v1.Metadata.rockset:type_name -> plugins.common.v1.SQLMetadata.Minified
	1,  // 5: ai.v1.Metadata.snowflake:type_name -> plugins.common.v1.SQLMetadata.Minified
	1,  // 6: ai.v1.Metadata.cockroachdb:type_name -> plugins.common.v1.SQLMetadata.Minified
	2,  // 7: ai.v1.Metadata.kafka:type_name -> plugins.kafka.v1.Metadata.Minified
	2,  // 8: ai.v1.Metadata.confluent:type_name -> plugins.kafka.v1.Metadata.Minified
	2,  // 9: ai.v1.Metadata.msk:type_name -> plugins.kafka.v1.Metadata.Minified
	2,  // 10: ai.v1.Metadata.redpanda:type_name -> plugins.kafka.v1.Metadata.Minified
	2,  // 11: ai.v1.Metadata.aivenkafka:type_name -> plugins.kafka.v1.Metadata.Minified
	12, // [12:12] is the sub-list for method output_type
	12, // [12:12] is the sub-list for method input_type
	12, // [12:12] is the sub-list for extension type_name
	12, // [12:12] is the sub-list for extension extendee
	0,  // [0:12] is the sub-list for field type_name
}

func init() { file_ai_v1_metadata_proto_init() }
func file_ai_v1_metadata_proto_init() {
	if File_ai_v1_metadata_proto != nil {
		return
	}
	if !protoimpl.UnsafeEnabled {
		file_ai_v1_metadata_proto_msgTypes[0].Exporter = func(v interface{}, i int) interface{} {
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
	}
	file_ai_v1_metadata_proto_msgTypes[0].OneofWrappers = []interface{}{
		(*Metadata_Mariadb)(nil),
		(*Metadata_Mssql)(nil),
		(*Metadata_Mysql)(nil),
		(*Metadata_Postgres)(nil),
		(*Metadata_Rockset)(nil),
		(*Metadata_Snowflake)(nil),
		(*Metadata_Cockroachdb)(nil),
		(*Metadata_Kafka)(nil),
		(*Metadata_Confluent)(nil),
		(*Metadata_Msk)(nil),
		(*Metadata_Redpanda)(nil),
		(*Metadata_Aivenkafka)(nil),
	}
	type x struct{}
	out := protoimpl.TypeBuilder{
		File: protoimpl.DescBuilder{
			GoPackagePath: reflect.TypeOf(x{}).PkgPath(),
			RawDescriptor: file_ai_v1_metadata_proto_rawDesc,
			NumEnums:      0,
			NumMessages:   1,
			NumExtensions: 0,
			NumServices:   0,
		},
		GoTypes:           file_ai_v1_metadata_proto_goTypes,
		DependencyIndexes: file_ai_v1_metadata_proto_depIdxs,
		MessageInfos:      file_ai_v1_metadata_proto_msgTypes,
	}.Build()
	File_ai_v1_metadata_proto = out.File
	file_ai_v1_metadata_proto_rawDesc = nil
	file_ai_v1_metadata_proto_goTypes = nil
	file_ai_v1_metadata_proto_depIdxs = nil
}
