package transport

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/pkg/errors"
	"github.com/superblocksteam/agent/internal/auth"
	apictx "github.com/superblocksteam/agent/pkg/context"
	"github.com/superblocksteam/agent/pkg/engine"
	sberrors "github.com/superblocksteam/agent/pkg/errors"
	"github.com/superblocksteam/agent/pkg/executor"
	"github.com/superblocksteam/agent/pkg/jsonutils"
	"github.com/superblocksteam/agent/pkg/store/gc"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	commonv1 "github.com/superblocksteam/agent/types/gen/go/plugins/common/v1"
	"go.uber.org/zap"
	"golang.org/x/sync/errgroup"
	"google.golang.org/grpc"
	"google.golang.org/grpc/metadata"
	"google.golang.org/protobuf/types/known/emptypb"
	"google.golang.org/protobuf/types/known/structpb"
)

func (s *server) CheckAuth(ctx context.Context, req *apiv1.CheckAuthRequest) (*apiv1.CheckAuthResponse, error) {
	integration, err := s.Fetcher.FetchIntegration(ctx, req.IntegrationId, req.Profile)
	if err != nil {
		return nil, err
	}

	integrationConfig, err := structpb.NewValue(integration.Configuration)
	if err != nil {
		return nil, err
	}

	configurationId := ""
	if id, ok := integration.Configuration["id"]; ok {
		configurationId = id.(string)
	}

	checkAuthRes, err := s.TokenManager.CheckAuth(ctx, integrationConfig.GetStructValue(), req.IntegrationId, configurationId, integration.PluginId)
	if err != nil {
		return nil, err
	}

	if !checkAuthRes.Authenticated {
		return nil, sberrors.AuthorizationError(fmt.Errorf("no token found"))
	}

	headerMd := metadata.MD{}

	for _, c := range checkAuthRes.Cookies {
		s.Logger.Debug("CheckAuth",
			zap.Bool("authed", checkAuthRes.Authenticated),
			zap.String("integration_id", req.IntegrationId),
			zap.String("cookie_name", c.Name),
			zap.String("cookie_expires", c.Expires.String()),
		)
		cookie := &http.Cookie{
			Name:     c.Name,
			Value:    c.Value,
			Secure:   true,
			HttpOnly: true,
			SameSite: http.SameSiteNoneMode, // Need this set to deal with superblockshq -> superblocks
			Path:     "/",
			Expires:  c.Expires,
		}

		headerMd.Append("set-cookie", cookie.String())
	}

	if len(headerMd) > 0 {
		grpc.SendHeader(ctx, headerMd)
	}

	return &apiv1.CheckAuthResponse{Authenticated: checkAuthRes.Authenticated}, nil
}

func (s *server) Login(ctx context.Context, req *apiv1.LoginRequest) (*apiv1.LoginResponse, error) {
	integration, err := s.Fetcher.FetchIntegration(ctx, req.IntegrationId, req.Profile)
	if err != nil {
		return nil, err
	}

	integrationConfig, err := structpb.NewValue(integration.Configuration)
	if err != nil {
		return nil, err
	}

	cookies, hasAccessToken, err := s.TokenManager.Login(ctx, integrationConfig.GetStructValue(), req)
	if err != nil {
		return nil, err
	}

	headerMd := metadata.MD{}
	for _, cookie := range cookies {
		cookie.Secure = true
		cookie.HttpOnly = true
		cookie.SameSite = http.SameSiteNoneMode // Need this set to deal with superblockshq -> superblocks
		cookie.Path = "/"
		headerMd.Append("set-cookie", cookie.String())
	}
	if len(headerMd) > 0 {
		grpc.SendHeader(ctx, headerMd)
	}

	return &apiv1.LoginResponse{
		Success: hasAccessToken,
	}, nil
}

func (s *server) Logout(ctx context.Context, _ *emptypb.Empty) (*emptypb.Empty, error) {
	cookies := auth.GetCookies(ctx)
	headerMd := metadata.MD{}

	for _, cookie := range cookies {
		for _, suffix := range []string{"-token", "-refresh", "-userId"} {
			if strings.HasSuffix(cookie.Name, suffix) {
				cookie.Value = ""
				// These values must be equal to what they were set to when the cookie was created, otherwise
				// The browser will not delete the cookie
				cookie.Secure = true
				cookie.HttpOnly = true
				cookie.SameSite = http.SameSiteNoneMode // Need this set to deal with superblockshq -> superblocks
				cookie.Path = "/"
				cookie.Expires = time.Now().Add(-1 * time.Hour)
				headerMd.Append("set-cookie", cookie.String())
				break
			}
		}
	}

	err := s.Fetcher.DeleteSpecificUserTokens(ctx)
	if err != nil {
		return nil, err
	}

	if len(headerMd) > 0 {
		grpc.SendHeader(ctx, headerMd)
	}

	return &emptypb.Empty{}, nil
}

func (s *server) resolveBindings(
	ctx context.Context,
	fields []*string,
) error {
	var sbctx *apictx.Context
	var sandbox engine.Sandbox
	var garbage gc.GC
	var err error

	var fieldResolutionGroup errgroup.Group
	for _, field := range fields {
		if strings.HasPrefix(*field, "{{") && strings.HasSuffix(*field, "}}") {
			// avoid using unnecessary resources by creating sbctx every time
			if sbctx == nil || sandbox == nil || garbage == nil {
				sbctx, sandbox, garbage, err = s.getSbctx(ctx, s.Store, "", map[string]*structpb.Struct{})
				if sandbox != nil {
					defer sandbox.Close()
				}
				if garbage != nil {
					defer func() {
						if err := garbage.Run(context.Background()); err != nil {
							s.Logger.Error("could not run garbage collection", zap.Error(err))
						}
					}()
				}
				if err != nil {
					return err
				}
			}
			// copy field to avoid race condition
			curField := field
			fieldResolutionGroup.Go(func() error {
				resolvedField, err := executor.ResolveTemplate[string](sbctx, sandbox, s.Logger, *curField, false)
				if err != nil {
					return errors.Wrap(err, fmt.Sprintf("error resolving field %s", *curField))
				}
				*curField = *resolvedField
				return nil
			})
		}
	}
	return fieldResolutionGroup.Wait()
}

func (s *server) ExchangeOauthCodeForToken(ctx context.Context, req *apiv1.ExchangeOauthCodeForTokenRequest) (*emptypb.Empty, error) {
	var authType string
	var authConfig *commonv1.OAuth_AuthorizationCodeFlow = &commonv1.OAuth_AuthorizationCodeFlow{}
	// try to fetch the integration, it should work if it exists
	integration, err := s.Fetcher.FetchIntegration(ctx, req.IntegrationId, req.Profile)
	if err != nil {
		switch e := err.(type) {
		case *sberrors.NotFoundError:
			// fallback to use the authType and authConfig in the request, that means the integration doesn't exist yet
			// but we still want to exchange the code for a token
			authType = req.AuthType
			authConfig = req.AuthConfig

			err = s.resolveBindings(ctx, []*string{&authConfig.ClientSecret})
			if err != nil {
				return nil, err
			}
			err = s.TokenManager.ExchangeOauthCodeForToken(
				ctx,
				authType,
				authConfig,
				req.AccessCode,
				req.IntegrationId,
				req.ConfigurationId,
			)
			return &emptypb.Empty{}, err
		default:
			return nil, e
		}
	}
	integrationConfig, err := structpb.NewValue(integration.Configuration)
	if err != nil {
		return nil, err
	}
	integrationPb := integrationConfig.GetStructValue()
	if authTypeField, ok := integrationPb.GetFields()["authType"]; ok {
		authType = authTypeField.GetStringValue()
	} else {
		return nil, fmt.Errorf("authType not found in integration configuration")
	}

	if authConfigField, ok := integrationPb.GetFields()["authConfig"]; ok {
		err = jsonutils.MapToProto(authConfigField.GetStructValue().AsMap(), authConfig)
		if err != nil {
			return nil, err
		}
	} else {
		s.Logger.Error("authConfig not found in integration configuration")
		return nil, &sberrors.InternalError{}
	}

	err = s.resolveBindings(ctx, []*string{&authConfig.ClientSecret})
	if err != nil {
		return nil, err
	}
	err = s.TokenManager.ExchangeOauthCodeForToken(
		ctx,
		authType,
		authConfig,
		req.AccessCode,
		req.IntegrationId,
		req.ConfigurationId,
	)

	return &emptypb.Empty{}, err
}

func (s *server) RequestOauthPasswordToken(ctx context.Context, req *apiv1.RequestOauthPasswordTokenRequest) (*apiv1.RequestOauthPasswordTokenResponse, error) {
	integration, err := s.Fetcher.FetchIntegration(ctx, req.IntegrationId, req.Profile)
	if err != nil {
		return nil, err
	}

	integrationConfig, err := structpb.NewValue(integration.Configuration)
	if err != nil {
		return nil, err
	}
	integrationPb := integrationConfig.GetStructValue()

	passwordGrantFlowAuthConfig := &commonv1.OAuth_PasswordGrantFlow{}

	err = jsonutils.MapToProto(integrationPb.GetFields()["authConfig"].GetStructValue().AsMap(), passwordGrantFlowAuthConfig)
	if err != nil {
		return nil, err
	}
	// We use the username / password in the request because this is a per user authentication, not integration level
	// Otherwise, we would have gotten the username / password from the authConfig itself
	passwordGrantFlowAuthConfig.Username = req.Username
	passwordGrantFlowAuthConfig.Password = req.Password

	err = s.resolveBindings(ctx, []*string{
		&passwordGrantFlowAuthConfig.Username,
		&passwordGrantFlowAuthConfig.Password,
		&passwordGrantFlowAuthConfig.ClientSecret,
		&passwordGrantFlowAuthConfig.ClientId,
		&passwordGrantFlowAuthConfig.TokenUrl,
		&passwordGrantFlowAuthConfig.Audience,
		&passwordGrantFlowAuthConfig.Scope,
	})
	if err != nil {
		return nil, err
	}

	res, err := s.TokenManager.FetchNewOauthPasswordToken(passwordGrantFlowAuthConfig)
	if err != nil {
		return nil, err
	}

	return &apiv1.RequestOauthPasswordTokenResponse{
		AccessToken:     res.AccessToken,
		RefreshToken:    res.RefreshToken,
		ExpiryTimestamp: time.Now().Add(time.Duration(res.ExpiresIn) * time.Second).UnixMilli(),
	}, nil
}
