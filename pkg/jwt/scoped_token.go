package jwt

import (
	"errors"
	"fmt"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/superblocksteam/agent/pkg/utils"
)

var (
	ErrInvalidScope = errors.New("invalid scope")
)

type UserType string

const (
	UserTypeSuperblocks UserType = "SUPERBLOCKS"
	UserTypeExternal    UserType = "EXTERNAL"
)

type TokenScopes string

const (
	TokenScopesBuildApplication TokenScopes = "apps:build"
	TokenScopesViewApplication  TokenScopes = "apps:view"
	TokenScopesEditApplication  TokenScopes = "apps:update"
)

func (s TokenScopes) String() string {
	return string(s)
}

type ScopedTokenClaims interface {
	jwt.Claims

	GetRawScopes() TokenScopes
	GetScopes() *utils.Set[TokenScopes]
}

type scopedTokenBaseClaims struct {
	jwt.RegisteredClaims

	Scopes TokenScopes `json:"scope"`
}

func (c *scopedTokenBaseClaims) GetRawScopes() TokenScopes {
	return c.Scopes
}

func (c *scopedTokenBaseClaims) GetScopes() *utils.Set[TokenScopes] {
	scopeSet := utils.NewSet[TokenScopes]()
	scopes := strings.Split(c.Scopes.String(), " ")
	for _, scope := range scopes {
		scopeSet.Add(TokenScopes(scope))
	}

	return scopeSet
}

type AllScopedClaims struct {
	scopedTokenBaseClaims

	ApplicationId  string   `json:"app_id"`
	OrganizationId string   `json:"org_id"`
	DirectoryHash  string   `json:"dir_hash"`
	CommitId       string   `json:"commit_id"`
	UserEmail      string   `json:"user_email,omitempty"`
	UserType       UserType `json:"user_type,omitempty"`
	Name           string   `json:"name,omitempty"`
}

func NewAllScopedClaims(opts ...Option) *AllScopedClaims {
	o := NewOptions(opts...)

	return &AllScopedClaims{
		scopedTokenBaseClaims: scopedTokenBaseClaims{
			RegisteredClaims: o.RegisteredClaims,
			Scopes:           o.Scopes,
		},
		ApplicationId:  o.ApplicationId,
		OrganizationId: o.OrganizationId,
		DirectoryHash:  o.DirectoryHash,
		CommitId:       o.CommitId,
		UserEmail:      o.UserEmail,
		UserType:       o.UserType,
		Name:           o.Name,
	}
}

func (c *AllScopedClaims) AsBuildScopedClaims() *BuildScopedClaims {
	if !c.GetScopes().Contains(TokenScopesBuildApplication) {
		return nil
	}

	return &BuildScopedClaims{
		scopedTokenBaseClaims: scopedTokenBaseClaims{
			RegisteredClaims: c.RegisteredClaims,
			Scopes:           TokenScopesBuildApplication,
		},
		ApplicationId:  c.ApplicationId,
		OrganizationId: c.OrganizationId,
		DirectoryHash:  c.DirectoryHash,
		CommitId:       c.CommitId,
	}
}

func (c *AllScopedClaims) AsViewScopedClaims() *ViewScopedClaims {
	if !c.GetScopes().Contains(TokenScopesViewApplication) {
		return nil
	}

	return &ViewScopedClaims{
		scopedTokenBaseClaims: scopedTokenBaseClaims{
			RegisteredClaims: c.RegisteredClaims,
			Scopes:           TokenScopesViewApplication,
		},
		ApplicationId:  c.ApplicationId,
		OrganizationId: c.OrganizationId,
		DirectoryHash:  c.DirectoryHash,
		CommitId:       c.CommitId,
		UserEmail:      c.UserEmail,
		UserType:       c.UserType,
		Name:           c.Name,
	}
}

func (c *AllScopedClaims) AsEditScopedClaims() *EditScopedClaims {
	if !c.GetScopes().Contains(TokenScopesEditApplication) {
		return nil
	}

	return &EditScopedClaims{
		scopedTokenBaseClaims: scopedTokenBaseClaims{
			RegisteredClaims: c.RegisteredClaims,
			Scopes:           TokenScopesEditApplication,
		},
		ApplicationId:  c.ApplicationId,
		OrganizationId: c.OrganizationId,
		UserEmail:      c.UserEmail,
		UserType:       c.UserType,
		Name:           c.Name,
	}
}

func (c *AllScopedClaims) GetRawScopes() TokenScopes {
	if c == nil {
		return ""
	}

	return c.scopedTokenBaseClaims.GetRawScopes()
}

func (c *AllScopedClaims) GetScopes() *utils.Set[TokenScopes] {
	if c == nil {
		return nil
	}

	return c.scopedTokenBaseClaims.GetScopes()
}

func (c *AllScopedClaims) Validate() error {
	scopes := c.GetScopes()
	if scopes.IsEmpty() {
		return ErrInvalidScope
	}

	for _, scope := range scopes.ToSlice() {
		switch scope {
		case TokenScopesBuildApplication:
			if err := c.AsBuildScopedClaims().Validate(); err != nil {
				return err
			}
		case TokenScopesViewApplication:
			if err := c.AsViewScopedClaims().Validate(); err != nil {
				return err
			}
		case TokenScopesEditApplication:
			if err := c.AsEditScopedClaims().Validate(); err != nil {
				return err
			}
		default:
			return fmt.Errorf("%w: %s", ErrInvalidScope, scope)
		}
	}

	return nil
}

type BuildScopedClaims struct {
	scopedTokenBaseClaims

	ApplicationId  string `json:"app_id"`
	OrganizationId string `json:"org_id"`
	DirectoryHash  string `json:"dir_hash"`
	CommitId       string `json:"commit_id"`
}

func NewBuildScopedClaims(opts ...Option) *BuildScopedClaims {
	o := NewOptions(opts...)

	return &BuildScopedClaims{
		scopedTokenBaseClaims: scopedTokenBaseClaims{
			RegisteredClaims: o.RegisteredClaims,
			Scopes:           TokenScopesBuildApplication,
		},
		ApplicationId:  o.ApplicationId,
		OrganizationId: o.OrganizationId,
		DirectoryHash:  o.DirectoryHash,
		CommitId:       o.CommitId,
	}
}

func (c *BuildScopedClaims) GetRawScopes() TokenScopes {
	if c == nil {
		return ""
	}

	return c.scopedTokenBaseClaims.GetRawScopes()
}

func (c *BuildScopedClaims) GetScopes() *utils.Set[TokenScopes] {
	if c == nil {
		return nil
	}

	return c.scopedTokenBaseClaims.GetScopes()
}

func (c *BuildScopedClaims) Validate() error {
	if !c.GetScopes().Contains(TokenScopesBuildApplication) {
		return ErrInvalidScope
	}

	return nil
}

type ViewScopedClaims struct {
	scopedTokenBaseClaims

	ApplicationId  string   `json:"app_id"`
	OrganizationId string   `json:"org_id"`
	DirectoryHash  string   `json:"dir_hash"`
	CommitId       string   `json:"commit_id"`
	UserEmail      string   `json:"user_email,omitempty"`
	UserType       UserType `json:"user_type,omitempty"`
	Name           string   `json:"name,omitempty"`
}

func NewViewScopedClaims(opts ...Option) *ViewScopedClaims {
	o := NewOptions(opts...)

	return &ViewScopedClaims{
		scopedTokenBaseClaims: scopedTokenBaseClaims{
			RegisteredClaims: o.RegisteredClaims,
			Scopes:           TokenScopesViewApplication,
		},
		ApplicationId:  o.ApplicationId,
		OrganizationId: o.OrganizationId,
		DirectoryHash:  o.DirectoryHash,
		CommitId:       o.CommitId,
		UserEmail:      o.UserEmail,
		UserType:       o.UserType,
		Name:           o.Name,
	}
}

func (c *ViewScopedClaims) GetRawScopes() TokenScopes {
	if c == nil {
		return ""
	}

	return c.scopedTokenBaseClaims.GetRawScopes()
}

func (c *ViewScopedClaims) GetScopes() *utils.Set[TokenScopes] {
	if c == nil {
		return nil
	}

	return c.scopedTokenBaseClaims.GetScopes()
}

func (c *ViewScopedClaims) Validate() error {
	if !c.GetScopes().Contains(TokenScopesViewApplication) {
		return ErrInvalidScope
	}

	return nil
}

type EditScopedClaims struct {
	scopedTokenBaseClaims

	ApplicationId  string   `json:"app_id"`
	OrganizationId string   `json:"org_id"`
	UserEmail      string   `json:"user_email"`
	UserType       UserType `json:"user_type"`
	Name           string   `json:"name"`
}

func NewEditScopedClaims(opts ...Option) *EditScopedClaims {
	o := NewOptions(opts...)

	return &EditScopedClaims{
		scopedTokenBaseClaims: scopedTokenBaseClaims{
			RegisteredClaims: o.RegisteredClaims,
			Scopes:           TokenScopesEditApplication,
		},
		ApplicationId:  o.ApplicationId,
		OrganizationId: o.OrganizationId,
		UserEmail:      o.UserEmail,
		UserType:       o.UserType,
		Name:           o.Name,
	}
}

func (c *EditScopedClaims) GetRawScopes() TokenScopes {
	if c == nil {
		return ""
	}

	return c.scopedTokenBaseClaims.GetRawScopes()
}

func (c *EditScopedClaims) GetScopes() *utils.Set[TokenScopes] {
	if c == nil {
		return nil
	}

	return c.scopedTokenBaseClaims.GetScopes()
}

func (c *EditScopedClaims) Validate() error {
	if !c.GetScopes().Contains(TokenScopesEditApplication) {
		return ErrInvalidScope
	}

	return nil
}
