package registration

import (
	"context"
	"crypto/sha256"
	"errors"
	"fmt"
	"io"
	"net/http"
	"sync"

	retry "github.com/avast/retry-go"
	clients "github.com/superblocksteam/agent/pkg/clients"
	"github.com/superblocksteam/run"
	"go.uber.org/zap"
)

const (
	AGENT_ENVIRONMENT_HEADER      = "x-superblocks-agent-environment"
	AGENT_HOST_URL_HEADER         = "x-superblocks-agent-host-url"
	AGENT_VERSION_HEADER          = "x-superblocks-agent-version"
	AGENT_VERSION_EXTERNAL_HEADER = "x-superblocks-agent-version-external"
)

// NOTE: (joey) this must be updated each time the template for a plugin in the monorepo is bumped in order for OPA customers to see the latest plugin template changes
var SUPERBLOCKS_PLUGIN_VERSIONS = map[string][]string{
	"athena":             {"0.0.1"},
	"bigquery":           {"0.0.7"},
	"cockroachdb":        {"0.0.2"},
	"dynamodb":           {"0.0.7"},
	"email":              {"0.0.7"},
	"gcs":                {"0.0.1"},
	"graphql":            {"0.0.8"},
	"gsheets":            {"0.0.18"},
	"kafka":              {"0.0.1"},
	"javascript":         {"0.0.9"},
	"kinesis":            {"0.0.1"},
	"mariadb":            {"0.0.11"},
	"mongodb":            {"0.0.7"},
	"mssql":              {"0.0.10"},
	"mysql":              {"0.0.11"},
	"openai":             {"0.0.3"},
	"postgres":           {"0.0.11"},
	"python":             {"0.0.7"},
	"redshift":           {"0.0.7"},
	"restapi":            {"0.0.12"},
	"restapiintegration": {"0.0.13"},
	"rockset":            {"0.0.7"},
	"s3":                 {"0.0.10"},
	"salesforce":         {"0.0.1"},
	"snowflake":          {"0.0.7"},
	"superblocks-ocr":    {"0.0.1"},
	"workflow":           {"0.0.4"},
	"redis":              {"0.0.1"},
	"cosmosdb":           {"0.0.1"},
	"smtp":               {"0.0.1"},
	"confluent":          {"0.0.1"},
	"redpanda":           {"0.0.1"},
	"couchbase":          {"0.0.2"},
	"databricks":         {"0.0.1"},
	"oracledb":           {"0.0.1"},
}

type Registrator interface {
	run.Runnable
}

type registrator struct {
	ctx        context.Context
	cancel     context.CancelFunc
	registered bool
	mutex      sync.Mutex

	*Options
	run.ForwardCompatibility
}

type Options struct {
	ServerClient         clients.ServerClient
	Tags                 map[string][]string
	Logger               *zap.Logger
	Environment          string
	AgentUrl             string
	AgentVersion         string
	AgentVersionExternal string
	SigningKeyId         string
	VerificationKeys     map[string]string
	SuperblocksKey       string
}

func New(options *Options) Registrator {
	ctx, cancel := context.WithCancel(context.Background())

	options.Logger = options.Logger.Named("registrator").With(
		zap.String("agent.url", options.AgentUrl),
		zap.String("superblocks.key.hash", fmt.Sprintf("%x", sha256.Sum256([]byte(options.SuperblocksKey)))),
	)

	return &registrator{
		ctx:     ctx,
		cancel:  cancel,
		Options: options,
	}
}

func (r *registrator) Run(context.Context) error {
	if err := r.register(r.ctx); err != nil {
		return err
	}

	r.mutex.Lock()
	r.registered = true
	r.mutex.Unlock()

	<-r.ctx.Done()
	return nil
}

func (*registrator) Alive() bool { return true }

func (*registrator) Name() string { return "registrar" }

func (r *registrator) Close(context.Context) error {
	r.cancel()

	var registered bool
	{
		r.mutex.Lock()
		registered = r.registered
		r.mutex.Unlock()
	}

	if !registered {
		return nil
	}

	resp, err := r.ServerClient.DeleteAgent(context.Background(), nil, nil, nil)
	if err != nil {
		r.Logger.Warn("failed deregistration", zap.Error(err))
		return errors.New("could not deregister agent")
	}

	if resp.StatusCode != http.StatusNoContent {
		r.Logger.Warn("failed deregistration", zap.Int("http.status", resp.StatusCode))
		return errors.New("could not deregister agent")
	}

	r.Logger.Info("deregistered")
	return nil
}

func (r *registrator) register(ctx context.Context) error {
	var headers http.Header = http.Header{}
	{
		headers.Set(AGENT_ENVIRONMENT_HEADER, r.Environment)
		headers.Set(AGENT_HOST_URL_HEADER, r.AgentUrl)
		headers.Set(AGENT_VERSION_HEADER, r.AgentVersion)
		headers.Set(AGENT_VERSION_EXTERNAL_HEADER, r.AgentVersionExternal)
	}

	verificationKeyIds := make([]string, 0, len(r.VerificationKeys))
	for keyId := range r.VerificationKeys {
		verificationKeyIds = append(verificationKeyIds, keyId)
	}

	var resp *http.Response
	var err error
	{
		rab := &clients.RegisterAgentBody{
			PluginVersions:     SUPERBLOCKS_PLUGIN_VERSIONS,
			Type:               2, // On-Premise Agent
			Tags:               r.Tags,
			SigningKeyId:       r.SigningKeyId,
			VerificationKeyIds: verificationKeyIds,
			VerificationKeys:   r.VerificationKeys,
		}
		r.Logger.Info("registering",
			zap.Any("RegisterAgentBody", rab),
		)
		if err := retry.Do(func() error {
			if resp, err = r.ServerClient.PostRegister(r.ctx, nil, headers, nil, rab); err != nil {
				return err
			}

			if code := resp.StatusCode; code != http.StatusOK {
				return fmt.Errorf("received %d status code", code)
			}

			return nil
		}, retry.Attempts(10), retry.RetryIf(func(err error) bool {
			return resp == nil || (resp.StatusCode >= 500)
		}), retry.OnRetry(func(n uint, err error) {
			r.Logger.Warn("retrying registration", zap.Int("attempt", int(n)), zap.Error(err))
		}), retry.Context(ctx)); err != nil {
			fields := []zap.Field{
				zap.Error(err),
			}

			if resp != nil {
				body, err := io.ReadAll(resp.Body)
				if err != nil {
					fields = append(fields, zap.Error(err))
				} else {
					fields = append(fields, zap.String("body", string(body)))
				}
				fields = append(fields, zap.Int("http.status", resp.StatusCode))
			}

			r.Logger.Error("failed registration", fields...)

			return err
		}
	}

	r.Logger.Info("registered")
	return nil
}
