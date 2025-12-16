package flagsclient

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/launchdarkly/go-sdk-common/v3/ldcontext"
	"github.com/launchdarkly/go-sdk-common/v3/ldlog"
	"github.com/launchdarkly/go-sdk-common/v3/ldvalue"
	ld "github.com/launchdarkly/go-server-sdk/v7"
	"github.com/launchdarkly/go-server-sdk/v7/ldcomponents"
	"github.com/launchdarkly/go-server-sdk/v7/ldfiledata"
	"github.com/launchdarkly/go-server-sdk/v7/ldfilewatch"
	"github.com/superblocksteam/run"
	"go.uber.org/zap"
)

//go:generate mockery --name=ldClient --output . --filename ldClient_mock.go --outpkg flagsclient --structname mockLdClient
type ldClient interface {
	IntVariation(key string, context ldcontext.Context, defaultVal int) (int, error)
	Float64Variation(key string, context ldcontext.Context, defaultVal float64) (float64, error)
	BoolVariation(key string, context ldcontext.Context, defaultVal bool) (bool, error)
	StringVariation(key string, context ldcontext.Context, defaultVal string) (string, error)
	JSONVariation(key string, context ldcontext.Context, defaultVal ldvalue.Value) (ldvalue.Value, error)
	Close() error
}

type launchdarklyClient struct {
	done    chan struct{}
	key     string
	logger  *zap.Logger
	options Options

	mu     sync.Mutex
	alive  bool
	client ldClient

	run.ForwardCompatibility
}

func NewLaunchDarklyClient(key string, opts ...Option) FlagsClient {
	settings := Apply(opts...)

	return &launchdarklyClient{
		done:    make(chan struct{}),
		key:     key,
		logger:  settings.Logger,
		options: settings,
	}
}

func (ldc *launchdarklyClient) Init() error {
	var config ld.Config
	{
		if conf := ldc.options.Config; conf != nil {
			config = ld.Config{
				DataSource: ldfiledata.DataSource().
					FilePaths(*conf).
					Reloader(ldfilewatch.WatchFiles),
				Events: ldcomponents.NoEvents(),
			}
		} else {
			config = ld.Config{
				DataSource: ldcomponents.StreamingDataSource().InitialReconnectDelay(5 * time.Second),
				Offline:    false,
			}
		}

		config.DiagnosticOptOut = true
	}

	// NOTE(frank): Without this, there is SO MUCH NOISE. We should also pass in our own logger.
	// but the LD client has this buried under one too many abstraction layers so deferring.
	config.Logging = ldcomponents.Logging().MinLevel(ldlog.Error)

	// NOTE(frank): From the LD documentation: If you set waitFor to zero, the function will return immediately after creating the client instance, and do any further initialization in the background.
	client, err := ld.MakeCustomClient(ldc.key, config, 5*time.Second)
	if err != nil {
		return err
	}

	ldc.mu.Lock()
	defer ldc.mu.Unlock()
	ldc.alive = true
	ldc.client = client

	return nil
}

func (*launchdarklyClient) Name() string {
	return "launchdarkly"
}

func (ldc *launchdarklyClient) Run(context.Context) error {
	if err := ldc.Init(); err != nil {
		return err
	}

	<-ldc.done
	return nil
}

func (ldc *launchdarklyClient) Alive() bool {
	if ldc == nil {
		return false
	}

	ldc.mu.Lock()
	defer ldc.mu.Unlock()

	return ldc.alive
}

func (ldc *launchdarklyClient) Close(context.Context) error {
	if ldc == nil {
		return nil
	}

	close(ldc.done)

	ldc.mu.Lock()
	client := ldc.client
	ldc.mu.Unlock()

	if client != nil {
		return client.Close()
	}

	return nil
}

func (ldc *launchdarklyClient) GetBoolVariation(flag, tier string, orgId string, fallback bool) bool {
	return getVariationCustomDims(ldc.client, flag, orgId, map[string]string{"tier": tier}, fallback, ldc.logger)
}

func (ldc *launchdarklyClient) GetBoolVariationByOrg(flag, orgId string, fallback bool) bool {
	return getVariationCustomDims(ldc.client, flag, orgId, nil, fallback, ldc.logger)
}

func (ldc *launchdarklyClient) GetBoolVariationCustomDims(flag string, orgId string, dims map[string]string, fallback bool) bool {
	return getVariationCustomDims(ldc.client, flag, orgId, dims, fallback, ldc.logger)
}

func (ldc *launchdarklyClient) GetFloatVariation(flag, tier string, orgId string, fallback float64) float64 {
	return getVariationCustomDims(ldc.client, flag, orgId, map[string]string{"tier": tier}, fallback, ldc.logger)
}

func (ldc *launchdarklyClient) GetFloatVariationByOrg(flag, orgId string, fallback float64) float64 {
	return getVariationCustomDims(ldc.client, flag, orgId, nil, fallback, ldc.logger)
}

func (ldc *launchdarklyClient) GetFloatVariationCustomDims(flag string, orgId string, dims map[string]string, fallback float64) float64 {
	return getVariationCustomDims(ldc.client, flag, orgId, dims, fallback, ldc.logger)
}

func (ldc *launchdarklyClient) GetIntVariation(flag, tier string, orgId string, fallback int) int {
	return getVariationCustomDims(ldc.client, flag, orgId, map[string]string{"tier": tier}, fallback, ldc.logger)
}

func (ldc *launchdarklyClient) GetIntVariationByOrg(flag, orgId string, fallback int) int {
	return getVariationCustomDims(ldc.client, flag, orgId, nil, fallback, ldc.logger)
}

func (ldc *launchdarklyClient) GetIntVariationCustomDims(flag string, orgId string, dims map[string]string, fallback int) int {
	return getVariationCustomDims(ldc.client, flag, orgId, dims, fallback, ldc.logger)
}

func (ldc *launchdarklyClient) GetStringVariation(flag, tier string, orgId string, fallback string) string {
	return getVariationCustomDims(ldc.client, flag, orgId, map[string]string{"tier": tier}, fallback, ldc.logger)
}

func (ldc *launchdarklyClient) GetStringVariationByOrg(flag, orgId string, fallback string) string {
	return getVariationCustomDims(ldc.client, flag, orgId, nil, fallback, ldc.logger)
}

func (ldc *launchdarklyClient) GetStringVariationCustomDims(flag string, orgId string, dims map[string]string, fallback string) string {
	return getVariationCustomDims(ldc.client, flag, orgId, dims, fallback, ldc.logger)
}

func (ldc *launchdarklyClient) GetStringSliceVariation(flag, tier string, orgId string, fallback []string) []string {
	return getVariationCustomDims(ldc.client, flag, orgId, map[string]string{"tier": tier}, fallback, ldc.logger)
}

func (ldc *launchdarklyClient) GetStringSliceVariationByOrg(flag, orgId string, fallback []string) []string {
	return getVariationCustomDims(ldc.client, flag, orgId, nil, fallback, ldc.logger)
}

func (ldc *launchdarklyClient) GetStringSliceVariationCustomDims(flag string, orgId string, dims map[string]string, fallback []string) []string {
	return getVariationCustomDims(ldc.client, flag, orgId, dims, fallback, ldc.logger)
}

func getVariationCustomDims[T any](client ldClient, flag string, orgId string, dims map[string]string, fallback T, logger *zap.Logger) T {
	ctxBldr := (&ldcontext.Builder{}).Kind("user").Key(orgId)
	for k, v := range dims {
		ctxBldr = ctxBldr.SetString(k, v)
	}

	ctx, err := ctxBldr.TryBuild()
	if err != nil {
		logger.Error("could not create launchdarkly context; returning default value", zap.String("flag", flag), zap.Error(err))
		return any(fallback).(T)
	}

	return getVariation(client, flag, ctx, fallback, logger)
}

func getVariation[T any](client ldClient, key string, context ldcontext.Context, defaultVal T, logger *zap.Logger) T {
	switch defaultVal := any(defaultVal).(type) {
	case bool:
		value, err := client.BoolVariation(key, context, defaultVal)
		if err != nil {
			logger.Warn("could not retrieve flag value; returning default value", zap.String("flag", key), zap.Error(err))
		}
		return any(value).(T)
	case float64:
		value, err := client.Float64Variation(key, context, defaultVal)
		if err != nil {
			logger.Warn("could not retrieve flag value; returning default value", zap.String("flag", key), zap.Error(err))
		}
		return any(value).(T)
	case int:
		value, err := client.IntVariation(key, context, defaultVal)
		if err != nil {
			logger.Warn("could not retrieve flag value; returning default value", zap.String("flag", key), zap.Error(err))
		}
		return any(value).(T)
	case string:
		value, err := client.StringVariation(key, context, defaultVal)
		if err != nil {
			logger.Warn("could not retrieve flag value; returning default value", zap.String("flag", key), zap.Error(err))
		}
		return any(value).(T)
	case []string:
		arrayBuilder := ldvalue.ValueArrayBuilder{}
		for _, v := range defaultVal {
			arrayBuilder.Add(ldvalue.String(v))
		}
		defaultValAsValue := arrayBuilder.Build().AsValue()

		value, err := client.JSONVariation(key, context, defaultValAsValue)
		if err != nil {
			logger.Warn("could not retrieve flag value; returning default value", zap.String("flag", key), zap.Error(err))
		}

		var result []string
		for _, v := range value.AsValueArray().AsSlice() {
			result = append(result, v.StringValue())
		}
		return any(result).(T)
	}

	logger.Warn(fmt.Sprintf("unsupported variation type: %T; returning default value", defaultVal), zap.String("flag", key))
	return defaultVal
}
