package clients

import (
	"bytes"
	"context"
	"encoding/json"
	builtInErrors "errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"

	"github.com/golang/protobuf/jsonpb"
	"github.com/superblocksteam/agent/pkg/errors"
	"google.golang.org/protobuf/runtime/protoiface"
)

//go:generate mockery --name=HttpClient --output ./mocks --structname HttpClient
type HttpClient interface {
	Do(req *http.Request) (*http.Response, error)
}

func combineHeaders(headers map[string]string, override http.Header) http.Header {
	combinedHeaders := http.Header{}

	if headers != nil {
		for k, v := range headers {
			combinedHeaders.Set(k, v)
		}
	}

	if override != nil {
		for k, v := range override {
			combinedHeaders[k] = v
		}
	}

	return combinedHeaders
}

func buildRequest(ctx context.Context, method string, baseUrl string, path string, headers http.Header, query url.Values, body interface{}) (*http.Request, error) {
	buf, err := marshal(body)
	if err != nil {
		return nil, err
	}

	u, err := url.Parse(strings.TrimSuffix(fmt.Sprintf("%s/%s", baseUrl, path), "/"))
	if err != nil {
		return nil, err
	}

	if query != nil {
		u.RawQuery = query.Encode()
	}

	req, err := http.NewRequestWithContext(ctx, method, u.String(), buf)
	if err != nil {
		return nil, err
	}

	req.Header = headers

	return req, nil
}

func marshal(x any) (io.Reader, error) {
	if x == nil {
		return nil, nil
	}

	var buf bytes.Buffer
	var err error
	{
		if proto, ok := x.(protoiface.MessageV1); ok {
			err = (&jsonpb.Marshaler{}).Marshal(&buf, proto)
		} else {
			err = json.NewEncoder(&buf).Encode(x)
		}
	}

	if err != nil {
		return nil, err
	}

	return &buf, nil
}

func Check(err error, resp *http.Response) (internal, external error) {
	if err != nil {
		return err, new(errors.InternalError)
	}

	if resp.StatusCode == http.StatusUnauthorized {
		return err, errors.AuthorizationError()
	}
	if resp.StatusCode == http.StatusNotFound {
		err := new(errors.NotFoundError)
		return err, err
	}
	if resp.StatusCode == http.StatusBadRequest {

		// We need to tee the response body so we can read it twice
		var buf bytes.Buffer
		tee := io.TeeReader(resp.Body, &buf)
		resp.Body = io.NopCloser(&buf)

		var errorResponse struct {
			ResponseMeta struct {
				Message string `json:"message"`
			} `json:"responseMeta"`
		}

		if err2 := json.NewDecoder(tee).Decode(&errorResponse); err2 == nil {
			return err, errors.BadRequestError(builtInErrors.New(errorResponse.ResponseMeta.Message))
		}
	}
	if resp.StatusCode != http.StatusOK {
		bs, err := io.ReadAll(resp.Body)
		if err != nil {
			return fmt.Errorf("fetch downstream returned a %d status code", resp.StatusCode), new(errors.InternalError)
		} else {
			return fmt.Errorf("fetch downstream returned a %d status code: %s", resp.StatusCode, string(bs)), new(errors.InternalError)
		}
	}

	return nil, nil
}
