package auth

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/superblocksteam/agent/internal/auth/oauth"
	authtypes "github.com/superblocksteam/agent/internal/auth/types"
	"github.com/superblocksteam/agent/pkg/constants"
	sberrors "github.com/superblocksteam/agent/pkg/errors"
	"github.com/superblocksteam/agent/pkg/jsonutils"
	"github.com/superblocksteam/agent/pkg/observability"
	pluginscommon "github.com/superblocksteam/agent/types/gen/go/plugins/common/v1"
	"go.uber.org/zap"
	"google.golang.org/grpc/metadata"
	"google.golang.org/protobuf/types/known/structpb"
)

// https://github.com/superblocksteam/superblocks/blob/cc5e43b49acd26537704bc113d2f53fbbb167f29/packages/shared/src/types/datasource/auth.ts#L68C1-L78
const (
	authTypeOauthClientCreds   = "oauth-client-cred"
	authTypeOauthPassword      = "oauth-pword"
	AuthTypeOauthCode          = "oauth-code"
	authTypeOauthImplicit      = "oauth-implicit"
	authTypeOauthTokenExchange = "oauth-token-exchange"
	authTypeBasic              = "basic"
	authTypeBearer             = "bearer"
	authTypeTokenPrefixed      = "token-prefixed"
	authTypeApiKey             = "api-key"
	authTypeApiKeyForm         = "api-key-form"
	authTypeFirebase           = "Firebase"

	apiKeyMethodHeader     = "header"
	apiKeyMethodQueryParam = "query-param"

	bearerHeaderPrefix = "Bearer "
	basicHeaderPrefix  = "Basic "
	// This is the default prefix for the token-prefixed auth type used
	// when no prefix is specified.
	tokenPrefixedHeaderPrefix = bearerHeaderPrefix

	authorizationHeaderKey = "Authorization"
	RedactedSecret         = "<redacted>"

	// This is the proto defined auth method names, those are defined as oneof
	authTypePasswordGrantFlow = "passwordGrantFlow"

	idpAccessTokenClaimKey = "federated_token"
)

var (
	supportedApiTypesIdpTokenForwarding = map[string]bool{
		// Unknown is supported because it implies that the token forwarding is occurring outside of an execution
		// request (i.e. a metadata request or test connection request)
		constants.ApiTypeUnknown: true,
		constants.ApiTypeApi:     true,
	}
)

func normalizeAuthType(s string) string {
	switch s {
	case "oauthTokenExchange":
		// salesforce integration will send this because it's proto based and proto does not support hyphens
		return authTypeOauthTokenExchange
	default:
		return s
	}
}

// AddTokenIfNeeded adds the token to the datasource config if needed,
// and returns the token and type
// Values are pulled from cookies, datasource config, or generated dynamically (oauth)
// Port of https://github.com/superblocksteam/controller/blob/71e85382d693c67970e1b74b5130a6693ca3c05d/packages/server/src/utils/auth.ts#L76-L159
// AuthConfig defined in proto should eventually replace the need to pass datasourceConfig and redactedDatasourceConfig
func (t *tokenManager) AddTokenIfNeeded(
	ctx context.Context,
	datasourceConfig *structpb.Struct,
	redactedDatasourceConfig *structpb.Struct,
	authConfigNew *pluginscommon.Auth,
	datasourceId string,
	configurationId string,
	pluginId string,
) (
	tokenPayload authtypes.TokenPayload,
	err error,
) {
	if t == nil {
		return
	}

	log := observability.ZapLogger(ctx, t.logger).Named("AddTokenIfNeeded")

	if datasourceConfig == nil || datasourceConfig.Fields == nil {
		return
	}

	cookies := GetCookies(ctx)
	authType := getAuthTypeFromDatasourceConfiguration(log, datasourceConfig)
	authConfig := datasourceConfig.Fields["authConfig"].GetStructValue()
	log = log.With(zap.String("authType", authType))

	if authConfig == nil {
		// this code is very tricky and we're not exactly certain how we get into this branch, but
		// the code after appears to depend on this being non-nil to populate the tokenPayload
		authConfig, err = structpb.NewStruct(map[string]any{})
		if err != nil {
			return
		}
	}

	// (1/2) handle proto defined pluginAuth
	if authConfigNew != nil {
		switch authConfigNew.Method.(type) {
		case *pluginscommon.Auth_ClientCredentialsFlow:
			authConfigWrapper := &authtypes.AuthConfigWrapper{AuthConfigNew: authConfigNew}
			tokenPayload.Token, err = t.getOauthClientCredsToken(ctx, authConfigWrapper)
			if err != nil {
				return
			}
			authConfig.Fields["authToken"] = structpb.NewStringValue(tokenPayload.Token)

			tokenPayload.BindingName = "oauth"
			return
		case *pluginscommon.Auth_PasswordGrantFlow:
			authConfigWrapper := &authtypes.AuthConfigWrapper{AuthConfigNew: authConfigNew}
			// Currently proto plugin auth passwordGrantFlow assumes username & password are fixed/shared
			tokenPayload.Token, err = t.getOauthPasswordToken(ctx, authTypePasswordGrantFlow, authConfigWrapper, datasourceId, configurationId)
			if err != nil {
				return
			}
			authConfig.Fields["authToken"] = structpb.NewStringValue(tokenPayload.Token)

			tokenPayload.BindingName = "oauth"
			return
		}
	}

	// (2/2) handle type script shared package defined datasource auth
	log.Debug("[start] AddTokenIfNeeded", zap.String("datasourceId", datasourceId), zap.String("pluginId", pluginId), zap.String("authType", authType))

	var cookieName string

	authId, authIdExtra := GetAuthId(authType, authConfig, datasourceId)

	switch normalizeAuthType(authType) {
	case authTypeOauthClientCreds:
		tokenPayload.Token, cookieName = FirstMatchingCookie(cookies, authId+"-token", authIdExtra+"-token")

		authConfigWrapper := &authtypes.AuthConfigWrapper{AuthConfigOld: authConfig}
		if tokenPayload.Token == "" {
			tokenPayload.Token, err = t.getOauthClientCredsToken(ctx, authConfigWrapper)
			if err != nil {
				return
			}
		}

		tokenPayload.BindingName = "oauth"
	case authTypeOauthPassword:
		tokenPayload.Token, cookieName = FirstMatchingCookie(cookies, authId+"-token", "")

		authConfigWrapper := &authtypes.AuthConfigWrapper{AuthConfigOld: authConfig}
		if tokenPayload.Token == "" && authConfig.Fields["useFixedPasswordCreds"].GetBoolValue() {
			tokenPayload.Token, err = t.getOauthPasswordToken(ctx, authType, authConfigWrapper, datasourceId, configurationId)
			if err != nil {
				return
			}
		}

		tokenPayload.BindingName = "oauth"
	case AuthTypeOauthCode:
		// try to get access and id token from cookies to avoid making a request to the oauth server
		tokenPayload.Token, cookieName = FirstMatchingCookie(cookies, authId+"-"+oauth.TokenTypeAccess, authIdExtra+"-"+oauth.TokenTypeAccess)
		tokenPayload.IdToken, _ = FirstMatchingCookie(cookies, authId+"-"+oauth.TokenTypeId, authIdExtra+"-"+oauth.TokenTypeId)

		if tokenPayload.Token == "" {
			// if access token is not found, try to get refresh and id tokens from cookies
			tokenPayload.Token, tokenPayload.IdToken, err = t.getOauthCodeToken(ctx, authType, authConfig, datasourceId, configurationId, pluginId)
			if err != nil {
				return
			}
			authConfig.Fields["authToken"] = structpb.NewStringValue(tokenPayload.Token)
			authConfig.Fields["idToken"] = structpb.NewStringValue(tokenPayload.IdToken)

			{
				decodedToken, err := t.decodeJwt(tokenPayload.IdToken)
				if err == nil {
					tokenPayload.TokenDecoded = decodedToken
					// We might also want to call this tokenClaims instead of tokenDecoded
					authConfig.Fields["tokenDecoded"] = structpb.NewStructValue(decodedToken)
				} else {
					log.Warn("error decoding id token", zap.Error(err))
				}
			}
		}

		tokenPayload.BindingName = "oauth"
	case authTypeOauthTokenExchange:
		tokenPayload.Token, err = t.exchangeOauthTokenForToken(ctx, authType, authConfig, datasourceId, configurationId, pluginId)
		if err != nil {
			log.Error("error getting oauth on behalf of exchange token", zap.Error(err))
			return
		}

		// this will set the token at datasourceConfiguration['authConfig']['authToken']
		authConfig.Fields["authToken"] = structpb.NewStringValue(tokenPayload.Token)
		tokenPayload.BindingName = "oauth"
	case authTypeOauthImplicit:
		tokenPayload.Token, cookieName = FirstMatchingCookie(cookies, authId+"-token", authIdExtra+"-token")
		tokenPayload.BindingName = "oauth"
	case authTypeFirebase:
		tokenPayload.Token, cookieName = FirstMatchingCookie(cookies, authId+"-token", "")
		tokenPayload.UserId, _ = FirstMatchingCookie(cookies, authId+"-userId", "")

		tokenPayload.BindingName = "firebase"
	case authTypeBasic:
		if authConfig.Fields["shareBasicAuthCreds"].GetBoolValue() {
			username := strings.TrimSpace(authConfig.Fields["username"].GetStringValue())
			password := strings.TrimSpace(authConfig.Fields["password"].GetStringValue())

			// If the username or password is a mustache template, strip the mustache tags, and
			// just pass the expression directly to the base64 encoding function
			//
			// If the username or password is not a mustache template, attempt to marshal it to JSON
			// to ensure it's treated as a string in the token template.
			if strings.HasPrefix(username, "{{") && strings.HasSuffix(username, "}}") {
				username = username[2 : len(username)-2]
			} else {
				username = t.marshalInputToJSONString(ctx, username)
			}

			if strings.HasPrefix(password, "{{") && strings.HasSuffix(password, "}}") {
				password = password[2 : len(password)-2]
			} else {
				password = t.marshalInputToJSONString(ctx, password)
			}

			tokenPayload.Token = fmt.Sprintf("{{ btoa(`${%s}:${%s}`) }}", username, password)
		} else {
			tokenPayload.Token, cookieName = FirstMatchingCookie(cookies, authId+"-token", "")
		}

		if tokenPayload.Token != "" {
			t.addHeader(ctx, datasourceConfig, authorizationHeaderKey, fmt.Sprintf("%s%s", basicHeaderPrefix, tokenPayload.Token))
			t.addHeader(ctx, redactedDatasourceConfig, authorizationHeaderKey, fmt.Sprintf("%s%s", basicHeaderPrefix, RedactedSecret))
		}
	case authTypeBearer:
		tokenPayload.Token = authConfig.Fields["bearerToken"].GetStringValue()
		if tokenPayload.Token != "" {
			t.addHeader(ctx, datasourceConfig, authorizationHeaderKey, fmt.Sprintf("%s%s", bearerHeaderPrefix, tokenPayload.Token))
			t.addHeader(ctx, redactedDatasourceConfig, authorizationHeaderKey, fmt.Sprintf("%s%s", bearerHeaderPrefix, RedactedSecret))
		}
	case authTypeTokenPrefixed:
		tokenPayload.Token = authConfig.Fields["token"].GetStringValue()

		if tokenPayload.Token != "" {
			prefix := authConfig.Fields["prefix"].GetStringValue()

			// if prefix is empty/unset, set it to the default prefix for the token prefixed auth type
			if prefix == "" {
				prefix = tokenPrefixedHeaderPrefix
			}

			// if token starts with the prefix, set prefix to empty string
			if strings.HasPrefix(tokenPayload.Token, prefix) {
				prefix = ""
			}

			t.addHeader(ctx, datasourceConfig, authorizationHeaderKey, fmt.Sprintf("%s%s", prefix, tokenPayload.Token))
			t.addHeader(ctx, redactedDatasourceConfig, authorizationHeaderKey, fmt.Sprintf("%s%s", prefix, RedactedSecret))
		}
	case authTypeApiKey:
		keyName := authConfig.Fields["key"].GetStringValue()
		tokenPayload.Token = authConfig.Fields["value"].GetStringValue()
		method := authConfig.Fields["method"].GetStringValue()

		if method == apiKeyMethodQueryParam {
			t.addParam(ctx, datasourceConfig, keyName, tokenPayload.Token)
			t.addParam(ctx, redactedDatasourceConfig, keyName, RedactedSecret)
			// Method can be header or query params, If method is not set, default to header
		} else {
			t.addHeader(ctx, datasourceConfig, keyName, tokenPayload.Token)
			t.addHeader(ctx, redactedDatasourceConfig, keyName, RedactedSecret)
		}
	case authTypeApiKeyForm:
		apiKeys := authConfig.Fields["apiKeys"].GetStructValue()
		method := authConfig.Fields["method"].GetStringValue()

		for _, apiKeyValue := range apiKeys.Fields {
			apiKey := apiKeyValue.GetStructValue()
			keyName := apiKey.Fields["header"].GetStringValue()
			token := apiKey.Fields["token"].GetStringValue()
			prefix := apiKey.Fields["prefix"].GetStringValue()
			token = prefix + token

			if method == apiKeyMethodQueryParam {
				t.addParam(ctx, datasourceConfig, keyName, token)
				t.addParam(ctx, redactedDatasourceConfig, keyName, RedactedSecret)
				// Method can be header or query params, If method is not set, default to header
			} else {
				t.addHeader(ctx, datasourceConfig, keyName, token)
				t.addHeader(ctx, redactedDatasourceConfig, keyName, RedactedSecret)
			}
		}

	}

	log.Debug("[end] AddTokenIfNeeded", zap.String("datasourceId", datasourceId), zap.String("pluginId", pluginId), zap.String("authType", authType), zap.String("cookieName", cookieName), zap.String("userId", tokenPayload.UserId), zap.String("bindingName", tokenPayload.BindingName), zap.Bool("has_token", tokenPayload.Token != ""), zap.Bool("has_id_token", tokenPayload.IdToken != ""))

	return
}

func getAuthTypeFromDatasourceConfiguration(log *zap.Logger, datasourceConfig *structpb.Struct) string {
	// NOTE: (joeyagreco) authType is used to communicate the type of authentication an integration wants to use.
	// this information is used by:
	//	1. the javascript worker (where the integration logic lives)
	//	2. the template system (think the integration ui)
	//	3. the agent (specifically, here)
	// some integrations need to use this flow here in the agent to enable oauth as a valid authentication type,
	// but already use a different key in their datasource configuration to denote the type of authentication to use.
	// any integration using "authType" as a top level key in its datasource configuration is communicating in the 3 places listed above WHAT TYPE OF AUTH THE INTEGRATION IS CONFIGURED TO USE
	// some integrations are already configured for #1 and #2 with a key that is NOT "authType"
	// for these cases, we do not have any (good or safe) way to make the templating system migrate and use "authType" as a top level field for denoting the type of authentication to use.
	// because of this, here we allow integrations to give us a top level field "authTypeField" which can point to the EXISTING field that denotes the authentication type for an integration.

	authType := datasourceConfig.Fields["authType"].GetStringValue()
	authTypeField := datasourceConfig.Fields["authTypeField"].GetStringValue()
	if authTypeField != "" {
		authType = datasourceConfig.Fields[authTypeField].GetStringValue()
		// we don't expect to get an "authTypeField" and there to be nothing at that field
		// let's at least log a warning
		if authType == "" {
			log.Warn("could not find authTypeField in datasourceConfiguration", zap.String("authTypeField", authTypeField))
		}
	}
	return authType
}

func FirstMatchingCookie(cookies []*http.Cookie, key string, fallback string) (string, string) {
	// Note(Mark): Unlike RFC6265 & Express, GO does not automatically decode cookies.
	// Cookies are stored encoded after they come back from our express /login endpoint.
	unescapeOrValue := func(value string) string {
		decoded, err := url.QueryUnescape(value)
		if err != nil {
			return value
		}
		return decoded
	}

	var firstMatch, secondMatch string

	for _, cookie := range cookies {
		if cookie.Name == key {
			firstMatch = cookie.Value
		} else if cookie.Name == fallback {
			secondMatch = cookie.Value
		}
	}

	if firstMatch != "" {
		return unescapeOrValue(firstMatch), key
	} else if secondMatch != "" {
		return unescapeOrValue(secondMatch), fallback
	}

	return "", ""
}

func (t *tokenManager) getOauthClientCredsToken(ctx context.Context, authConfig *authtypes.AuthConfigWrapper) (string, error) {
	log := observability.ZapLogger(ctx, t.logger)

	var clientCreds *pluginscommon.OAuth_ClientCredentialsFlow
	var err error

	if authConfig.AuthConfigOld != nil {
		clientCreds = &pluginscommon.OAuth_ClientCredentialsFlow{}
		err := jsonutils.MapToProto(authConfig.AuthConfigOld.AsMap(), clientCreds)
		if err != nil {
			log.Error("error converting auth config to proto", zap.Error(err))
			return "", err
		}
	} else if authConfig.AuthConfigNew != nil {
		clientCreds = authConfig.AuthConfigNew.GetClientCredentialsFlow()
		if clientCreds == nil {
			log.Error("error converting new auth config to proto", zap.Error(err))
			return "", err
		}
	} else {
		log.Error("Invalid auth config", zap.Error(err))
		return "", err
	}

	token, err := t.OAuthClient.GetClientCredsToken(clientCreds)
	if err != nil {
		log.Error("error getting oauth client credentials token", zap.Error(err))
		return "", err
	}

	return token, nil
}

// authConfig might contain old config or new config, but we map either to the same type here
// so rest of the flow don't need to worry about old vs new auth config
func (t *tokenManager) getOauthPasswordToken(ctx context.Context, authType string, authConfig *authtypes.AuthConfigWrapper, datasourceId string, configurationId string) (string, error) {
	log := observability.ZapLogger(ctx, t.logger)

	var passwordGrantFlow *pluginscommon.OAuth_PasswordGrantFlow
	var err error

	if authConfig.AuthConfigOld != nil {
		passwordGrantFlow = &pluginscommon.OAuth_PasswordGrantFlow{}
		err := jsonutils.MapToProto(authConfig.AuthConfigOld.AsMap(), passwordGrantFlow)
		if err != nil {
			log.Error("error converting auth config to proto", zap.Error(err))
			return "", err
		}
	} else if authConfig.AuthConfigNew != nil {
		passwordGrantFlow = authConfig.AuthConfigNew.GetPasswordGrantFlow()
		if passwordGrantFlow == nil {
			log.Error("error converting new auth config to proto", zap.Error(err))
			return "", err
		}
	} else {
		log.Error("Invalid auth config", zap.Error(err))
		return "", err
	}

	token, err := t.OAuthClient.GetPasswordToken(authType, passwordGrantFlow, datasourceId, configurationId)
	if err != nil {
		log.Error("error getting oauth password token", zap.Error(err))
		return "", err
	}

	return token, nil
}

// Returns the cached OAuth token if there is one.
// Will not return a cached token if we should not be using a cached token based on the inputs.
func (t *tokenManager) getCachedOauthToken(ctx context.Context, authType string, authConfigProto *pluginscommon.OAuth_AuthorizationCodeFlow, datasourceId string, configurationId string, pluginId string, log *zap.Logger) string {
	// don't use a cached token if we are doing a "Test Connection"
	if eventType := constants.EventType(ctx); eventType == constants.EventTypeTest {
		return ""
	}

	// get exchanged token from cache if previously exchanged
	if cachedToken, _, err := t.OAuthCodeTokenFetcher.Fetch(ctx, authType, authConfigProto, datasourceId, configurationId, pluginId); err == nil {
		log.Info("using cached token from previous exchange")
		return cachedToken
	}

	return ""
}

func (t *tokenManager) exchangeOauthTokenForToken(ctx context.Context, authType string, authConfig *structpb.Struct, datasourceId string, configurationId string, pluginId string) (string, error) {
	log := observability.ZapLogger(ctx, t.logger).With(zap.String("datasourceId", datasourceId), zap.String("pluginId", pluginId))

	log.Info("exchangeOauthTokenForToken")
	authConfigProto := &pluginscommon.OAuth_AuthorizationCodeFlow{}
	err := jsonutils.MapToProto(authConfig.AsMap(), authConfigProto)
	if err != nil {
		log.Error("error converting auth config to proto", zap.Error(err))
		return "", &sberrors.InternalError{Err: err}
	}

	log = log.With(zap.String("subjectTokenSource", authConfigProto.GetSubjectTokenSource().String()))

	if cachedToken := t.getCachedOauthToken(ctx, authType, authConfigProto, datasourceId, configurationId, pluginId, log); cachedToken != "" {
		return cachedToken, nil
	}

	var subjectToken string
	switch authConfigProto.GetSubjectTokenSource() {
	case pluginscommon.OAuth_AuthorizationCodeFlow_SUBJECT_TOKEN_SOURCE_LOGIN_IDENTITY_PROVIDER:
		if apiType := constants.ApiType(ctx); !supportedApiTypesIdpTokenForwarding[apiType] {
			log.Error("identity provider token forwarding is not supported for the api type", zap.String("apiType", apiType))
			return "", sberrors.IntegrationOAuthError(oauth.ErrNoAuthorizationJwtFound)
		}

		subjectToken, err = t.getIdentityProviderAccessToken(ctx)
		if err != nil {
			log.Error("error getting identity provider access token", zap.Error(err))
			return "", err
		}
	case pluginscommon.OAuth_AuthorizationCodeFlow_SUBJECT_TOKEN_SOURCE_STATIC_TOKEN:
		subjectToken = authConfigProto.GetSubjectTokenSourceStaticToken()
	default:
		log.Error("invalid subject token source")
		return "", sberrors.IntegrationOAuthError(oauth.ErrInvalidSubjectTokenSource)
	}

	// validate subject token if feature flag is enabled
	if t.flags.GetValidateSubjectTokenDuringOboFlowEnabled(constants.OrganizationID(ctx)) {
		if valid, err := t.isValidJwt(subjectToken, authConfigProto.GetSubjectTokenSource(), log); !valid {
			return "", err
		}
	}

	// Attempt token exchange using token from identity provider
	exchangedToken, err := t.OAuthClient.ExchangeOAuthTokenOnBehalfOf(ctx, authConfigProto, subjectToken, datasourceId, configurationId)
	if err != nil {
		log.Error("error exchanging identity provider access token for token", zap.Error(err))
		return "", err
	}

	return exchangedToken, nil
}

func (t *tokenManager) getOauthCodeToken(ctx context.Context, authType string, authConfig *structpb.Struct, datasourceId string, configurationId string, pluginId string) (string, string, error) {
	log := observability.ZapLogger(ctx, t.logger)

	log.Info("getOauthCodeToken", zap.String("datasourceId", datasourceId), zap.String("pluginId", pluginId))
	authConfigProto := &pluginscommon.OAuth_AuthorizationCodeFlow{}
	if err := jsonutils.MapToProto(authConfig.AsMap(), authConfigProto); err != nil {
		log.Error("error converting auth config to proto", zap.Error(err))
		return "", "", err
	}

	token, idToken, err := t.OAuthCodeTokenFetcher.Fetch(ctx, authType, authConfigProto, datasourceId, configurationId, pluginId)
	if err != nil {
		log.Error("error getting oauth code token", zap.Error(err))
		return "", "", err
	}

	return token, idToken, nil
}

func (t *tokenManager) addHeader(ctx context.Context, datasourceConfig *structpb.Struct, key string, val string) {
	log := observability.ZapLogger(ctx, t.logger)

	if val == "" || datasourceConfig == nil {
		return
	}

	var headers *structpb.ListValue
	log.Debug("[AddTokenIfNeeded] addHeader", zap.String("key", key))

	if datasourceConfig.Fields["headers"] == nil {
		datasourceConfig.Fields["headers"] = structpb.NewListValue(&structpb.ListValue{})
		headers = datasourceConfig.Fields["headers"].GetListValue()
	} else {
		headers = datasourceConfig.Fields["headers"].GetListValue()
	}

	headers.Values = append(headers.Values, &structpb.Value{
		Kind: &structpb.Value_StructValue{
			StructValue: &structpb.Struct{
				Fields: map[string]*structpb.Value{
					"key":   structpb.NewStringValue(key),
					"value": structpb.NewStringValue(val),
				},
			},
		},
	})
}

func (t *tokenManager) addParam(ctx context.Context, datasourceConfig *structpb.Struct, key string, val string) {
	log := observability.ZapLogger(ctx, t.logger)

	if val == "" || datasourceConfig == nil {
		return
	}

	var params *structpb.ListValue
	log.Debug("[AddTokenIfNeeded] addParam", zap.String("key", key))

	if datasourceConfig.Fields["params"] == nil {
		datasourceConfig.Fields["params"] = structpb.NewListValue(&structpb.ListValue{})
		params = datasourceConfig.Fields["params"].GetListValue()
	} else {
		params = datasourceConfig.Fields["params"].GetListValue()
	}

	params.Values = append(params.Values, &structpb.Value{
		Kind: &structpb.Value_StructValue{
			StructValue: &structpb.Struct{
				Fields: map[string]*structpb.Value{
					"key":   structpb.NewStringValue(key),
					"value": structpb.NewStringValue(val),
				},
			},
		},
	})
}

func (t *tokenManager) decodeJwt(token string) (*structpb.Struct, error) {
	claims, err := getClaimsFromJwt(token)
	if err != nil {
		return nil, fmt.Errorf("failed to get JWT claims: %w", err)
	}

	result, err := structpb.NewStruct(map[string]interface{}(claims))
	if err != nil {
		return nil, fmt.Errorf("failed to convert claims to Struct: %w", err)
	}

	return result, nil
}

func (t *tokenManager) marshalInputToJSONString(ctx context.Context, input interface{}) string {
	log := observability.ZapLogger(ctx, t.logger)

	b, err := json.Marshal(input)
	if err != nil {
		log.Error("error marshalling input to json, falling back to wrapping in backticks", zap.Error(err))
		return fmt.Sprintf("`%v`", input)
	}
	return string(b)
}

func (t *tokenManager) getIdentityProviderAccessToken(ctx context.Context) (string, error) {
	var superblocksJwt string
	if md, ok := metadata.FromIncomingContext(ctx); ok {
		if jwt, ok := md[constants.HeaderSuperblocksJwt]; ok {
			superblocksJwt = jwt[0]
		}
	}
	// just need the jwt itself
	superblocksJwt = strings.TrimPrefix(superblocksJwt, "Bearer ")

	if superblocksJwt == "" {
		return "", sberrors.IntegrationOAuthError(oauth.ErrNoAuthorizationJwtFound)
	}

	claims, err := getClaimsFromJwt(superblocksJwt)
	if err != nil {
		return "", sberrors.IntegrationOAuthError(oauth.ErrNoIdentityProviderJwtFound)
	}

	// Extract identity provider JWT from claims
	idpAccessToken, ok := claims[idpAccessTokenClaimKey].(string)
	if !ok {
		return "", sberrors.IntegrationOAuthError(oauth.ErrNoIdentityProviderJwtFound)
	}

	return idpAccessToken, nil
}

func (t *tokenManager) isValidJwt(token string, tokenSource pluginscommon.OAuth_AuthorizationCodeFlow_SubjectTokenSource, log *zap.Logger) (bool, error) {
	if log == nil {
		log = t.logger
	}

	if claims, err := getClaimsFromJwt(token); err != nil {
		log.Error("subject token is not a valid JWT", zap.Error(err))
		return false, sberrors.IntegrationOAuthError(oauth.SubjectTokenErrorMap[tokenSource][oauth.OAuth2ErrorTypeInvalid])
	} else {
		if exp, ok := claims["exp"]; ok {
			expiry := int64(exp.(float64))
			if t.clock.Now().Unix() > expiry {
				log.Error("subject token is expired", zap.Int64("expiry", expiry))
				return false, sberrors.IntegrationOAuthError(oauth.SubjectTokenErrorMap[tokenSource][oauth.OAuth2ErrorTypeExpired])
			}
		}
	}

	return true, nil
}

func getClaimsFromJwt(token string) (jwt.MapClaims, error) {
	if token == "" {
		return nil, fmt.Errorf("empty token")
	}

	parsedToken, _, err := new(jwt.Parser).ParseUnverified(token, jwt.MapClaims{})
	if err != nil {
		return nil, fmt.Errorf("failed to parse JWT: %w", err)
	}

	return parsedToken.Claims.(jwt.MapClaims), nil
}

func GetCookies(ctx context.Context) []*http.Cookie {
	cookies := []*http.Cookie{}
	if metadata, ok := metadata.FromIncomingContext(ctx); ok {
		cookieHeader, ok := metadata["cookie"]
		if ok {
			httpHeader := http.Header{}
			httpHeader.Add("Cookie", cookieHeader[0])
			req := &http.Request{Header: httpHeader}
			cookies = req.Cookies()
		}
	}
	return cookies
}
