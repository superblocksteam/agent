// Package plugin defines common plugin interfaces for workers.
package plugin

import (
	"context"

	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	transportv1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
	"google.golang.org/protobuf/types/known/structpb"
)

// Plugin defines the interface for code execution plugins.
// Both the golang and ephemeral workers implement this interface.
type Plugin interface {
	// Execute runs code and returns the output.
	Execute(ctx context.Context, requestProps *transportv1.Request_Data_Data_Props) (*apiv1.Output, error)

	// Stream executes code with streaming output.
	Stream(ctx context.Context, requestProps *transportv1.Request_Data_Data_Props, send func(message any), until func()) error

	// Metadata returns plugin metadata for the given configuration.
	Metadata(ctx context.Context, datasourceConfig *structpb.Struct, actionConfig *structpb.Struct) (*transportv1.Response_Data_Data, error)

	// Test validates a datasource configuration.
	Test(ctx context.Context, datasourceConfig *structpb.Struct) error

	// PreDelete is called before a datasource is deleted.
	PreDelete(ctx context.Context, datasourceConfig *structpb.Struct) error

	// Close cleans up any resources held by the plugin.
	// Called when the worker is shutting down.
	Close()
}
