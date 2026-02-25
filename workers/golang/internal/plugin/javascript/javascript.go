package javascript

import (
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"

	"workers/golang/internal/plugin"

	"github.com/superblocksteam/agent/pkg/constants"
	orchEngine "github.com/superblocksteam/agent/pkg/engine"
	"github.com/superblocksteam/agent/pkg/engine/javascript"
	engineUtils "github.com/superblocksteam/agent/pkg/engine/javascript/utils"
	commonErr "github.com/superblocksteam/agent/pkg/errors"
	"github.com/superblocksteam/agent/pkg/observability"
	orchTracer "github.com/superblocksteam/agent/pkg/observability/tracer"
	"github.com/superblocksteam/agent/pkg/store"
	"github.com/superblocksteam/agent/pkg/utils"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	transportv1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
	workerv1 "github.com/superblocksteam/agent/types/gen/go/worker/v1"
	"go.uber.org/zap"
	"google.golang.org/protobuf/encoding/protojson"
	"google.golang.org/protobuf/types/known/structpb"
	"rogchap.com/v8go"
)

type JavascriptPlugin interface {
	plugin.Plugin
}

type javascriptPlugin struct {
	logger            *zap.Logger
	headers           map[string][]string
	storeClient       store.Store
	v8MaxOldSpaceSize int
	v8MaxHeapSize     int
}

func NewJavascriptPlugin(options *Options) JavascriptPlugin {
	jsPlugin := &javascriptPlugin{
		logger:            options.Logger,
		headers:           options.Headers,
		storeClient:       options.StoreClient,
		v8MaxOldSpaceSize: options.V8MaxOldSpaceSize,
		v8MaxHeapSize:     options.V8MaxHeapSize,
	}
	jsPlugin.setV8Flags()

	return jsPlugin
}

func (p *javascriptPlugin) setV8Flags() {
	var v8Flags []string

	if p.v8MaxOldSpaceSize > 0 {
		v8Flags = append(v8Flags, fmt.Sprintf("--max-old-space-size=%d", p.v8MaxOldSpaceSize))
	}
	if p.v8MaxHeapSize > 0 {
		v8Flags = append(v8Flags, fmt.Sprintf("--max-heap-size=%d", p.v8MaxHeapSize))
	}

	v8go.SetFlags(v8Flags...)
}

func (p *javascriptPlugin) execute(ctx context.Context, requestProps *transportv1.Request_Data_Data_Props, sandbox orchEngine.Sandbox, logger *zap.Logger) (*apiv1.Output, error) {
	engine, err := sandbox.Engine(ctx)
	if err != nil {
		return nil, err
	}
	defer engine.Close()

	rawCode := getCodeFromProps(requestProps, logger)
	code := fmt.Sprintf("await (async () => { %s })()", rawCode)
	variables := utils.NewMapFromGoMap(requestProps.GetVariables())

	output := &apiv1.Output{
		Request:   rawCode,
		RequestV2: &apiv1.Output_Request{Summary: rawCode},
	}

	result := engine.Resolve(ctx, code, variables, orchEngine.WithGetFileFunc(retrieveGetFileFunc(requestProps, p.headers)))

	jsonResult, err := result.JSON()
	if err != nil {
		return output, err
	}
	output.Stdout = ioReaderToStringSlice(result.Console().Stdout, "\n", logger)
	output.Stderr = ioReaderToStringSlice(result.Console().Stderr, "\n", logger)

	if len(output.Stderr) > 0 {
		return output, errors.New(output.Stderr[len(output.Stderr)-1])
	}

	if jsonResult == "undefined" {
		output.Result = nil
	} else {
		output.Result = &structpb.Value{}
		if err := protojson.Unmarshal([]byte(jsonResult), output.Result); err != nil {
			return output, err
		}
	}

	return output, nil
}

func (p *javascriptPlugin) Execute(
	ctx context.Context,
	_ *workerv1.RequestMetadata,
	requestProps *transportv1.Request_Data_Data_Props,
	_ *transportv1.Request_Data_Data_Quota,
	_ *transportv1.Request_Data_Pinned,
) (*workerv1.ExecuteResponse, error) {
	// Okay, so it turns out we have a 3 way race if we pass in the execution context here. Either a sandbox closed err, quotas error, or a context deadline exceeded err.
	// Since we're always closing the sandbox after the engine is complete, we can safely pass a background context here
	logger := p.logger.With(zap.String(observability.OBS_TAG_CORRELATION_ID, constants.ExecutionID(ctx)))
	sandbox := javascript.Sandbox(context.Background(), &javascript.Options{Logger: logger, Store: p.storeClient, BindingErrorOptions: []commonErr.BindingErrorOption{commonErr.WithLocation()}})
	defer sandbox.Close()

	output, err := p.execute(ctx, requestProps, sandbox, logger)
	if output == nil {
		output = &apiv1.Output{}
	}

	return &workerv1.ExecuteResponse{
		Output:        output.ToOld(),
		StructuredLog: structuredLogsFromOutput(output),
	}, err
}

func (p *javascriptPlugin) Stream(
	ctx context.Context,
	topic string,
	requestMeta *workerv1.RequestMetadata,
	requestProps *transportv1.Request_Data_Data_Props,
	quotas *transportv1.Request_Data_Data_Quota,
	pinned *transportv1.Request_Data_Pinned,
) error {
	return errors.ErrUnsupported
}

func (p *javascriptPlugin) Metadata(
	ctx context.Context,
	requestMeta *workerv1.RequestMetadata,
	datasourceConfig *structpb.Struct,
	actionConfig *structpb.Struct,
) (*transportv1.Response_Data_Data, error) {
	return nil, errors.ErrUnsupported
}

func (p *javascriptPlugin) Test(
	ctx context.Context,
	requestMeta *workerv1.RequestMetadata,
	datasourceConfig *structpb.Struct,
	actionConfig *structpb.Struct,
) error {
	return errors.ErrUnsupported
}

func (p *javascriptPlugin) PreDelete(ctx context.Context, requestMeta *workerv1.RequestMetadata, datasourceConfig *structpb.Struct) error {
	return errors.ErrUnsupported
}

func (p *javascriptPlugin) NotifyWhenReady(notifyCh chan<- bool) {
	go func() {
		notifyCh <- true
	}()
}

func getCodeFromProps(props *transportv1.Request_Data_Data_Props, logger *zap.Logger) string {
	actionConfig := props.GetActionConfiguration()
	code, err := utils.GetStructField(actionConfig, "body")
	if err != nil {
		logger.Error("failed to extract code from action configuration", zap.Error(err))
		return ""
	}

	return code.GetStringValue()
}

func ioReaderToStringSlice(reader io.Reader, delimiter string, logger *zap.Logger) []string {
	buf := new(strings.Builder)

	if _, err := io.Copy(buf, reader); err != nil {
		logger.Error("failed to copy io.Reader data into string builder", zap.Error(err))
		return []string{}
	}

	if buf.Len() == 0 {
		return []string{}
	}

	bufStr := buf.String()
	results := strings.Split(bufStr, delimiter)

	numStrs := len(results)
	if strings.HasSuffix(bufStr, delimiter) {
		numStrs--
	}

	return results[:numStrs]
}

func structuredLogsFromOutput(output *apiv1.Output) []*workerv1.StructuredLog {
	var structuredLogs []*workerv1.StructuredLog
	for _, log := range output.GetStdout() {
		structuredLogs = append(structuredLogs, &workerv1.StructuredLog{
			Level:   workerv1.StructuredLog_LEVEL_INFO,
			Message: log,
		})
	}
	for _, log := range output.GetStderr() {
		structuredLogs = append(structuredLogs, &workerv1.StructuredLog{
			Level:   workerv1.StructuredLog_LEVEL_ERROR,
			Message: log,
		})
	}

	return structuredLogs
}

func retrieveGetFileFunc(props *transportv1.Request_Data_Data_Props, headers map[string][]string) engineUtils.GetFileFunc {
	return func(ctx context.Context, path string) (_ io.Reader, err error) {
		var fileUrl *url.URL
		{
			fileUrl, err = url.Parse(props.GetFileServerUrl())
			if err != nil {
				return nil, fmt.Errorf("error parsing file server URL: %w", err)
			}

			query := fileUrl.Query()
			query.Set("location", path)
			fileUrl.RawQuery = query.Encode()
		}

		resp, err := orchTracer.DefaultHttpClient().Do((&http.Request{
			Proto:  "HTTP/2",
			Method: http.MethodGet,
			URL:    fileUrl,
			Header: headers,
		}).WithContext(ctx))
		if err != nil {
			return nil, fmt.Errorf("error retrieving file from server: %s", err)
		}

		if resp.Body != nil {
			defer resp.Body.Close()
		}

		if resp.StatusCode != http.StatusOK {
			return nil, fmt.Errorf("received unexpected status while retrieving file: %s", resp.Status)
		}

		return readFile(resp.Body)
	}
}

// Close implements plugin.Plugin
func (p *javascriptPlugin) Close() {
	// No-op - javascript plugin doesn't hold persistent resources
}
