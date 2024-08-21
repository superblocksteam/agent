package remote

import (
	"fmt"
	"net/http"
	"os"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/superblocksteam/agent/pkg/clients/mocks"
	"github.com/superblocksteam/agent/pkg/observability"
	"github.com/superblocksteam/agent/pkg/observability/emitter"
	"github.com/superblocksteam/agent/pkg/observability/log"
	intakev1 "github.com/superblocksteam/agent/types/gen/go/intake/v1"
	"go.uber.org/zap"
)

func TestRemoteLogFlush(t *testing.T) {
	t.Parallel()

	mockHttpClient := mocks.NewIntakeClient(t)
	mockHttpClient.On("SendRemoteLogs", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(&http.Response{
		StatusCode: http.StatusAccepted,
		Body:       http.NoBody,
	}, nil)

	remote := Emitter(mockHttpClient,
		Enabled(true),
		FlushMaxItems(11),
		FlushMaxDuration(100*time.Millisecond),
		Whitelist(
			observability.OBS_TAG_AGENT_ID,
			observability.OBS_TAG_AGENT_VERSION,
			observability.OBS_TAG_ORG_ID,
			observability.OBS_TAG_RESOURCE_ACTION,
			observability.OBS_TAG_RESOURCE_NAME,
			observability.OBS_TAG_RESOURCE_ID,
			observability.OBS_TAG_RESOURCE_TYPE,
			observability.OBS_TAG_PARENT_NAME,
			observability.OBS_TAG_PARENT_ID,
			observability.OBS_TAG_PARENT_TYPE,
			observability.OBS_TAG_PROFILE,
			observability.OBS_TAG_CORRELATION_ID,
			observability.OBS_TAG_USER_EMAIL,
			observability.OBS_TAG_USER_TYPE,
		))

	var logger *zap.Logger
	{
		l, err := log.Logger(&log.Options{
			Level: "debug",
			Emitters: []emitter.Emitter{
				remote,
			},
		})
		if err != nil {
			fmt.Fprintf(os.Stderr, "could not create logger: %s", err)
			os.Exit(1)
		}

		logger = l
	}

	zapFields1 := []zap.Field{
		zap.Bool("remote", true),
		zap.String("test-tag", "1"),
		zap.String("agent-id", "test-id1"),
		zap.String("resource-id", "test-entity-id1"),
		zap.String("resource-type", "test-entity-type1"),
		zap.String("organization-id", "test-org-id1"),
		zap.String("organization-id", "test-org-id1"),
		zap.String("organization-tier", "test-org-tier1"),
		zap.String("profile", "test-profile1"),
		zap.String("correlation-id", "test-correlation-id1"),
		zap.String("api-name", "test-api-name1"),
		zap.String("resource-name", "test-resource-name1"),
		zap.String("agent-version", "test-agent-version1"),
		zap.String("user-email", "test@sb.com"),
		zap.String("user-type", "superblocks"),
	}

	zapFields2 := []zap.Field{
		zap.Bool("remote", true),
		zap.String("test-tag", "2"),
		zap.String("agent-id", "test-id2"),
		zap.String("resource-id", "test-entity-id2"),
		zap.String("resource-type", "test-entity-type2"),
		zap.String("organization-id", "test-org-id2"),
		zap.String("organization-id", "test-org-id2"),
		zap.String("organization-tier", "test-org-tier2"),
		zap.String("profile", "test-profile2"),
		zap.String("correlation-id", "test-correlation-id2"),
		zap.String("api-name", "test-api-name2"),
		zap.String("resource-name", "test-resource-name2"),
		zap.String("agent-version", "test-agent-version2"),
		zap.String("user-email", "test@sb.com"),
		zap.String("user-type", "superblocks"),
	}

	zapFields3 := []zap.Field{
		zap.Bool("remote", true),
		zap.String("agent-id", "test-id3"),
		zap.String("test-tag", "3"),
		zap.String("resource-id", "test-entity-id3"),
		zap.String("resource-type", "test-entity-type3"),
		zap.String("organization-id", "test-org-id3"),
		zap.String("organization-id", "test-org-id3"),
		zap.String("organization-tier", "test-org-tier3"),
		zap.String("profile", "test-profile3"),
		zap.String("correlation-id", "test-correlation-id3"),
		zap.String("api-name", "test-api-name3"),
		zap.String("resource-name", "test-resource-name3"),
		zap.String("agent-version", "test-agent-version3"),
		zap.String("user-email", "test@sb.com"),
		zap.String("user-type", "superblocks"),
	}

	go func() {
		logger.Info("The scheduled_job Org1 has started.", zapFields1...)
		logger.Info("The block Org1_1 has failed.", zapFields1...)
		logger.Info("The scheduled_job Org1 has failed.", zapFields1...)
	}()

	go func() {
		logger.Info("The scheduled_job Org1 has started.", zapFields1...)
		logger.Info("The block Org1_1 has failed.", zapFields1...)
		logger.Info("The scheduled_job Org1 has failed.", zapFields1...)
	}()

	go func() {
		logger.Info("The scheduled_job Org2 has started.", zapFields2...)
		logger.Info("The block Org2_2 has failed.", zapFields2...)
		logger.Info("The scheduled_job Org2 has failed.", zapFields2...)
	}()

	go func() {
		logger.Info("The scheduled_job Org3 has started.", zapFields3...)
		logger.Info("The block Org3_3 has failed.", zapFields3...)
		logger.Info("The scheduled_job Org3 has failed.", zapFields3...)
	}()

	// wait for the flush to happen in goroutine
	time.Sleep(250 * time.Millisecond)

	mockHttpClient.AssertNumberOfCalls(t, "SendRemoteLogs", 1)
	logs := mockHttpClient.Calls[0].Arguments[3].(*intakev1.Logs).Logs
	assert.Equal(t, 12, len(logs))
	for _, log := range logs {
		testNumber := log.GetFields()["test-tag"].GetStringValue()
		for _, value := range log.GetFields() {
			assert.Contains(t, value.GetStringValue(), testNumber)
		}
	}
}

func TestRemoteLogFlushMaxItems(t *testing.T) {
	t.Parallel()

	mockHttpClient := mocks.NewIntakeClient(t)
	mockHttpClient.On("SendRemoteLogs", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(&http.Response{
		StatusCode: http.StatusAccepted,
		Body:       http.NoBody,
	}, nil)

	remote := Emitter(mockHttpClient,
		Enabled(true),
		FlushMaxItems(3),
		FlushMaxDuration(100*time.Millisecond),
		Whitelist(
			observability.OBS_TAG_AGENT_ID,
			observability.OBS_TAG_AGENT_VERSION,
			observability.OBS_TAG_ORG_ID,
			observability.OBS_TAG_RESOURCE_ACTION,
			observability.OBS_TAG_RESOURCE_NAME,
			observability.OBS_TAG_RESOURCE_ID,
			observability.OBS_TAG_RESOURCE_TYPE,
			observability.OBS_TAG_PARENT_NAME,
			observability.OBS_TAG_PARENT_ID,
			observability.OBS_TAG_PARENT_TYPE,
			observability.OBS_TAG_PROFILE,
			observability.OBS_TAG_CORRELATION_ID,
			observability.OBS_TAG_USER_EMAIL,
			observability.OBS_TAG_USER_TYPE,
		))

	logger, err := log.Logger(&log.Options{
		Level: "debug",
		Emitters: []emitter.Emitter{
			remote,
		},
	})
	assert.NoError(t, err)

	zapFields1 := []zap.Field{
		zap.Bool("remote", true),
		zap.String("test-tag", "1"),
		zap.String("agent-id", "test-id1"),
		zap.String("resource-id", "test-entity-id1"),
		zap.String("resource-type", "test-entity-type1"),
		zap.String("organization-id", "test-org-id1"),
		zap.String("organization-id", "test-org-id1"),
		zap.String("organization-tier", "test-org-tier1"),
		zap.String("profile", "test-profile1"),
		zap.String("correlation-id", "test-correlation-id1"),
		zap.String("api-name", "test-api-name1"),
		zap.String("resource-name", "test-resource-name1"),
		zap.String("agent-version", "test-agent-version1"),
		zap.String("resource-name", "test-resource-name1"),
		zap.String("agent-version", "test-agent-version1"),
	}

	go func() {

	}()

	logger.Info("The scheduled_job Org1 has started.", zapFields1...)
	logger.Info("The block Org1_1 has failed.", zapFields1...)
	logger.Info("The scheduled_job Org1 has failed.", zapFields1...)
	logger.Info("The scheduled_job Org1 has started.", zapFields1...)
	logger.Info("The block Org1_1 has failed.", zapFields1...)
	logger.Info("The scheduled_job Org1 has failed.", zapFields1...)
	logger.Info("The scheduled_job Org1 has started.", zapFields1...)
	logger.Info("The block Org1_1 has failed.", zapFields1...)
	logger.Info("The scheduled_job Org1 has failed.", zapFields1...)
	logger.Info("The scheduled_job Org1 has started.", zapFields1...)
	logger.Info("The block Org1_1 has failed.", zapFields1...)
	logger.Info("The scheduled_job Org1 has failed.", zapFields1...)

	// wait for the flush to happen in goroutine
	time.Sleep(250 * time.Millisecond)

	mockHttpClient.AssertNumberOfCalls(t, "SendRemoteLogs", 3)
	assert.Equal(t, 4, len(mockHttpClient.Calls[0].Arguments[3].(*intakev1.Logs).Logs))
	assert.Equal(t, 4, len(mockHttpClient.Calls[1].Arguments[3].(*intakev1.Logs).Logs))
	assert.Equal(t, 4, len(mockHttpClient.Calls[2].Arguments[3].(*intakev1.Logs).Logs))
}

func TestRemoteLogFlushMaxTime(t *testing.T) {
	t.Parallel()

	mockHttpClient := mocks.NewIntakeClient(t)
	mockHttpClient.On("SendRemoteLogs", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(&http.Response{
		StatusCode: http.StatusAccepted,
		Body:       http.NoBody,
	}, nil)

	remote := Emitter(mockHttpClient,
		Enabled(true),
		FlushMaxItems(100),
		FlushMaxDuration(100*time.Millisecond),
		Whitelist(
			observability.OBS_TAG_AGENT_ID,
			observability.OBS_TAG_AGENT_VERSION,
			observability.OBS_TAG_ORG_ID,
			observability.OBS_TAG_RESOURCE_ACTION,
			observability.OBS_TAG_RESOURCE_NAME,
			observability.OBS_TAG_RESOURCE_ID,
			observability.OBS_TAG_RESOURCE_TYPE,
			observability.OBS_TAG_PARENT_NAME,
			observability.OBS_TAG_PARENT_ID,
			observability.OBS_TAG_PARENT_TYPE,
			observability.OBS_TAG_PROFILE,
			observability.OBS_TAG_CORRELATION_ID,
		))

	var logger *zap.Logger
	{
		l, err := log.Logger(&log.Options{
			Level: "debug",
			Emitters: []emitter.Emitter{
				remote,
			},
		})
		if err != nil {
			fmt.Fprintf(os.Stderr, "could not create logger: %s", err)
			os.Exit(1)
		}

		logger = l
	}

	zapFields1 := []zap.Field{
		zap.Bool("remote", true),
		zap.String("test-tag", "1"),
		zap.String("agent-id", "test-id1"),
		zap.String("resource-id", "test-entity-id1"),
		zap.String("resource-type", "test-entity-type1"),
		zap.String("organization-id", "test-org-id1"),
		zap.String("organization-id", "test-org-id1"),
		zap.String("organization-tier", "test-org-tier1"),
		zap.String("profile", "test-profile1"),
		zap.String("correlation-id", "test-correlation-id1"),
		zap.String("api-name", "test-api-name1"),
		zap.String("resource-name", "test-resource-name1"),
		zap.String("agent-version", "test-agent-version1"),
		zap.String("user-email", "test@sb.com"),
		zap.String("user-type", "superblocks"),
	}

	go func() {
		logger.Info("The scheduled_job Org1 has started.", zapFields1...)
		logger.Info("The block Org1_1 has failed.", zapFields1...)
		logger.Info("The scheduled_job Org1 has failed.", zapFields1...)
	}()

	time.Sleep(150 * time.Millisecond)

	logger.Info("The scheduled_job Org1 has failed.", zapFields1...)

	// wait for the flush to happen in goroutine
	time.Sleep(100 * time.Millisecond)

	mockHttpClient.AssertNumberOfCalls(t, "SendRemoteLogs", 1)
	logs := mockHttpClient.Calls[0].Arguments[3].(*intakev1.Logs).Logs
	assert.Equal(t, 4, len(logs))
}
