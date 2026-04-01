package v1

import (
	"bytes"
	"encoding/json"
	"strings"

	"github.com/golang/protobuf/jsonpb"
	"google.golang.org/protobuf/types/known/structpb"
)

var (
	unmarshaler = &jsonpb.Unmarshaler{}
)

func (a *Api) UnmarshalJSON(data []byte) error {
	return unmarshaler.Unmarshal(bytes.NewReader(data), a)
}

// outputOldJSON is the JSON shape written by workers. It extends OutputOld with an
// error field that workers set when the JS bundle throws at runtime. OutputOld
// proto does not have this field, so we parse it separately.
type outputOldJSON struct {
	Output           *structpb.Value `json:"output"`
	Log              []string        `json:"log"`
	Request          string          `json:"request"`
	PlaceHoldersInfo *structpb.Value `json:"placeHoldersInfo"`
	PlaceholdersInfo *structpb.Value `json:"placeholdersInfo"` // worker may use this
	Error            string          `json:"error"`
}

// OutputFromOutputOld converts OutputOld (worker format) to Output.
// Use with protojson.Unmarshal when reading worker output from the store,
// since workers write OutputOld using protojson (camelCase).
// Note: OutputFromOutputOld does not map the worker's error field (workers set
// output.error when JS throws). Use OutputFromOutputOldJSON when reading raw
// worker JSON from the store to preserve error state.
func OutputFromOutputOld(old *OutputOld) *Output {
	if old == nil {
		return &Output{}
	}
	o := &Output{}
	for _, log := range old.Log {
		if strings.HasPrefix(log, "[ERROR] ") {
			o.Stderr = append(o.Stderr, strings.TrimPrefix(log, "[ERROR] "))
		} else {
			o.Stdout = append(o.Stdout, log)
		}
	}
	o.Result = old.Output
	o.RequestV2 = &Output_Request{Summary: old.Request}
	if old.PlaceHoldersInfo != nil {
		o.RequestV2.Metadata = &structpb.Struct{
			Fields: map[string]*structpb.Value{
				"placeHoldersInfo": old.PlaceHoldersInfo,
			},
		}
	}
	o.Request = old.Request
	return o
}

// OutputFromOutputOldJSON parses raw worker JSON and converts to Output.
// Workers write ExecutionOutput (output, log, request, placeHoldersInfo, error)
// to the store. The error field is set when the JS bundle throws at runtime but
// is not part of the OutputOld proto. This function preserves that error state
// by mapping it to Output.Stderr so code-mode execution correctly reports failure.
func OutputFromOutputOldJSON(jsonBytes []byte) (*Output, error) {
	var raw outputOldJSON
	if err := json.Unmarshal(jsonBytes, &raw); err != nil {
		return nil, err
	}
	old := &OutputOld{
		Output:  raw.Output,
		Log:     raw.Log,
		Request: raw.Request,
	}
	if raw.PlaceHoldersInfo != nil {
		old.PlaceHoldersInfo = raw.PlaceHoldersInfo
	} else if raw.PlaceholdersInfo != nil {
		old.PlaceHoldersInfo = raw.PlaceholdersInfo
	}
	o := OutputFromOutputOld(old)
	if raw.Error != "" {
		o.Stderr = append(o.Stderr, raw.Error)
	}
	return o, nil
}

// diagnosticsJSON is the JSON shape of the diagnostics array written by the
// JS worker alongside the standard output fields. It maps to the proto
// IntegrationDiagnostic message.
type diagnosticMetadataJSON struct {
	Label       string `json:"label,omitempty"`
	Description string `json:"description,omitempty"`
}

type diagnosticJSON struct {
	IntegrationId      string                  `json:"integrationId"`
	PluginId           string                  `json:"pluginId"`
	Input              string                  `json:"input"`
	Output             string                  `json:"output"`
	StartMs            int64                   `json:"startMs"`
	EndMs              int64                   `json:"endMs"`
	DurationMs         int64                   `json:"durationMs"`
	Error              string                  `json:"error"`
	ErrorCode          string                  `json:"errorCode,omitempty"`
	Sequence           int32                   `json:"sequence"`
	Metadata           *diagnosticMetadataJSON `json:"metadata,omitempty"`
	InputWasTruncated  bool                    `json:"inputWasTruncated,omitempty"`
	OutputWasTruncated bool                    `json:"outputWasTruncated,omitempty"`
}

// diagnosticsWrapper wraps just the diagnostics field from the worker JSON
// so we can parse it independently from the output fields.
type diagnosticsWrapper struct {
	Diagnostics []diagnosticJSON `json:"diagnostics"`
}

// DiagnosticsFromOutputJSON extracts integration diagnostic records from the
// raw worker output JSON. Returns nil when no diagnostics are present.
func DiagnosticsFromOutputJSON(jsonBytes []byte) []*IntegrationDiagnostic {
	var wrapper diagnosticsWrapper
	if err := json.Unmarshal(jsonBytes, &wrapper); err != nil || len(wrapper.Diagnostics) == 0 {
		return nil
	}
	result := make([]*IntegrationDiagnostic, 0, len(wrapper.Diagnostics))
	for _, d := range wrapper.Diagnostics {
		diag := &IntegrationDiagnostic{
			IntegrationId:      d.IntegrationId,
			PluginId:           d.PluginId,
			InputTruncated:     d.Input,
			OutputTruncated:    d.Output,
			StartMs:            d.StartMs,
			EndMs:              d.EndMs,
			DurationMs:         d.DurationMs,
			Error:              d.Error,
			ErrorCode:          d.ErrorCode,
			Sequence:           d.Sequence,
			InputWasTruncated:  d.InputWasTruncated,
			OutputWasTruncated: d.OutputWasTruncated,
		}
		if d.Metadata != nil {
			diag.Metadata = &TraceMetadata{
				Label:       d.Metadata.Label,
				Description: d.Metadata.Description,
			}
		}
		result = append(result, diag)
	}
	return result
}

func (o *Output) ToOld() *OutputOld {
	var logsCombined []string
	for _, log := range o.GetStdout() {
		logsCombined = append(logsCombined, log)
	}
	for _, err := range o.GetStderr() {
		logsCombined = append(logsCombined, "[ERROR] "+err)
	}

	var requestSummary string
	if o.GetRequest() != "" {
		requestSummary = o.GetRequest()
	} else if o.GetRequestV2() != nil {
		requestSummary = o.GetRequestV2().GetSummary()
	}

	var placeHoldersInfo *structpb.Value
	if val, ok := o.GetRequestV2().GetMetadata().GetFields()["placeHoldersInfo"]; ok {
		placeHoldersInfo = val
	}

	return &OutputOld{
		Output:           o.GetResult(),
		Log:              logsCombined,
		Request:          requestSummary,
		PlaceHoldersInfo: placeHoldersInfo,
	}
}

func (o *Output) UnmarshalJSON(data []byte) (err error) {
	var tmp outputOldJSON
	{
		if err := json.Unmarshal(data, &tmp); err != nil {
			return err
		}
	}

	for _, log := range tmp.Log {
		if strings.HasPrefix(log, "[ERROR] ") {
			o.Stderr = append(o.Stderr, strings.TrimPrefix(log, "[ERROR] "))
		} else {
			o.Stdout = append(o.Stdout, log)
		}
	}
	if tmp.Error != "" {
		o.Stderr = append(o.Stderr, tmp.Error)
	}

	o.Result = tmp.Output

	o.RequestV2 = &Output_Request{
		Summary: tmp.Request,
	}

	placeHoldersInfo := tmp.PlaceHoldersInfo
	if placeHoldersInfo == nil {
		placeHoldersInfo = tmp.PlaceholdersInfo
	}
	if placeHoldersInfo != nil {
		o.RequestV2.Metadata = &structpb.Struct{
			Fields: map[string]*structpb.Value{
				"placeHoldersInfo": placeHoldersInfo,
			},
		}
	}

	// TODO: deprecate me
	o.Request = tmp.Request

	return
}
