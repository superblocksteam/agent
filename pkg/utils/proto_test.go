package utils

import (
	"testing"

	"github.com/stretchr/testify/assert"
	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	commonv1 "github.com/superblocksteam/agent/types/gen/go/common/v1"
	"google.golang.org/protobuf/proto"
)

type fakeFatalHelperTB struct {
	fatalCalled  bool
	helperCalled bool
	tb           testing.TB
}

func newFakeFatalHelperTB(tb testing.TB) *fakeFatalHelperTB {
	return &fakeFatalHelperTB{tb: tb}
}

func (f *fakeFatalHelperTB) Fatalf(format string, args ...interface{}) {
	f.fatalCalled = true
}

func (f *fakeFatalHelperTB) Helper() {
	f.helperCalled = true
}

func TestAssertProtoEqual(t *testing.T) {
	t.Parallel()

	testCases := []struct {
		name           string
		a              proto.Message
		b              proto.Message
		expectAreEqual bool
	}{
		{
			name: "success",
			a: &apiv1.Api{
				Metadata: &commonv1.Metadata{
					Name: "API_1",
					Id:   "12345",
				},
			},
			b: &apiv1.Api{
				Metadata: &commonv1.Metadata{
					Name: "API_1",
					Id:   "12345",
				},
			},
			expectAreEqual: true,
		},
		{
			name:           "success both nil",
			a:              nil,
			b:              nil,
			expectAreEqual: true,
		},
		{
			name: "failure same type",
			a: &apiv1.Api{
				Metadata: &commonv1.Metadata{
					Name: "API_1",
					Id:   "12345",
				},
			},
			b: &apiv1.Api{
				Metadata: &commonv1.Metadata{
					Name:        "API_1",
					Id:          "12345",
					Description: Pointer("API Description"),
				},
			},
		},
		{
			name: "failure different types",
			a: &apiv1.Api{
				Metadata: &commonv1.Metadata{
					Name: "API_1",
					Id:   "12345",
				},
			},
			b: &commonv1.Metadata{
				Name:        "API_1",
				Id:          "12345",
				Description: Pointer("API Description"),
			},
		},
		{
			name: "failure nil proto",
			a: &apiv1.Api{
				Metadata: &commonv1.Metadata{
					Name: "API_1",
					Id:   "12345",
				},
			},
			b: nil,
		},
	}
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			fakeTB := newFakeFatalHelperTB(t)

			AssertProtoEqual(fakeTB, tc.a, tc.b)

			assert.True(t, fakeTB.helperCalled)
			assert.Equal(t, tc.expectAreEqual, !fakeTB.fatalCalled)
		})
	}
}
