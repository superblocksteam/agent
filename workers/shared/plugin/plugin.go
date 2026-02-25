// Package plugin defines common plugin interfaces for workers.
package plugin

import (
	"context"

	transportv1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
	workerv1 "github.com/superblocksteam/agent/types/gen/go/worker/v1"
	"google.golang.org/protobuf/types/known/structpb"
)

// Plugin defines the interface for code execution plugins.
// Both the golang and ephemeral workers implement this interface.
type Plugin interface {
	// Execute runs code and returns the output.
	Execute(
		ctx context.Context,
		requestMeta *workerv1.RequestMetadata,
		requestProps *transportv1.Request_Data_Data_Props,
		quotas *transportv1.Request_Data_Data_Quota,
		pinned *transportv1.Request_Data_Pinned,
	) (*workerv1.ExecuteResponse, error)

	// Stream executes code with streaming output.
	Stream(
		ctx context.Context,
		topic string,
		requestMeta *workerv1.RequestMetadata,
		requestProps *transportv1.Request_Data_Data_Props,
		quotas *transportv1.Request_Data_Data_Quota,
		pinned *transportv1.Request_Data_Pinned,
	) error

	// Metadata returns plugin metadata for the given configuration.
	Metadata(ctx context.Context, requestMeta *workerv1.RequestMetadata, datasourceConfig *structpb.Struct, actionConfig *structpb.Struct) (*transportv1.Response_Data_Data, error)

	// Test validates a datasource configuration.
	Test(ctx context.Context, requestMeta *workerv1.RequestMetadata, datasourceConfig *structpb.Struct, actionConfig *structpb.Struct) error

	// PreDelete is called before a datasource is deleted.
	PreDelete(ctx context.Context, requestMeta *workerv1.RequestMetadata, datasourceConfig *structpb.Struct) error

	// Ready returns a channel that reports true when the plugin is ready to execute code.
	NotifyWhenReady(notifyCh chan<- bool)
}
