package secrets

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/superblocksteam/agent/pkg/constants"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	commonv1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
	secretsv1 "github.com/superblocksteam/agent/types/gen/go/secrets/v1"
	"google.golang.org/protobuf/types/known/structpb"
)

func TestRetrieveAndUnmarshalIfNeeded(t *testing.T) {
	for _, test := range []struct {
		name    string
		err     bool
		ctx     context.Context
		stores  []*secretsv1.Store
		api     *apiv1.Api
		literal map[string]*structpb.Struct
		in      map[string]*structpb.Value
		out     map[string]*structpb.Value
	}{
		{
			name: "happy path",
			ctx:  constants.WithOrganizationID(context.Background(), "org-123"),
			api:  nil,
			literal: map[string]*structpb.Struct{
				"anonymous": {
					Fields: map[string]*structpb.Value{
						"foo": structpb.NewStringValue("sb_secrets"),
					},
				},
			},
			stores: []*secretsv1.Store{
				{
					Metadata: &commonv1.Metadata{
						Name: "store",
					},
					Provider: &secretsv1.Provider{
						Config: &secretsv1.Provider_Mock{
							Mock: &secretsv1.MockStore{
								Data: map[string]string{
									"foo": "bar",
								},
							},
						},
					},
				},
			},
			in: map[string]*structpb.Value{},
			out: map[string]*structpb.Value{
				"sb_secrets": structpb.NewStructValue(&structpb.Struct{
					Fields: map[string]*structpb.Value{
						"store": structpb.NewStructValue(&structpb.Struct{
							Fields: map[string]*structpb.Value{
								"foo": structpb.NewStringValue("bar"),
							},
						}),
					},
				}),
			},
		},
		{
			name:    "does not contain",
			ctx:     constants.WithOrganizationID(context.Background(), "org-123"),
			api:     nil,
			literal: nil,
			stores:  []*secretsv1.Store{},
			in:      map[string]*structpb.Value{},
			out:     map[string]*structpb.Value{},
		},
		{
			name: "retrieval failure",
			ctx:  context.Background(),
			api:  nil,
			literal: map[string]*structpb.Struct{
				"anonymous": {
					Fields: map[string]*structpb.Value{
						"foo": structpb.NewStringValue("sb_secrets"),
					},
				},
			},
			stores: []*secretsv1.Store{},
			in:     map[string]*structpb.Value{},
			out:    map[string]*structpb.Value{},
			err:    true,
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			err := RetrieveAndUnmarshalIfNeeded(
				test.ctx,
				Manager(),
				test.stores,
				test.api,
				test.literal,
				test.in,
			)

			if test.err {
				assert.Error(t, err)
				return
			}

			assert.NoError(t, err)

			assert.Equal(t, (&structpb.Struct{
				Fields: test.out,
			}).AsMap(), (&structpb.Struct{
				Fields: test.in,
			}).AsMap())
		})
	}
}
