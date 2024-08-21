package plugin

import (
	"context"

	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	transportv1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
	"google.golang.org/protobuf/types/known/structpb"
)

type Plugin interface {
	Execute(ctx context.Context, requestProps *transportv1.Request_Data_Data_Props) (*apiv1.Output, error)
	Stream(ctx context.Context, requestProps *transportv1.Request_Data_Data_Props, send func(message any), until func()) error
	Metadata(ctx context.Context, datasourceConfig *structpb.Struct, actionConfig *structpb.Struct) (*transportv1.Response_Data_Data, error)
	Test(ctx context.Context, datasourceConfig *structpb.Struct) error
	PreDelete(ctx context.Context, datasourceConfig *structpb.Struct) error
}
