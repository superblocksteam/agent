package jwt

import (
	"errors"

	"github.com/golang-jwt/jwt/v4"
)

type UserType string

const (
	UserTypeSuperblocks UserType = "SUPERBLOCKS"
	UserTypeExternal    UserType = "EXTERNAL"
)

type TokenScopes string

const (
	TokenScopesBuildApplication TokenScopes = "build:app"
	TokenScopesViewApplication  TokenScopes = "view:app"
	TokenScopesEditApplication  TokenScopes = "edit:app"
)

func (s TokenScopes) String() string {
	return string(s)
}

type ScopedTokenClaims interface {
	GetScope() TokenScopes
	Valid() error
}

type ScopedTokenBaseClaims struct {
	jwt.RegisteredClaims

	Scope TokenScopes `json:"scope"`
}

func (c ScopedTokenBaseClaims) GetScope() TokenScopes {
	return c.Scope
}

type BuildScopedClaims struct {
	ScopedTokenBaseClaims

	ApplicationId  string `json:"app_id"`
	OrganizationId string `json:"org_id"`
	DirectoryHash  string `json:"dir_hash"`
	CommitId       string `json:"commit_id"`
}

func (c BuildScopedClaims) Valid() error {
	if c.Scope != TokenScopesBuildApplication {
		return errors.New("invalid scope")
	}

	return c.RegisteredClaims.Valid()
}

type ViewScopedClaims struct {
	ScopedTokenBaseClaims

	ApplicationId  string   `json:"app_id"`
	OrganizationId string   `json:"org_id"`
	DirectoryHash  string   `json:"dir_hash"`
	CommitId       string   `json:"commit_id"`
	UserEmail      string   `json:"user_email,omitempty"`
	UserType       UserType `json:"user_type,omitempty"`
	Name           string   `json:"name,omitempty"`
}

func (c ViewScopedClaims) Valid() error {
	if c.Scope != TokenScopesViewApplication {
		return errors.New("invalid scope")
	}

	return c.RegisteredClaims.Valid()
}

type EditScopedClaims struct {
	ScopedTokenBaseClaims

	ApplicationId  string   `json:"app_id"`
	OrganizationId string   `json:"org_id"`
	UserEmail      string   `json:"user_email"`
	UserType       UserType `json:"user_type"`
	Name           string   `json:"name"`
}

func (c EditScopedClaims) Valid() error {
	if c.GetScope() != TokenScopesEditApplication {
		return errors.New("invalid scope")
	}

	return c.RegisteredClaims.Valid()
}
