package errors

import (
	"fmt"

	commonv1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
)

type QuotaError struct {
	Msg        string
	Kind       string
	IsTerminal bool
}

func (e *QuotaError) Error() string {
	return fmt.Sprintf("QuotaError: %s", e.Msg)
}

func NewQuotaError(msg string, kind string) *QuotaError {
	return &QuotaError{
		Msg:  msg,
		Kind: kind,
	}
}

// Terminal quotas are meant to end the API execution immediately.
// Otherwise they are scoped to the current step (eg step size, step duration)
func TerminalQuotaError(msg string, kind string) *QuotaError {
	return &QuotaError{
		Msg:        msg,
		Kind:       kind,
		IsTerminal: true,
	}
}

func (e *QuotaError) ToCommonV1() *commonv1.Error {
	return &commonv1.Error{
		Name:    "QuotaError",
		Message: e.Msg,
	}
}

func ApiTimeoutQuotaError(timeoutSeconds float64) *QuotaError {
	return TerminalQuotaError(fmt.Sprintf("This API has exceeded its timeout of %v seconds. Contact support to increase this quota.", timeoutSeconds), "api_timeout_exceeded")
}
func ComputeUnitsQuotaError(rate float64) *QuotaError {
	return TerminalQuotaError(fmt.Sprintf("Your organization has exceeded its weekly compute limit of %v minutes. This only occurs under unexpected usage patterns. The Superblocks team has been notified.", rate), "organization_compute_units_breached")
}
func StreamSizeQuotaError(limitBytes int) *QuotaError {
	limitMegaBytes := float64(limitBytes) / 1000000.0
	return NewQuotaError(fmt.Sprintf("A message received by the send block has exceeded its limit of %vMB. Contact support to increase this quota.", limitMegaBytes), "stream_size_exceeded")
}
func StepSizeQuotaError(blockName string, limitBytes int32) *QuotaError {
	limitMegaBytes := float64(limitBytes) / 1000000.0
	return NewQuotaError(fmt.Sprintf("The response size of block %s has exceeded its limit of %vMB. Contact support to increase this quota.", blockName, limitMegaBytes), "step_size_exceeded")
}
func StepDurationQuotaError(blockName string, durationSeconds int32) *QuotaError {
	return NewQuotaError(fmt.Sprintf("The duration of block %s has exceeded its limit of %v seconds. Contact support to increase this quota.", blockName, durationSeconds), "language_step_duration_exceeded")
}
func OrgStepRateQuotaError(stepRate int) *QuotaError {
	return TerminalQuotaError(fmt.Sprintf("Your organization has exceeded its block rate limit of %v per second. This only occurs under unexpected usage patterns. The Superblocks team has been notified.", stepRate), "organization_step_rate_exceeded")
}
func ApiStepRateQuotaError(stepRate int) *QuotaError {
	return TerminalQuotaError(fmt.Sprintf("This api has exceeded its block rate limit of %v per second. Contact support to increase this quota.", stepRate), "api_step_rate_exceeded")
}
func PluginStepRateQuotaError(pluginName string, stepRate int) *QuotaError {
	return TerminalQuotaError(fmt.Sprintf("The plugin %s has exceeded its block rate limit of %v per second. Contact support to increase this quota.", pluginName, stepRate), "plugin_step_rate_exceeded")
}
func UserStepRateQuotaError(user string, stepRate int) *QuotaError {
	return TerminalQuotaError(fmt.Sprintf("User %s has exceeded their block rate limit of %v per second. Contact support to increase this quota.", user, stepRate), "user_step_rate_exceeded")
}
