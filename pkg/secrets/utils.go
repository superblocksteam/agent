package secrets

import (
	"context"

	"github.com/superblocksteam/agent/pkg/jsonutils"
	"github.com/superblocksteam/agent/pkg/utils"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	secretsv1 "github.com/superblocksteam/agent/types/gen/go/secrets/v1"
	"google.golang.org/protobuf/types/known/structpb"
)

func RetrieveAndUnmarshalIfNeeded(
	ctx context.Context,
	driver Secrets,
	stores []*secretsv1.Store,
	api *apiv1.Api,
	literal map[string]*structpb.Struct,
	dst map[string]*structpb.Value,
) error {
	if contains, err := utils.ContainsSuperblocksSecrets(api, literal); err != nil {
		return err
	} else if !contains {
		return nil
	}

	raw, err := driver.Retrieve(ctx, stores)
	if err != nil {
		return err
	}

	if raw != nil {
		var value structpb.Value
		{
			if err := jsonutils.MapToProto[map[string]*string](raw, &value); err != nil {
				return err
			}
		}

		dst["sb_secrets"] = &value
	}

	return nil
}
