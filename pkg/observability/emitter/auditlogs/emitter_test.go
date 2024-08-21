package auditlogs

import (
	"fmt"
	"net/http"
	"os"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/superblocksteam/agent/internal/metrics"
	"github.com/superblocksteam/agent/pkg/clients/mocks"
	"github.com/superblocksteam/agent/pkg/observability/emitter"
	"github.com/superblocksteam/agent/pkg/observability/log"
	agentv1 "github.com/superblocksteam/agent/types/gen/go/agent/v1"
	v1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
	"go.uber.org/zap"
	"google.golang.org/protobuf/proto"
)

func TestAuditLogFlush(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name         string
		zapFields    []zap.Field
		expectedLog  *agentv1.AuditLogRequest_AuditLog
		expectedCall int
	}{
		{
			name: "Test userType internal",
			zapFields: []zap.Field{
				zap.Bool("audit", true),
				zap.String("auditLogId", "test-id"),
				zap.String("entityId", "test-entity-id"),
				zap.String("entityType", agentv1.AuditLogRequest_AuditLog_AUDIT_LOG_ENTITY_TYPE_APPLICATION.String()),
				zap.String("organizationId", "test-org-id"),
				zap.Bool("isDeployed", true),
				zap.String("source", "test-source"),
				zap.String("userType", v1.UserType_USER_TYPE_SUPERBLOCKS.String()),
				zap.String("target", "test-target"),
				zap.String("status", agentv1.AuditLogRequest_AuditLog_API_RUN_STATUS_FAILED.String()),
				zap.String("error", "test-error"),
				zap.String("applicationId", "test-application-id"),
				zap.Int64("start", int64(1)),
				zap.Int64("end", int64(2)),
				zap.Int64("fetchStart", int64(3)),
				zap.Int64("fetchEnd", int64(4)),
				zap.Int64("executeStart", int64(5)),
				zap.Int64("executeEnd", int64(6)),
			},
			expectedLog: &agentv1.AuditLogRequest_AuditLog{
				Id:             "test-id",
				EntityId:       "test-entity-id",
				EntityType:     agentv1.AuditLogRequest_AuditLog_AUDIT_LOG_ENTITY_TYPE_APPLICATION,
				UserType:       v1.UserType_USER_TYPE_SUPERBLOCKS.Enum(),
				OrganizationId: "test-org-id",
				IsDeployed:     true,
				Source:         "test-source",
				Target:         "test-target",
				AgentId:        proto.String("test-agent-id"),
				Type:           agentv1.AuditLogRequest_AuditLog_AUDIT_LOG_EVENT_TYPE_API_RUN,
				Status:         agentv1.AuditLogRequest_AuditLog_API_RUN_STATUS_FAILED.Enum(),
				Error:          proto.String("test-error"),
				ApiLocationContext: &agentv1.AuditLogRequest_AuditLog_ApiLocationContext{
					ApplicationId: "test-application-id",
				},
				ApiTiming: &agentv1.AuditLogRequest_AuditLog_ApiTiming{
					Start: int64(1),
					End:   proto.Int64(int64(2)),
				},
			},
			expectedCall: 1,
		},
		{
			name: "Test userType external",
			zapFields: []zap.Field{
				zap.Bool("audit", true),
				zap.String("auditLogId", "test-id"),
				zap.String("entityId", "test-entity-id"),
				zap.String("entityType", agentv1.AuditLogRequest_AuditLog_AUDIT_LOG_ENTITY_TYPE_APPLICATION.String()),
				zap.String("organizationId", "test-org-id"),
				zap.Bool("isDeployed", true),
				zap.String("source", "test-source"),
				zap.String("userType", v1.UserType_USER_TYPE_EXTERNAL.String()),
				zap.String("target", "test-target"),
				zap.String("status", agentv1.AuditLogRequest_AuditLog_API_RUN_STATUS_FAILED.String()),
				zap.String("error", "test-error"),
				zap.String("applicationId", "test-application-id"),
				zap.Int64("start", int64(1)),
				zap.Int64("end", int64(2)),
				zap.Int64("fetchStart", int64(3)),
				zap.Int64("fetchEnd", int64(4)),
				zap.Int64("executeStart", int64(5)),
				zap.Int64("executeEnd", int64(6)),
			},
			expectedLog: &agentv1.AuditLogRequest_AuditLog{
				Id:             "test-id",
				EntityId:       "test-entity-id",
				EntityType:     agentv1.AuditLogRequest_AuditLog_AUDIT_LOG_ENTITY_TYPE_APPLICATION,
				UserType:       v1.UserType_USER_TYPE_EXTERNAL.Enum(),
				OrganizationId: "test-org-id",
				IsDeployed:     true,
				Source:         "test-source",
				Target:         "test-target",
				AgentId:        proto.String("test-agent-id"),
				Type:           agentv1.AuditLogRequest_AuditLog_AUDIT_LOG_EVENT_TYPE_API_RUN,
				Status:         agentv1.AuditLogRequest_AuditLog_API_RUN_STATUS_FAILED.Enum(),
				Error:          proto.String("test-error"),
				ApiLocationContext: &agentv1.AuditLogRequest_AuditLog_ApiLocationContext{
					ApplicationId: "test-application-id",
				},
				ApiTiming: &agentv1.AuditLogRequest_AuditLog_ApiTiming{
					Start: int64(1),
					End:   proto.Int64(int64(2)),
				},
			},
			expectedCall: 1,
		},
		{
			name: "Test userType unspecified",
			zapFields: []zap.Field{
				zap.Bool("audit", true),
				zap.String("auditLogId", "test-id"),
				zap.String("entityId", "test-entity-id"),
				zap.String("entityType", agentv1.AuditLogRequest_AuditLog_AUDIT_LOG_ENTITY_TYPE_APPLICATION.String()),
				zap.String("organizationId", "test-org-id"),
				zap.Bool("isDeployed", true),
				zap.String("source", "test-source"),
				zap.String("userType", v1.UserType_USER_TYPE_UNSPECIFIED.String()),
				zap.String("target", "test-target"),
				zap.String("status", agentv1.AuditLogRequest_AuditLog_API_RUN_STATUS_FAILED.String()),
				zap.String("error", "test-error"),
				zap.String("applicationId", "test-application-id"),
				zap.Int64("start", int64(1)),
				zap.Int64("end", int64(2)),
				zap.Int64("fetchStart", int64(3)),
				zap.Int64("fetchEnd", int64(4)),
				zap.Int64("executeStart", int64(5)),
				zap.Int64("executeEnd", int64(6)),
			},
			expectedLog: &agentv1.AuditLogRequest_AuditLog{
				Id:             "test-id",
				EntityId:       "test-entity-id",
				EntityType:     agentv1.AuditLogRequest_AuditLog_AUDIT_LOG_ENTITY_TYPE_APPLICATION,
				UserType:       v1.UserType_USER_TYPE_UNSPECIFIED.Enum(),
				OrganizationId: "test-org-id",
				IsDeployed:     true,
				Source:         "test-source",
				Target:         "test-target",
				AgentId:        proto.String("test-agent-id"),
				Type:           agentv1.AuditLogRequest_AuditLog_AUDIT_LOG_EVENT_TYPE_API_RUN,
				Status:         agentv1.AuditLogRequest_AuditLog_API_RUN_STATUS_FAILED.Enum(),
				Error:          proto.String("test-error"),
				ApiLocationContext: &agentv1.AuditLogRequest_AuditLog_ApiLocationContext{
					ApplicationId: "test-application-id",
				},
				ApiTiming: &agentv1.AuditLogRequest_AuditLog_ApiTiming{
					Start: int64(1),
					End:   proto.Int64(int64(2)),
				},
			},
			expectedCall: 1,
		},
		// Add more test cases if needed
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockHttpClient := mocks.NewServerClient(t)
			mockHttpClient.On("PostAuditLogs", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(&http.Response{
				StatusCode: http.StatusOK,
				Body:       http.NoBody,
			}, nil, nil)

			auditEmitter :=
				Emitter(
					ServerClient(mockHttpClient),
					Enabled(true),
					AgentId("test-agent-id"),
				)

			var logger *zap.Logger
			{
				l, err := log.Logger(&log.Options{
					Level: "debug",
					Emitters: []emitter.Emitter{
						auditEmitter,
					},
				})
				if err != nil {
					fmt.Fprintf(os.Stderr, "could not create logger: %s", err)
					os.Exit(1)
				}

				logger = l
			}

			logger.Info("test", tt.zapFields...)
			auditEmitter.Flush(nil)

			// wait for the flush to happen in goroutine
			time.Sleep(250 * time.Millisecond)

			mockHttpClient.AssertNumberOfCalls(t, "PostAuditLogs", tt.expectedCall)
			if tt.expectedCall > 0 {
				auditLog := mockHttpClient.Calls[0].Arguments[4].(*agentv1.AuditLogRequest).AuditLogs[0]
				assert.Equal(t, tt.expectedLog.String(), auditLog.String())
			}
		})
	}
}

func TestAuditFlushBufferSizeThreshold(t *testing.T) {
	metrics.RegisterMetrics()
	t.Parallel()
	mockHttpClient := mocks.NewServerClient(t)
	mockHttpClient.On("PostAuditLogs", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(&http.Response{
		StatusCode: http.StatusOK,
		Body:       http.NoBody,
	}, nil, nil)

	auditEmitter :=
		Emitter(
			ServerClient(mockHttpClient),
			Enabled(true),
			FlushMaxItems(3),
			FlushMaxDuration(10*time.Second),
			AgentId("test-agent-id"),
		)

	var logger *zap.Logger
	{
		l, err := log.Logger(&log.Options{
			Level: "debug",
			Emitters: []emitter.Emitter{
				auditEmitter,
			},
		})
		if err != nil {
			fmt.Fprintf(os.Stderr, "could not create logger: %s", err)
			os.Exit(1)
		}

		logger = l
	}

	zapFields := []zap.Field{
		zap.Bool("audit", true),
		zap.String("auditLogId", "test-id"),
		zap.String("entityId", "test-entity-id"),
		zap.String("entityType", agentv1.AuditLogRequest_AuditLog_AUDIT_LOG_ENTITY_TYPE_APPLICATION.String()),
		zap.String("organizationId", "test-org-id"),
		zap.Bool("isDeployed", true),
		zap.String("source", "test-source"),
		zap.String("target", "test-target"),
		zap.String("status", agentv1.AuditLogRequest_AuditLog_API_RUN_STATUS_FAILED.String()),
		zap.String("error", "test-error"),
		zap.String("applicationId", "test-application-id"),
		zap.Int64("start", int64(1)),
		zap.Int64("end", int64(2)),
		zap.Int64("fetchStart", int64(3)),
		zap.Int64("fetchEnd", int64(4)),
		zap.Int64("executeStart", int64(5)),
		zap.Int64("executeEnd", int64(6))}

	logger.Info("test", zapFields...)
	logger.Info("test", zapFields...)

	time.Sleep(250 * time.Millisecond)
	mockHttpClient.AssertNumberOfCalls(t, "PostAuditLogs", 0)

	logger.Info("test", zapFields...)
	// wait for the flush to happen in goroutine
	time.Sleep(250 * time.Millisecond)

	mockHttpClient.AssertNumberOfCalls(t, "PostAuditLogs", 1)
	assert.Equal(t, 3, len(mockHttpClient.Calls[0].Arguments[4].(*agentv1.AuditLogRequest).AuditLogs))
}

func TestAuditFlushTimeThreshold(t *testing.T) {
	t.Parallel()
	mockHttpClient := mocks.NewServerClient(t)
	mockHttpClient.On("PostAuditLogs", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(&http.Response{
		StatusCode: http.StatusOK,
		Body:       http.NoBody,
	}, nil, nil)

	auditEmitter :=
		Emitter(
			ServerClient(mockHttpClient),
			Enabled(true),
			FlushMaxItems(100),
			FlushMaxDuration(200*time.Millisecond),
			AgentId("test-agent-id"),
		)

	var logger *zap.Logger
	{
		l, err := log.Logger(&log.Options{
			Level: "debug",
			Emitters: []emitter.Emitter{
				auditEmitter,
			},
		})
		if err != nil {
			fmt.Fprintf(os.Stderr, "could not create logger: %s", err)
			os.Exit(1)
		}

		logger = l
	}

	zapFields := []zap.Field{
		zap.Bool("audit", true),
		zap.String("auditLogId", "test-id"),
		zap.String("entityId", "test-entity-id"),
		zap.String("entityType", agentv1.AuditLogRequest_AuditLog_AUDIT_LOG_ENTITY_TYPE_APPLICATION.String()),
		zap.String("organizationId", "test-org-id"),
		zap.Bool("isDeployed", true),
		zap.String("source", "test-source"),
		zap.String("target", "test-target"),
		zap.String("status", agentv1.AuditLogRequest_AuditLog_API_RUN_STATUS_FAILED.String()),
		zap.String("error", "test-error"),
		zap.String("applicationId", "test-application-id"),
		zap.Int64("start", int64(1)),
		zap.Int64("end", int64(2)),
		zap.Int64("fetchStart", int64(3)),
		zap.Int64("fetchEnd", int64(4)),
		zap.Int64("executeStart", int64(5)),
		zap.Int64("executeEnd", int64(6))}

	logger.Info("test", zapFields...)
	logger.Info("test", zapFields...)

	// wait until flush threshold
	time.Sleep(200 * time.Millisecond)

	// trigger the next flush
	logger.Info("test", zapFields...)

	// wait for the flush to happen in goroutine
	time.Sleep(250 * time.Millisecond)
	mockHttpClient.AssertNumberOfCalls(t, "PostAuditLogs", 1)
	assert.Equal(t, 3, len(mockHttpClient.Calls[0].Arguments[4].(*agentv1.AuditLogRequest).AuditLogs))
}
