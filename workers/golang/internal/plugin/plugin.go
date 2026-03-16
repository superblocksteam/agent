package plugin

import (
	"workers/shared/plugin"
)

// Plugin re-exports the shared Plugin interface for backward compatibility.
type Plugin = plugin.Plugin

// PluginStatus re-exports the shared PluginStatus interface for backward compatibility.
type PluginStatus = plugin.PluginStatus

// DegradationState re-exports the shared DegradationState enum for backward compatibility.
type DegradationState = plugin.DegradationState

const (
	DegradationState_UNSPECIFIED DegradationState = plugin.DegradationState_UNSPECIFIED
	DegradationState_NONE        DegradationState = plugin.DegradationState_NONE
	DegradationState_TRANSIENT   DegradationState = plugin.DegradationState_TRANSIENT
	DegradationState_FATAL       DegradationState = plugin.DegradationState_FATAL
)
