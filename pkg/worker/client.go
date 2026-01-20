package worker

import (
	"context"

	"github.com/superblocksteam/agent/pkg/worker/options"
	transportv1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
	"github.com/superblocksteam/run"
	"google.golang.org/protobuf/types/known/structpb"
)

type Selector interface {
	// Remote retuns the encoded remote destination for a given plugin.
	// Here are example values depending on the transports.
	//
	//	Redis -> agent.main.plugin.javascript.event.execute
	//	HTTP  -> http://opa_container_interface_hosting_this_plugin:80
	//
	// This approach allows us to keep all selector business logic separate.
	Remote(context.Context, string, string, string) (string, string)
	// todo: use generics here to make the input and output dynamic
}

type ExecuteRequest struct {
	Context context.Context
	Plugin  string
	Request *transportv1.Request_Data_Data
	Options []options.Option
	Inbox   chan *ExecuteResponse
}

func (r *ExecuteRequest) Return() chan *ExecuteResponse {
	return r.Inbox
}

type ExecuteResponse struct {
	Performance *transportv1.Performance
	Key         string
	Error       error
}

//go:generate mockery --name=Client --output . --filename client_mock.go --outpkg worker --structname MockClient
type Client interface {
	Execute(context.Context, string, *transportv1.Request_Data_Data, ...options.Option) (*transportv1.Performance, string, error)
	Metadata(context.Context, string, *structpb.Struct, *structpb.Struct, ...options.Option) (*transportv1.Response, error)
	TestConnection(ctx context.Context, pluginName string, datasourceConfig *structpb.Struct, actionConfig *structpb.Struct, opts ...options.Option) (*transportv1.Response, error)
	PreDelete(ctx context.Context, pluginName string, datasourceConfig *structpb.Struct, opts ...options.Option) (*transportv1.Response, error)

	Selector
	run.Runnable
}

type Event string

const (
	EventExecute   Event = "execute"
	EventStream    Event = "stream"
	EventMetadata  Event = "metadata"
	EventTest      Event = "test"
	EventPreDelete Event = "pre_delete"
	EventUnknown   Event = "unknown"
)
