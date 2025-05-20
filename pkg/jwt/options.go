package jwt

import (
	"github.com/golang-jwt/jwt/v5"
)

type options struct {
	RegisteredClaims jwt.RegisteredClaims
	Scopes           TokenScopes

	ApplicationId  string
	OrganizationId string
	DirectoryHash  string
	CommitId       string
	UserEmail      string
	UserType       UserType
	Name           string
}

type Option func(*options)

func JwtWithRegisteredClaims(registeredClaims jwt.RegisteredClaims) Option {
	return func(o *options) {
		o.RegisteredClaims = registeredClaims
	}
}

func JwtWithScopes(scopes TokenScopes) Option {
	return func(o *options) {
		o.Scopes = scopes
	}
}

func JwtWithApplicationId(applicationId string) Option {
	return func(o *options) {
		o.ApplicationId = applicationId
	}
}

func JwtWithOrganizationId(organizationId string) Option {
	return func(o *options) {
		o.OrganizationId = organizationId
	}
}

func JwtWithDirectoryHash(directoryHash string) Option {
	return func(o *options) {
		o.DirectoryHash = directoryHash
	}
}

func JwtWithCommitId(commitId string) Option {
	return func(o *options) {
		o.CommitId = commitId
	}
}

func JwtWithUserEmail(userEmail string) Option {
	return func(o *options) {
		o.UserEmail = userEmail
	}
}

func JwtWithUserType(userType UserType) Option {
	return func(o *options) {
		o.UserType = userType
	}
}

func JwtWithName(name string) Option {
	return func(o *options) {
		o.Name = name
	}
}

func NewOptions(opts ...Option) *options {
	o := &options{RegisteredClaims: jwt.RegisteredClaims{}}
	for _, opt := range opts {
		opt(o)
	}
	return o
}
