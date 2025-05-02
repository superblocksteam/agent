package utils

import (
	"github.com/google/go-cmp/cmp"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/testing/protocmp"
)

/*
QOL function to compare 2 proto objects in a unit test.
Will compare the given proto messages and print out a nice message showing the diff.
*/
func ProtoEquals(tb FatalTB, expected proto.Message, actual proto.Message) {
	if d := cmp.Diff(expected, actual, protocmp.Transform()); d != "" {
		tb.Fatalf("unexpected diff\n%s", d)
	}
}
