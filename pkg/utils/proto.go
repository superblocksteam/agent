package utils

import (
	"github.com/google/go-cmp/cmp"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/testing/protocmp"
)

type FatalHelperTB interface {
	Fatalf(format string, args ...any)
	Helper()
}

func AssertProtoEqual(t FatalHelperTB, expected proto.Message, actual proto.Message) {
	t.Helper()

	if diff := cmp.Diff(expected, actual, protocmp.Transform()); diff != "" {
		t.Fatalf("unexpected diff: %s", diff)
	}
}
