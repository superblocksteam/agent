package transport

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strconv"
	"strings"

	"github.com/golang/protobuf/jsonpb"
	"github.com/superblocksteam/agent/internal/fetch"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	commonv1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
	"google.golang.org/protobuf/encoding/protojson"
	"google.golang.org/protobuf/types/known/structpb"
)

const (
	TransformedTokenQueryParam                 = "fetch.token"
	TransformedTestQueryParam                  = "fetch.test"
	TransformedBranchNameQueryParam            = "fetch.branch_name"
	TransformedEnvironmentQueryParam           = "fetch.profile.environment"
	TransformedProfileNameQueryParam           = "fetch.profile.name"
	TransformedProfileIdQueryParam             = "fetch.profile.id"
	TransformedOptionsIncludeEventOutputsParam = "options.include_event_outputs"
	TransformedOptionsIncludeEvents            = "options.include_events"
	TransformedOptionsAsync                    = "options.async"
)

var (
	knownQueryParams = map[string]bool{
		TransformedTokenQueryParam:                 true,
		TransformedTestQueryParam:                  true,
		TransformedBranchNameQueryParam:            true,
		TransformedEnvironmentQueryParam:           true,
		TransformedOptionsAsync:                    true,
		TransformedProfileNameQueryParam:           true,
		TransformedProfileIdQueryParam:             true,
		TransformedOptionsIncludeEventOutputsParam: true,
		TransformedOptionsIncludeEvents:            true,
	}

	marshaler   = jsonpb.Marshaler{}
	unmarshaler = protojson.UnmarshalOptions{
		AllowPartial: true,
	}

	supportedContentTypes = []string{
		"",
		"application/json",
		"application/x-www-form-urlencoded",
	}
)

// NOTE: This is only used by workflows. It's confusing, but the proto annotation for grpc gateway
// only backfills the query parameters into the request body if the request is for Workflows. We don't whitelist
// them for execute requests

// https://github.com/grpc-ecosystem/grpc-gateway/issues/234
// Grpc gateway transforms either query params or body into the grpc request (depending on grpc-gateway proto annotations)
// However, it cannot do both, but we need to do both for workflows. So for workflows, We choose to query params + body + headers => body
// For everything else we just let the body pass through, since that is what will be used for the grpc request (on
func HackUntilWeHaveGoKit(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		values := r.URL.Query()

		if token := r.URL.Query().Get(fetch.QueryParamAuth); token != "" {
			values.Del(fetch.QueryParamAuth)
			if !strings.HasPrefix(token, "Bearer ") {
				token = "Bearer " + token
			}
			values.Set(TransformedTokenQueryParam, token)
		}
		if test := r.URL.Query().Get(fetch.QueryParamTest); test != "" {
			values.Del(fetch.QueryParamTest)
			values.Set(TransformedTestQueryParam, test)
		}
		if environment := r.URL.Query().Get(fetch.QueryParamEnvironment); environment != "" {
			values.Del(fetch.QueryParamEnvironment)
			values.Set(TransformedEnvironmentQueryParam, environment)
		}
		if async := r.URL.Query().Get(fetch.QueryParamAsync); async != "" {
			values.Del(fetch.QueryParamAsync)
			values.Set(TransformedOptionsAsync, async)
		}
		if profileName := r.URL.Query().Get(fetch.QueryParamProfileName); profileName != "" {
			values.Del(fetch.QueryParamProfileName)
			values.Set(TransformedProfileNameQueryParam, profileName)
		}
		if profileID := r.URL.Query().Get(fetch.QueryParamProfileID); profileID != "" {
			values.Del(fetch.QueryParamProfileID)
			values.Set(TransformedProfileIdQueryParam, profileID)
		}
		var rawResultsBool bool
		{
			if rawResults := r.URL.Query().Get(fetch.QueryParamRawResults); rawResults != "" {
				values.Del(fetch.QueryParamRawResults)
				var err error
				rawResultsBool, err = strconv.ParseBool(rawResults)
				if err != nil {
					http.Error(w, err.Error(), http.StatusBadRequest)
				}
			}
		}

		// If we are using the workflow-specific entrypoint, we allow the Superblocks
		// API key to be passed as both a query parameter and a header. This code
		// extracts the header value (if used), and sets the appropriate protobuf field.
		if maybeToken := r.Header.Get("Authorization"); maybeToken != "" {
			values.Set(TransformedTokenQueryParam, maybeToken)
		}

		r.URL.RawQuery = values.Encode()

		if workflow, version := isWorkflow(r.URL.Path); workflow {
			if err := transformWorkflowRequest(r, version); err != nil {
				http.Error(w, err.Error(), http.StatusBadRequest)
				return
			}

			if version == "v1" && rawResultsBool {
				h.ServeHTTP(&rawResponseWriter{w}, r)
				return
			}
		}

		h.ServeHTTP(w, r)
	})
}

// This is literally only used for us to get raw results from workflows
type rawResponseWriter struct {
	w http.ResponseWriter
}

func (r *rawResponseWriter) Header() http.Header {
	return r.w.Header()
}

func (r *rawResponseWriter) Write(b []byte) (int, error) {
	// Not going to make this generic since this is a horrible hack
	response := &apiv1.WorkflowResponse{}
	err := unmarshaler.Unmarshal(b, response)

	if err != nil {
		// Don't try to apply raw logic, just write the response since this is likely an error message
		return r.w.Write(b)
	}

	var result []byte
	if response.Data == nil {
		result = []byte("")
		r.w.Header().Del("Content-Type")
	} else if _, ok := response.Data.GetKind().(*structpb.Value_StringValue); ok {
		result = []byte(response.Data.GetStringValue())
		r.w.Header().Set("Content-Type", "text/plain")
	} else if _, ok := response.Data.GetKind().(*structpb.Value_NumberValue); ok {
		result = []byte(fmt.Sprintf("%f", response.Data.GetNumberValue()))
		r.w.Header().Set("Content-Type", "text/plain")
	} else if _, ok := response.Data.GetKind().(*structpb.Value_BoolValue); ok {
		result = []byte(fmt.Sprintf("%t", response.Data.GetBoolValue()))
		r.w.Header().Set("Content-Type", "text/plain")
	} else if _, ok := response.Data.GetKind().(*structpb.Value_NullValue); ok {
		result = []byte("")
		r.w.Header().Del("Content-Type")
	} else {
		var err error
		result, err = protojson.Marshal(response.Data)
		if err != nil {
			r.w.Header().Set("Content-Type", "text/plain")
			r.w.WriteHeader(http.StatusInternalServerError)
			return r.w.Write([]byte(err.Error()))
		}
	}

	return r.w.Write(result)
}

func (r *rawResponseWriter) WriteHeader(statusCode int) {
	r.w.WriteHeader(statusCode)
}

func isWorkflow(path string) (bool, string) {
	if strings.HasPrefix(path, "/v1/workflows") || strings.HasPrefix(path, "/agent/v1/workflows") {
		return true, "v1"
	}

	matched, err := regexp.MatchString(`/v2/execute(/stream)?/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}`, path)
	return err != nil || matched, "v2"
}

// Workflows dont transform query params, only body params. We need to transpose both query + body into grpc request body
func transformWorkflowRequest(r *http.Request, version string) (err error) {
	request := &apiv1.ExecuteRequest{
		Request: &apiv1.ExecuteRequest_Fetch_{
			Fetch: &apiv1.ExecuteRequest_Fetch{
				Profile: &commonv1.Profile{},
				// Default view mode. Then override if test parameter is true
				ViewMode: apiv1.ViewMode_VIEW_MODE_DEPLOYED,
			},
		},
		Inputs:  map[string]*structpb.Value{},
		Options: &apiv1.ExecuteRequest_Options{},
	}

	var body *structpb.Struct
	{
		if r.Body != nil {
			defer r.Body.Close()

			if body, err = parseBody(r, version); err != nil {
				return
			}
		}
	}

	var query *structpb.Struct
	{
		query = &structpb.Struct{
			Fields: map[string]*structpb.Value{},
		}

		for key, values := range r.URL.Query() {
			if value := urlValuesToPb(key, values); value != nil {
				query.Fields[key] = value
			}
		}
	}

	request.Inputs["params"] = structpb.NewStructValue(query)
	request.Inputs["body"] = structpb.NewStructValue(body)

	if token := r.URL.Query().Get(TransformedTokenQueryParam); token != "" {
		request.Request.(*apiv1.ExecuteRequest_Fetch_).Fetch.Token = &token
	}

	if test := r.URL.Query().Get(TransformedTestQueryParam); test != "" {
		testBool, err := strconv.ParseBool(test)
		if err != nil {
			return err
		}

		request.Request.(*apiv1.ExecuteRequest_Fetch_).Fetch.Test = &testBool

		if testBool {
			request.Request.(*apiv1.ExecuteRequest_Fetch_).Fetch.ViewMode = apiv1.ViewMode_VIEW_MODE_EDIT
		}
	}

	if environment := r.URL.Query().Get(TransformedEnvironmentQueryParam); environment != "" {
		request.Request.(*apiv1.ExecuteRequest_Fetch_).Fetch.Profile.Environment = &environment
	}

	if profileName := r.URL.Query().Get(TransformedProfileNameQueryParam); profileName != "" {
		request.Request.(*apiv1.ExecuteRequest_Fetch_).Fetch.Profile.Name = &profileName
	}

	if profileID := r.URL.Query().Get(TransformedProfileIdQueryParam); profileID != "" {
		request.Request.(*apiv1.ExecuteRequest_Fetch_).Fetch.Profile.Id = &profileID
	}

	if branchName := r.URL.Query().Get(TransformedBranchNameQueryParam); branchName != "" {
		request.Request.(*apiv1.ExecuteRequest_Fetch_).Fetch.BranchName = &branchName
	}

	if include := r.URL.Query().Get(TransformedOptionsIncludeEventOutputsParam); include != "" {
		includeBool, err := strconv.ParseBool(include)
		if err != nil {
			return err
		}
		request.Options.IncludeEventOutputs = includeBool
	}

	if include := r.URL.Query().Get(TransformedOptionsIncludeEvents); include != "" {
		includeBool, err := strconv.ParseBool(include)
		if err != nil {
			return err
		}
		request.Options.IncludeEvents = includeBool
	}

	if async := r.URL.Query().Get(TransformedOptionsAsync); async != "" {
		asyncBool, err := strconv.ParseBool(async)
		if err != nil {
			return err
		}
		request.Options.Async = asyncBool
	}

	var buf bytes.Buffer
	{
		if err := marshaler.Marshal(&buf, request); err != nil {
			return err
		}
	}

	r.Body = io.NopCloser(&buf)
	return nil
}

func parseBody(req *http.Request, version string) (*structpb.Struct, error) {
	var contentType string
	{
		contentType = req.Header.Get("content-type")

		match := false
		for _, ct := range supportedContentTypes {
			if strings.Contains(contentType, ct) {
				match = true
				break
			}
		}

		if !match {
			return nil, fmt.Errorf("unsupported content-type: %s", contentType)
		}
	}

	switch version {
	case "v1":
		return parseBodyV1(req, contentType)
	case "v2":
		return parseBodyV2(req, contentType)
	default:
		return nil, nil
	}
}

func parseBodyV2(req *http.Request, contentType string) (*structpb.Struct, error) {
	if !strings.Contains(contentType, "application/json") {
		return parseForm(req)
	}

	data, err := io.ReadAll(req.Body)
	if err != nil {
		return nil, err
	}

	var body structpb.Struct
	if len(data) > 0 {
		if err := json.Unmarshal(data, &body); err != nil && err != io.EOF {
			return nil, fmt.Errorf("could not parse body with content-type '%s', err: %s", contentType, err.Error())
		}
	}

	return &body, nil
}

func parseForm(req *http.Request) (*structpb.Struct, error) {
	if err := req.ParseForm(); err != nil {
		return nil, fmt.Errorf("could not parse body with content-type 'x-www-url-encoded', err: %s", err.Error())
	}

	body := &structpb.Struct{
		Fields: map[string]*structpb.Value{},
	}

	// loop through the form values and add them to the body
	for key, values := range req.PostForm {
		if value := urlValuesToPb(key, values); value != nil {
			body.Fields[key] = value
		}
	}

	return body, nil
}

func parseBodyV1(req *http.Request, contentType string) (*structpb.Struct, error) {
	var body *structpb.Struct

	data, err := io.ReadAll(req.Body)
	if err != nil {
		return nil, err
	}

	// If the body is empty, we need to return an empty structpb.Struct
	// and not attempt to unmarshal the empty body
	if len(data) == 0 {
		return &structpb.Struct{}, nil
	}

	// Even if the user is telling us this is x-www-form-urlencoded, we still
	// try to parse it as json first

	err = json.Unmarshal(data, &body)
	if err == nil {
		return body, nil
	}

	// If unmarshalling fails, we then assume the user is correct lol
	if strings.Contains(contentType, "x-www-form-urlencoded") {
		req.Body = io.NopCloser(bytes.NewReader(data))
		return parseForm(req)
	}

	return nil, fmt.Errorf("could not parse body with content-type '%s', err: %s", contentType, err.Error())
}

func urlValuesToPb(key string, values []string) *structpb.Value {
	if _, ok := knownQueryParams[key]; ok {
		return nil
	}

	var value *structpb.Value
	{
		switch len(values) {
		case 0:
			return nil
		case 1:
			value = structpb.NewStringValue(values[0])
		default:
			list := make([]*structpb.Value, len(values))
			for i, value := range values {
				list[i] = structpb.NewStringValue(value)
			}
			value = structpb.NewListValue(&structpb.ListValue{
				Values: list,
			})
		}
	}

	return value
}
