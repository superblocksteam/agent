package clients

import (
	"context"
	"encoding/json"
	"net/http"
	"net/url"
	"time"

	cloudevents "github.com/cloudevents/sdk-go/v2"
	"github.com/golang/protobuf/jsonpb"
	"github.com/superblocksteam/agent/pkg/observability/tracer"
	eventv1 "github.com/superblocksteam/agent/types/gen/go/event/v1"
	syncerv1 "github.com/superblocksteam/agent/types/gen/go/syncer/v1"
	"go.uber.org/zap"
)

type intakeClient struct {
	metadataBaseUrl string
	eventBaseUrl    string
	logBaseUrl      string
	client          HttpClient
	logger          *zap.Logger
	headers         map[string]string
	timeout         *time.Duration
	unmarshaler     *jsonpb.Unmarshaler
}

//go:generate mockery --name=IntakeClient --output ./mocks --structname IntakeClient
type IntakeClient interface {
	UpsertMetadata(ctx context.Context, timeout *time.Duration, body *syncerv1.UpsertMetadataRequest) (*http.Response, error)
	LogCloudEvents(ctx context.Context, timeout *time.Duration, events []*cloudevents.Event) (*http.Response, error)
	SendRemoteLogs(ctx context.Context, timeout *time.Duration, headers http.Header, body interface{}) (*http.Response, error)
}

func (i *intakeClient) UpsertMetadata(ctx context.Context, timeout *time.Duration, body *syncerv1.UpsertMetadataRequest) (*http.Response, error) {
	return i.sendRequest(ctx, timeout, http.MethodPost, i.metadataBaseUrl, "", nil, nil, body)
}

func (i *intakeClient) LogCloudEvents(ctx context.Context, timeout *time.Duration, events []*cloudevents.Event) (*http.Response, error) {
	var payload [][]byte
	for _, event := range events {
		b, err := json.Marshal(event)
		if err != nil {
			i.logger.Error("Failed to marshal cloud event object into bytes", zap.Error(err), zap.Any("event", event))
		}
		payload = append(payload, b)
	}

	body := &eventv1.IngestEventRequest{Events: payload}

	resp, err := i.sendRequest(ctx, timeout, http.MethodPost, i.eventBaseUrl, "", nil, nil, body)

	if ie, e := Check(err, resp); e != nil {
		i.logger.Error("Failed to log execution events to intake service", zap.Errors("details", []error{ie, e}))
		return nil, e
	} else {
		i.logger.Info("Successfully logged execution events to intake", zap.Int("count", len(events)))
	}

	return resp, err
}

func (i *intakeClient) SendRemoteLogs(ctx context.Context, timeout *time.Duration, headers http.Header, body interface{}) (*http.Response, error) {
	return i.sendRequest(ctx, timeout, http.MethodPost, i.logBaseUrl, "", headers, nil, body)
}

func (i *intakeClient) sendRequest(ctx context.Context, timeout *time.Duration, method string, baseUrl string, path string, headers http.Header, query url.Values, body interface{}) (*http.Response, error) {
	if timeout != nil {
		var cancel context.CancelFunc
		ctx, cancel = context.WithTimeout(ctx, *timeout)
		defer cancel()
	} else if i.timeout != nil {
		var cancel context.CancelFunc
		ctx, cancel = context.WithTimeout(ctx, *i.timeout)
		defer cancel()
	}

	req, err := i.buildRequest(ctx, method, baseUrl, path, headers, query, body)
	if err != nil {
		return nil, err
	}

	resp, err := i.client.Do(req)
	if err != nil {
		return nil, err
	}

	return resp, nil
}

func (i *intakeClient) buildRequest(ctx context.Context, method string, baseUrl string, path string, headers http.Header, query url.Values, body interface{}) (*http.Request, error) {
	combinedHeaders := combineHeaders(i.headers, headers)

	return buildRequest(ctx, method, baseUrl, path, combinedHeaders, query, body)
}

type IntakeClientOptions struct {
	MetadataUrl string
	EventUrl    string
	LogUrl      string
	Logger      *zap.Logger
	Headers     map[string]string // Extra headers to send with every fetch request.
	Client      HttpClient
	Timeout     *time.Duration
}

func NewIntakeClient(options *IntakeClientOptions) IntakeClient {
	var client HttpClient
	{
		if options.Client == nil {
			client = tracer.DefaultHttpClient()
		} else {
			client = options.Client
		}
	}

	return &intakeClient{
		metadataBaseUrl: options.MetadataUrl,
		eventBaseUrl:    options.EventUrl,
		logBaseUrl:      options.LogUrl,
		client:          client,
		logger:          options.Logger,
		headers:         options.Headers,
		timeout:         options.Timeout,
		unmarshaler:     &jsonpb.Unmarshaler{},
	}
}
