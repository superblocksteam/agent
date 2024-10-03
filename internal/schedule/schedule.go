package schedule

import (
	"context"
	"sync"
	"time"

	structpb "github.com/golang/protobuf/ptypes/struct"
	"github.com/superblocksteam/agent/internal/auth"
	"github.com/superblocksteam/agent/internal/fetch"
	"github.com/superblocksteam/agent/internal/metrics"
	"github.com/superblocksteam/agent/pkg/clients"
	"github.com/superblocksteam/agent/pkg/crypto/signature"
	"github.com/superblocksteam/agent/pkg/executor"
	"github.com/superblocksteam/agent/pkg/executor/options"
	"github.com/superblocksteam/agent/pkg/flags"
	"github.com/superblocksteam/agent/pkg/observability"
	"github.com/superblocksteam/agent/pkg/observability/tracer"
	"github.com/superblocksteam/agent/pkg/secrets"
	"github.com/superblocksteam/agent/pkg/store"
	"github.com/superblocksteam/agent/pkg/utils"
	"github.com/superblocksteam/agent/pkg/worker"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	commonv1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
	"github.com/superblocksteam/run"
	"go.opentelemetry.io/otel/trace"
	"go.uber.org/zap"
)

var _ run.Runnable = (*ScheduleJobRunner)(nil)

type ScheduleJobRunner struct {
	*Config
	run.ForwardCompatibility

	ticker *time.Ticker
	wg     *sync.WaitGroup
	ctx    context.Context
	cancel context.CancelFunc
}

type Config struct {
	PollInterval            time.Duration
	Logger                  *zap.Logger
	Worker                  worker.Client
	Fetcher                 fetch.Fetcher
	Flags                   flags.Flags
	ServerClient            clients.ServerClient
	Store                   store.Store
	SecretManager           secrets.SecretManager
	DefaultResolveOptions   []options.Option
	Secrets                 secrets.Secrets
	EagerRefreshThresholdMs int64
	Signature               signature.Registry
}

func New(config *Config) *ScheduleJobRunner {
	ctx, cancel := context.WithCancel(context.Background())

	return &ScheduleJobRunner{
		Config: config,
		ctx:    ctx,
		cancel: cancel,
	}
}

func (r *ScheduleJobRunner) pollOnce() {
	r.Logger.Debug("asking if there are jobs to run")

	// TODO(frank): This is where we'd pass in a timeout override.
	resp, rawResp, err := r.Fetcher.FetchScheduledJobs(context.Background())
	if err != nil {
		metrics.ApiFetchRequestsTotal.WithLabelValues("failed").Inc()
		r.Logger.Error("failed to fetch schedule jobs", zap.Error(err))
		return
	}
	metrics.ApiFetchRequestsTotal.WithLabelValues("succeeded").Inc()

	if len(resp.Apis) == 0 {
		r.Logger.Debug("there were no jobs to execute")
		return
	}

	r.Logger.Debug("successfully polled jobs", zap.Int("count", len(resp.Apis)))

	r.wg.Add(len(resp.Apis))

	for i, def := range resp.Apis {
		rawDef := rawResp.GetFields()["apis"].GetListValue().GetValues()[i].GetStructValue()
		go func(x *apiv1.Definition, y *structpb.Struct) {
			defer r.wg.Done()

			r.executeScheduleJob(x, y)
		}(def, rawDef)
	}
}

func (r *ScheduleJobRunner) executeScheduleJob(def *apiv1.Definition, rawDef *structpb.Struct) {
	logger := r.Logger.With(observability.Enrich(def.Api, apiv1.ViewMode_VIEW_MODE_DEPLOYED.Enum())...)

	if err := utils.ProtoValidate(def); err != nil {
		logger.Error("validation failed on scheduled job", zap.Error(err))
		return
	}
	// TODO: turn back on when we are certain in our responses
	//if errs := validation.ValidateFetch(def); len(errs) > 0 {
	//	r.Logger.Error("validation failed on scheduled job", zap.Error(errors.Join(errs...)))
	//	return
	//}

	parameters := &commonv1.HttpParameters{}
	inputs, err := parameters.WithSuperblocksInjected(def.GetMetadata().GetProfile()).AsInputs(context.Background(), func(_ context.Context, s string) (*string, error) {
		// No need to resolve since only parameters are ones we inject.
		return &s, nil
	})

	if err != nil {
		logger.Error("failed to resolve inputs", zap.Error(err))
		return
	}

	rawApiValue, _ := utils.GetStructField(rawDef, "api")

	_, err = tracer.Observe(context.Background(), "execute.api.schedule", nil, func(spanCtx context.Context, _ trace.Span) (*apiv1.Output, error) {
		_, err, _ := executor.Execute(spanCtx, &executor.Options{
			Logger:                logger,
			Store:                 r.Store,
			Worker:                r.Worker,
			Integrations:          def.Integrations,
			Api:                   def.Api,
			RawApi:                rawApiValue,
			DefinitionMetadata:    def.GetMetadata(),
			Options:               &apiv1.ExecuteRequest_Options{},
			Inputs:                inputs,
			Fetcher:               r.Fetcher,
			Flags:                 r.Flags,
			TokenManager:          auth.NewTokenManager(r.ServerClient, logger, r.EagerRefreshThresholdMs),
			IsDeployed:            true,
			Requester:             "Schedule",
			RootStartTime:         time.Now(),
			GarbageCollect:        true,
			SecretManager:         r.SecretManager,
			DefaultResolveOptions: r.DefaultResolveOptions,
			Secrets:               r.Secrets,
			UseAgentKey:           true,
			Stores:                def.GetStores(),
			Signature:             r.Signature,
		}, func(resp *apiv1.StreamResponse) error {
			return nil
		})
		return nil, err
	}, nil)

	if err != nil {
		logger.Error("failed to execute job", zap.Error(err))
	}
}

func (r *ScheduleJobRunner) Run(context.Context) error {
	r.ticker = time.NewTicker(r.PollInterval)
	r.wg = &sync.WaitGroup{}

	for {
		select {
		case <-r.ticker.C:
			r.pollOnce()
		case <-r.ctx.Done():
			return nil
		}
	}
}

func (*ScheduleJobRunner) Alive() bool { return true }

func (*ScheduleJobRunner) Name() string { return "job scheduler" }

func (r *ScheduleJobRunner) Close(context.Context) error {
	r.ticker.Stop() // NOTE(frank): Remember, this will not close the ticker channel.
	r.cancel()

	// NOTE(frank): Wait for all jobs to finish.
	r.wg.Wait()
	return nil
}
