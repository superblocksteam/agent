package auditlogs

import (
	"context"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/avast/retry-go"
	"github.com/superblocksteam/agent/pkg/clients"
	"github.com/superblocksteam/agent/pkg/observability/emitter"
	agentv1 "github.com/superblocksteam/agent/types/gen/go/agent/v1"
	v1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
	"github.com/superblocksteam/run"
	"go.uber.org/zap"
)

type audit struct {
	options      *Options
	logger       *zap.Logger
	mutex        *sync.RWMutex
	ticker       *time.Ticker
	serverClient clients.ServerClient
	lastFlush    time.Time

	buffer []*agentv1.AuditLogRequest_AuditLog

	final chan struct{}
	done  chan struct{}

	run.ForwardCompatibility
}

type Options struct {
	Enabled          bool
	FlushMaxDuration time.Duration
	FlushMaxItems    int
	ServerClient     clients.ServerClient
	AgentId          string
}

func Emitter(options ...Option) emitter.Emitter {
	ops := apply(options...)

	return &audit{
		options:      ops,
		ticker:       time.NewTicker(ops.FlushMaxDuration),
		serverClient: ops.ServerClient,
		lastFlush:    time.Now(),
		mutex:        &sync.RWMutex{},
		final:        make(chan struct{}),
		done:         make(chan struct{}),
	}
}

func (l *audit) Write(time time.Time, level string, message string, fields map[string]interface{}) error {
	auditLog, ok := l.extractAuditLogFromFields(fields)

	if !ok {
		return fmt.Errorf("could not extract audit log from fields")
	}

	l.mutex.Lock()
	l.buffer = append(l.buffer, auditLog)
	l.mutex.Unlock()

	if l.full() {
		return l.Flush(nil)
	}

	return nil
}

func (l *audit) Name() string {
	return "audit emitter"
}

func (l *audit) Flush(notify chan struct{}) error {
	l.mutex.Lock()
	defer l.mutex.Unlock()

	doNotify := func() {
		if notify != nil {
			notify <- struct{}{}
		}
	}

	if len(l.buffer) == 0 {
		doNotify()
		return nil
	}

	shallowCopy := l.buffer

	requestBody := &agentv1.AuditLogRequest{
		AuditLogs: shallowCopy,
	}

	go func() {
		err := retry.Do(
			func() error {
				var err error
				l.logger.Debug("flushing audit logs", zap.Int("count", len(requestBody.GetAuditLogs())), zap.Any("logs", requestBody))
				resp, err := l.serverClient.PostAuditLogs(context.Background(), nil, nil, nil, requestBody)
				if err != nil {
					l.logger.Warn("could not flush logs; got error from server", zap.Error(err))
					return err
				}
				if resp.StatusCode != http.StatusOK {
					l.logger.Warn("could not flush logs; got non-OK response from server", zap.Int("status_code", resp.StatusCode))
					err = fmt.Errorf("flushing logs received non-OK response from server")
				}
				return err
			},
			retry.Attempts(10), // make this configurable?
		)
		if err != nil {
			l.logger.Warn("could not flush logs; dropping", zap.Error(err))
		}
		doNotify()
	}()

	l.buffer = []*agentv1.AuditLogRequest_AuditLog{}
	l.lastFlush = time.Now()

	return nil
}

func (l *audit) Run(context.Context) error {
	for {
		select {
		case <-l.done:
			// NOTE(frank): we do this here instead of in
			// Close because we want close to return asap.
			<-l.final
			return nil
		case <-l.ticker.C:
			l.Flush(nil)
		}
	}
}

func (*audit) Alive() bool { return true }

func (l *audit) Close(context.Context) (err error) {
	l.ticker.Stop()
	close(l.done)

	if err := l.Flush(l.final); err != nil {
		return err
	}

	return
}

func (l *audit) Logger(logger *zap.Logger) {
	(*l).logger = logger.With(zap.String("who", "emitter.audit"))
}

func (l *audit) Trigger() string { return "audit" }

func (l *audit) Enabled() bool { return l.options.Enabled }

func (l *audit) full() bool {
	l.mutex.RLock()
	defer l.mutex.RUnlock()

	if len(l.buffer) >= l.options.FlushMaxItems {
		return true
	}

	if time.Since(l.lastFlush) > l.options.FlushMaxDuration {
		return true
	}

	return false
}

func (l *audit) extractAuditLogFromFields(fields map[string]interface{}) (*agentv1.AuditLogRequest_AuditLog, bool) {
	id, ok := fields["auditLogId"].(string)
	if !ok {
		return nil, false
	}

	auditLog := &agentv1.AuditLogRequest_AuditLog{
		Id:        id,
		Type:      agentv1.AuditLogRequest_AuditLog_AUDIT_LOG_EVENT_TYPE_API_RUN,
		ApiTiming: &agentv1.AuditLogRequest_AuditLog_ApiTiming{},
		AgentId:   &l.options.AgentId,
	}

	entityId, ok := fields["entityId"].(string)
	if ok {
		auditLog.EntityId = entityId
	}

	entityTypeString, ok := fields["entityType"].(string)
	if ok {
		switch entityTypeString {
		case agentv1.AuditLogRequest_AuditLog_AUDIT_LOG_ENTITY_TYPE_APPLICATION.String():
			auditLog.EntityType = agentv1.AuditLogRequest_AuditLog_AUDIT_LOG_ENTITY_TYPE_APPLICATION
		case agentv1.AuditLogRequest_AuditLog_AUDIT_LOG_ENTITY_TYPE_WORKFLOW.String():
			auditLog.EntityType = agentv1.AuditLogRequest_AuditLog_AUDIT_LOG_ENTITY_TYPE_WORKFLOW
		case agentv1.AuditLogRequest_AuditLog_AUDIT_LOG_ENTITY_TYPE_SCHEDULED_JOB.String():
			auditLog.EntityType = agentv1.AuditLogRequest_AuditLog_AUDIT_LOG_ENTITY_TYPE_SCHEDULED_JOB
		}
	}

	isDeployed, ok := fields["isDeployed"].(bool)
	if ok {
		auditLog.IsDeployed = isDeployed
	}

	source, ok := fields["source"].(string)
	if ok {
		auditLog.Source = source
	}

	userTypeString, ok := fields["userType"].(string)
	var userType v1.UserType
	if ok {
		switch userTypeString {
		case v1.UserType_USER_TYPE_SUPERBLOCKS.String():
			userType = v1.UserType_USER_TYPE_SUPERBLOCKS
		case v1.UserType_USER_TYPE_EXTERNAL.String():
			userType = v1.UserType_USER_TYPE_EXTERNAL
		}
		auditLog.UserType = &userType
	}

	target, ok := fields["target"].(string)
	if ok {
		auditLog.Target = target
	}

	start, ok := fields["start"].(int64)
	if ok {
		auditLog.ApiTiming.Start = start
	}

	organizationId, ok := fields["organizationId"].(string)
	if ok {
		auditLog.OrganizationId = organizationId
	}

	applicationId, ok := fields["applicationId"].(string)
	if ok {
		auditLog.ApiLocationContext = &agentv1.AuditLogRequest_AuditLog_ApiLocationContext{
			ApplicationId: applicationId,
		}
	}

	statusString, ok := fields["status"].(string)

	var status agentv1.AuditLogRequest_AuditLog_ApiRunStatus
	if ok {
		switch statusString {
		case agentv1.AuditLogRequest_AuditLog_API_RUN_STATUS_SUCCESS.String():
			status = agentv1.AuditLogRequest_AuditLog_API_RUN_STATUS_SUCCESS
		case agentv1.AuditLogRequest_AuditLog_API_RUN_STATUS_FAILED.String():
			status = agentv1.AuditLogRequest_AuditLog_API_RUN_STATUS_FAILED
		default:
			return nil, false
		}

		auditLog.Status = &status
	}

	errorString, ok := fields["error"].(string)
	if ok {
		auditLog.Error = &errorString
	}

	end, ok := fields["end"].(int64)
	if ok {
		auditLog.ApiTiming.End = &end
	}

	return auditLog, true
}
