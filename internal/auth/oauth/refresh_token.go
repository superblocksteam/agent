package oauth

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"

	"github.com/superblocksteam/agent/internal/auth/types"
	v1 "github.com/superblocksteam/agent/types/gen/go/plugins/common/v1"
)

const (
	TokenUrlFirebase = "https://securetoken.googleapis.com/v1/token"
)

type RefreshTokenFirebasePayload struct {
	ApiKey       string
	ClientId     string
	ClientSecret string
	RefreshToken string
}

type RefreshTokenResponseFirebase struct {
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    string `json:"expires_in"`
	IdToken      string `json:"id_token"`
	UserID       string `json:"user_id"`
	ProjectID    string `json:"project_id"`
}

func (c *OAuthClient) RefreshToken(authConfig *v1.OAuthCommon, refreshToken string) (*types.Response, error) {
	tokenUrl := authConfig.TokenUrl
	clientId := authConfig.ClientId
	clientSecret := authConfig.ClientSecret

	data := url.Values{}
	data.Set("grant_type", "refresh_token")
	data.Set("client_id", clientId)
	data.Set("client_secret", clientSecret)
	data.Set("refresh_token", refreshToken)

	req, err := http.NewRequest("POST", tokenUrl, strings.NewReader(data.Encode()))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	res, err := c.HttpClient.Do(req)
	if err != nil {
		return nil, err
	}

	resBody, err := io.ReadAll(res.Body)
	if err != nil {
		return nil, err
	}

	if res.StatusCode >= 300 {
		return nil, fmt.Errorf("failed to refresh oauth token, status code %d: %s", res.StatusCode, string(resBody))
	}

	r := &types.Response{}
	json.Unmarshal(resBody, r)
	if err != nil {
		return nil, err
	}

	return r, nil
}

func (c *OAuthClient) RefreshTokenFirebase(req *RefreshTokenFirebasePayload) (*RefreshTokenResponseFirebase, error) {
	data := url.Values{}
	data.Set("grant_type", "refresh_token")
	data.Set("refresh_token", req.RefreshToken)

	httpReq, err := http.NewRequest("POST", TokenUrlFirebase, strings.NewReader(data.Encode()))
	if err != nil {
		return nil, err
	}

	httpReq.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	q := httpReq.URL.Query()
	q.Add("key", req.ApiKey)
	httpReq.URL.RawQuery = q.Encode()

	res, err := c.HttpClient.Do(httpReq)
	if err != nil {
		return nil, err
	}

	resBody, err := io.ReadAll(res.Body)
	if err != nil {
		return nil, err
	}

	if res.StatusCode >= 300 {
		return nil, fmt.Errorf("failed to refresh oauth token, status code %d: %s", res.StatusCode, string(resBody))
	}

	r := &RefreshTokenResponseFirebase{}
	json.Unmarshal(resBody, r)
	if err != nil {
		return nil, err
	}

	if r.ExpiresIn == "" {
		r.ExpiresIn = "0"
	}

	return r, nil
}
