package event

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"testing"
	"time"

	cloudevents "github.com/cloudevents/sdk-go/v2"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/superblocksteam/agent/pkg/clients/mocks"
	"github.com/superblocksteam/agent/pkg/observability/emitter"
	"github.com/superblocksteam/agent/pkg/observability/log"
	"go.uber.org/zap"
)

func TestLogFlush(t *testing.T) {
	t.Parallel()
	mockClient := mocks.NewIntakeClient(t)
	mockClient.On("LogCloudEvents", mock.Anything, mock.Anything, mock.Anything).Return(&http.Response{
		StatusCode: http.StatusOK,
		Body:       http.NoBody,
	}, nil, nil)

	eventEmitter :=
		Emitter(
			Enabled(true),
			AgentId("test-agent-id"),
			IntakeClient(mockClient),
		)

	var logger *zap.Logger
	{
		l, err := log.Logger(&log.Options{
			Level: "debug",
			Emitters: []emitter.Emitter{
				eventEmitter,
			},
		})
		if err != nil {
			fmt.Fprintf(os.Stderr, "could not create logger: %s", err)
			os.Exit(1)
		}

		logger = l
	}

	executionEventData := map[string]interface{}{
		"ExecutionID":     "018aab58-1a02-7f63-8fdc-19b708a91253",
		"IntegrationID":   "",
		"IntegrationType": "javascript",
		"Mode":            "MODE_EDITOR",
		"OrganizationID":  "00000000-0000-0000-0000-000000000001",
		"ParentName":      "WHILE_LOOP",
		"ParentType":      "TYPE_EXECUTION_BLOCK",
		"ResourceName":    "STEP",
		"ResourceSubtype": "BLOCK_TYPE_STEP",
		"ResourceType":    "TYPE_EXECUTION_BLOCK",
		"Result":          "BLOCK_STATUS_SUCCEEDED",
		"Status":          "STATUS_ENDED",
	}

	zapFields := []zap.Field{
		zap.Bool("_event", true),
		zap.String("id", "0d532fb3-41f8-43b1-8eeb-ff6f271eacc0"),
		zap.String("type", ExecuteEventType),
		zap.Any("data", executionEventData),
	}

	logger.Info("", zapFields...)
	logger.Info("", zapFields...)
	eventEmitter.Flush(nil)

	// wait for the flush to happen in goroutine
	time.Sleep(time.Second)

	mockClient.AssertNumberOfCalls(t, "LogCloudEvents", 1)
	cloudEventsArg := mockClient.Calls[0].Arguments[2].([]*cloudevents.Event)
	assert.Equal(t, ExecuteEventType, cloudEventsArg[0].Type())
	var received map[string]interface{}
	json.Unmarshal(cloudEventsArg[0].Data(), &received)
	assert.Equal(t, executionEventData, received)
}

func TestFlushBufferSizeThreshold(t *testing.T) {
	t.Parallel()
	mockClient := mocks.NewIntakeClient(t)
	mockClient.On("LogCloudEvents", mock.Anything, mock.Anything, mock.Anything).Return(&http.Response{
		StatusCode: http.StatusOK,
		Body:       http.NoBody,
	}, nil, nil)

	eventEmitter :=
		Emitter(
			Enabled(true),
			AgentId("test-agent-id"),
			IntakeClient(mockClient),
			FlushMaxDuration(time.Hour),
			FlushMaxItems(2),
		)

	var logger *zap.Logger
	{
		l, err := log.Logger(&log.Options{
			Level: "debug",
			Emitters: []emitter.Emitter{
				eventEmitter,
			},
		})
		if err != nil {
			fmt.Fprintf(os.Stderr, "could not create logger: %s", err)
			os.Exit(1)
		}

		logger = l
	}

	executionEventData := map[string]interface{}{
		"ExecutionID":     "018aab58-1a02-7f63-8fdc-19b708a91253",
		"IntegrationID":   "",
		"IntegrationType": "javascript",
		"Mode":            "MODE_EDITOR",
		"OrganizationID":  "00000000-0000-0000-0000-000000000001",
		"ParentName":      "WHILE_LOOP",
		"ParentType":      "TYPE_EXECUTION_BLOCK",
		"ResourceName":    "STEP",
		"ResourceSubtype": "BLOCK_TYPE_STEP",
		"ResourceType":    "TYPE_EXECUTION_BLOCK",
		"Result":          "BLOCK_STATUS_SUCCEEDED",
		"Status":          "STATUS_ENDED",
	}

	zapFields := []zap.Field{
		zap.Bool("_event", true),
		zap.String("id", "0d532fb3-41f8-43b1-8eeb-ff6f271eacc0"),
		zap.String("type", ExecuteEventType),
		zap.Any("data", executionEventData),
	}

	logger.Info("", zapFields...)
	logger.Info("", zapFields...)

	// wait for the flush to happen in goroutine
	time.Sleep(time.Second)

	logger.Info("", zapFields...)
	logger.Info("", zapFields...)

	// wait for the flush to happen in goroutine
	time.Sleep(time.Second)

	mockClient.AssertNumberOfCalls(t, "LogCloudEvents", 2)

	cloudEventsArg := mockClient.Calls[0].Arguments[2].([]*cloudevents.Event)
	assert.Equal(t, ExecuteEventType, cloudEventsArg[0].Type())
	var received map[string]interface{}
	json.Unmarshal(cloudEventsArg[0].Data(), &received)
	assert.Equal(t, executionEventData, received)

	cloudEventsArg = mockClient.Calls[1].Arguments[2].([]*cloudevents.Event)
	assert.Equal(t, ExecuteEventType, cloudEventsArg[0].Type())
	json.Unmarshal(cloudEventsArg[0].Data(), &received)
	assert.Equal(t, executionEventData, received)
}
