package types

import (
	"encoding/json"
	"net/http"
	"strconv"

	pluginscommon "github.com/superblocksteam/agent/types/gen/go/plugins/common/v1"
	"google.golang.org/protobuf/types/known/structpb"
)

type AuthConfigWrapper struct {
	// AuthConfigOld is defined in shared package
	AuthConfigOld *structpb.Struct
	// AuthConfigNew is defined in proto types
	AuthConfigNew *pluginscommon.Auth
}

type CheckAuthResponse struct {
	Authenticated bool
	Cookies       []*http.Cookie
}

type Response struct {
	AccessToken  string `json:"access_token"`
	IdToken      string `json:"id_token,omitempty"` // An OIDC concept
	RefreshToken string `json:"refresh_token,omitempty"`
	ExpiresIn    int    `json:"expires_in,omitempty"`
	IssuedAt     int    `json:"issued_at,omitempty"`
	Error        string `json:"error,omitempty"`
}

func (r *Response) UnmarshalJSON(data []byte) (err error) {
	type alias Response

	type response struct {
		alias

		ExpiresIn any `json:"expires_in,omitempty"`
		IssuedAt  any `json:"issued_at,omitempty"`
	}

	var tmp response
	if err = json.Unmarshal(data, &tmp); err != nil {
		return err
	}

	(*r) = Response(tmp.alias)

	r.ExpiresIn, err = transform(tmp.ExpiresIn)
	r.IssuedAt, err = transform(tmp.IssuedAt)

	return
}

func transform(value any) (int, error) {
	switch v := value.(type) {
	case string:
		return strconv.Atoi(v)
	case float64:
		return int(v), nil
	default:
		return 0, nil
	}
}

// CacheTokenRequest is the body sent to the server to cache an exchanged token.
type CacheTokenRequest struct {
	AuthType        string                 `json:"authType"`
	AuthConfig      map[string]interface{} `json:"authConfig"`
	TokenType       string                 `json:"tokenType"`
	TokenValue      string                 `json:"tokenValue"`
	DatasourceId    string                 `json:"datasourceId,omitempty"`
	ConfigurationId string                 `json:"configurationId,omitempty"`
	ExpiresAt       string                 `json:"expiresAt,omitempty"`
}

// FetchTokenRequest is the body sent to the server to look up a cached token.
type FetchTokenRequest struct {
	AuthType                string                 `json:"authType"`
	AuthConfig              map[string]interface{} `json:"authConfig"`
	TokenType               string                 `json:"tokenType"`
	EagerRefreshThresholdMs int64                  `json:"eagerRefreshThresholdMs"`
	DatasourceId            string                 `json:"datasourceId,omitempty"`
	ConfigurationId         string                 `json:"configurationId,omitempty"`
}

type FetchTokenResponse struct {
	Data string `json:"data"`
}

// InvalidateTokenRequest is the body sent to the server to evict a cached
// token. The server derives the auth id from these fields.
type InvalidateTokenRequest struct {
	AuthType        string                 `json:"authType"`
	AuthConfig      map[string]interface{} `json:"authConfig"`
	TokenType       string                 `json:"tokenType,omitempty"`
	DatasourceId    string                 `json:"datasourceId,omitempty"`
	ConfigurationId string                 `json:"configurationId,omitempty"`
}

type TokenPayload struct {
	Token        string
	IdToken      string
	UserId       string
	TokenDecoded *structpb.Struct
	BindingName  string
}
