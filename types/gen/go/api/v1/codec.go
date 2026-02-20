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
