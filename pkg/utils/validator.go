package utils

import (
	"errors"
	"fmt"

	"github.com/bufbuild/protovalidate-go"
	sberrors "github.com/superblocksteam/agent/pkg/errors"
	"google.golang.org/protobuf/reflect/protoreflect"
)

var (
	validator *protovalidate.Validator
)

func ProtoValidate(msg protoreflect.ProtoMessage) error {
	v, err := protovalidate.New()
	if err != nil {
		return err
	}

	validator = v

	err = validator.Validate(msg)

	if err == nil {
		return nil
	}

	pve, ok := err.(*protovalidate.ValidationError)
	if !ok {
		return err
	}

	ve := &sberrors.ValidationError{
		Issues: []error{},
	}

	for _, violation := range pve.Violations {
		ve.Issues = append(ve.Issues, errors.New(
			fmt.Sprintf("%s: %s [%s]", violation.FieldPath, violation.Message, violation.ConstraintId),
		))
	}

	return ve
}
