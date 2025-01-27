package auth

import (
	"fmt"
	"sort"
	"strings"

	"github.com/titanous/json5"
	"google.golang.org/protobuf/types/known/structpb"
)

const (
	UnknownClient = "unknown-client"
)

// port of https://github.com/superblocksteam/superblocks/blob/5e7df87d391004656a7e7c2743f8f3ff91059833/packages/shared/src/types/datasource/auth.ts#L15-L17
// Returns the auth id, and a secondary auth id worth checking if applicable
func GetAuthId(authType string, authConfig *structpb.Struct, datasourceId string) (string, string) {
	if authType == "" || authConfig == nil {
		return UnknownClient, ""
	}

	var suffix string
	var suffix2 string

	switch authType {
	case authTypeBasic:
		suffix = datasourceId
	case authTypeOauthPassword:
		suffix = authConfig.GetFields()["clientId"].GetStringValue()
	case authTypeOauthClientCreds, AuthTypeOauthCode, authTypeOauthImplicit, authTypeOauthTokenExchange:
		apiId := authConfig.GetFields()["clientId"].GetStringValue()
		if apiId == "" {
			apiId = datasourceId
		}

		scope := authConfig.GetFields()["scope"].GetStringValue()
		scopeParts := strings.Split(scope, " ")
		sort.Strings(scopeParts)
		scope = strings.Join(scopeParts, " ")

		if scope != "" {
			scopeHash := insecureHash(scope)
			suffix = fmt.Sprintf("%s-%s", apiId, scopeHash)
		} else {
			suffix = apiId
			// TODO: Remove me once auth routes are ported to orchestrator, or if bug gets fixed
			// Really stupid, but controller sometimes appends "null" thinking that it's a scope hash
			// So we should check both in the cookies
			suffix2 = fmt.Sprintf("%s-%s", apiId, "null")
		}
	case authTypeFirebase:
		apiKey := authConfig.GetFields()["apiKey"].GetStringValue()
		if apiKey == "" {
			return UnknownClient, ""
		}

		parsed := map[string]string{}
		if err := json5.Unmarshal([]byte(apiKey), &parsed); err != nil {
			return "", ""
		}

		if s, ok := parsed["projectId"]; ok {
			suffix = s
		}
	default:
		suffix = "unknown-client"
	}

	if suffix2 == "" {
		suffix2 = suffix
	}

	authId1 := fmt.Sprintf("%s.%s", authType, suffix)
	authId2 := fmt.Sprintf("%s.%s", authType, suffix2)

	return authId1, authId2
}

// https://github.com/superblocksteam/superblocks/blob/5e7df87d391004656a7e7c2743f8f3ff91059833/packages/shared/src/types/datasource/auth.ts#L307-L321
// Chat gpt converted the code in the link to this!
func insecureHash(s string) string {
	if s == "" {
		return ""
	}

	var hash int32 = 0
	for _, char := range s {
		hash = (hash << 5) - hash + char
		hash = hash & hash
	}

	return fmt.Sprintf("%d", hash)
}
