package syncer

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"

	"github.com/golang/protobuf/jsonpb"
	"github.com/superblocksteam/agent/internal/fetch"
	"github.com/superblocksteam/agent/pkg/worker"
	aiv1 "github.com/superblocksteam/agent/types/gen/go/ai/v1"
	syncerv1 "github.com/superblocksteam/agent/types/gen/go/syncer/v1"
	"google.golang.org/protobuf/types/known/structpb"

	"go.uber.org/zap"
)

type Service interface {
	SyncConfiguration(ctx context.Context, configurationId string, integrationId string, integrationType string, organizationId string, datasourceConfiguration *structpb.Struct) error
}

type Config struct {
	Fetcher fetch.Fetcher
	Logger  *zap.Logger
	Worker  worker.Client
}

type syncerServiceImpl struct {
	*Config
}

func New(config *Config) (Service, error) {
	return &syncerServiceImpl{
		Config: config,
	}, nil
}

func (s *syncerServiceImpl) SyncConfiguration(ctx context.Context, configurationId string, integrationId string, integrationType string, organizationId string, datasourceConfiguration *structpb.Struct) error {
	metadata, err := s.Worker.Metadata(ctx, integrationType, datasourceConfiguration, &structpb.Struct{})
	if err != nil {
		return fmt.Errorf("could not retrieve metadata from plugin: %w", err)
	}

	var rawMetadata aiv1.Metadata
	{
		anonymous := map[string]any{}

		if db := metadata.GetData().GetData().GetDbSchema(); db != nil {
			anonymous[integrationType] = db
		}

		if kafka := metadata.GetData().GetData().GetKafka(); kafka != nil {
			anonymous[integrationType] = kafka
		}

		if buckets := metadata.GetData().GetData().GetBuckets(); buckets != nil {
			anonymous[integrationType] = buckets
		}

		md, ok := anonymous[integrationType]
		if !ok {
			return fmt.Errorf("could not find metadata for integration type: %s", integrationType)
		}

		// NOTE(frank): It's unclear where this type should live. It's only used here.
		// Because of Go's implicit interface design, it's not the worst thing to have it here.
		type minifier interface {
			Minify() (any, error)
		}

		if minifier, ok := md.(minifier); ok {
			minified, err := minifier.Minify()
			if err != nil {
				return fmt.Errorf("could not minify metadata: %w", err)
			}

			anonymous[integrationType] = minified
		}

		tmp, err := json.Marshal(anonymous)
		if err != nil {
			return fmt.Errorf("could not marshal metadata: %w", err)
		}

		if err := jsonpb.Unmarshal(bytes.NewReader(tmp), &rawMetadata); err != nil {
			return fmt.Errorf("could not unmarshal metadata: %w", err)
		}
	}

	upsertMetadataRequest := &syncerv1.UpsertMetadataRequest{
		Metadata: []*syncerv1.Metadata{
			{
				ConfigurationId: configurationId,
				IntegrationId:   integrationId,
				RawMetadata:     &rawMetadata,
				IntegrationType: integrationType,
				OrganizationId:  organizationId,
			},
		},
	}

	return s.Fetcher.UpsertMetadata(ctx, upsertMetadataRequest)
}
