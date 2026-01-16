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
	var tmp OutputOld
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

	o.Result = tmp.Output

	o.RequestV2 = &Output_Request{
		Summary: tmp.Request,
	}

	if tmp.PlaceHoldersInfo != nil {
		o.RequestV2.Metadata = &structpb.Struct{
			Fields: map[string]*structpb.Value{
				"placeHoldersInfo": tmp.PlaceHoldersInfo,
			},
		}
	}

	// TODO: deprecate me
	o.Request = tmp.Request

	return
}
