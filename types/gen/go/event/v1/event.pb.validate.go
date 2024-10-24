// Code generated by protoc-gen-validate. DO NOT EDIT.
// source: event/v1/event.proto

package v1

import (
	"bytes"
	"errors"
	"fmt"
	"net"
	"net/mail"
	"net/url"
	"regexp"
	"sort"
	"strings"
	"time"
	"unicode/utf8"

	"google.golang.org/protobuf/types/known/anypb"

	v1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
)

// ensure the imports are used
var (
	_ = bytes.MinRead
	_ = errors.New("")
	_ = fmt.Print
	_ = utf8.UTFMax
	_ = (*regexp.Regexp)(nil)
	_ = (*strings.Reader)(nil)
	_ = net.IPv4len
	_ = time.Duration(0)
	_ = (*url.URL)(nil)
	_ = (*mail.Address)(nil)
	_ = anypb.Any{}
	_ = sort.Sort

	_ = v1.BlockType(0)
)

// Validate checks the field values on ExecutionEvent with the rules defined in
// the proto definition for this message. If any rules are violated, the first
// error encountered is returned, or nil if there are no violations.
func (m *ExecutionEvent) Validate() error {
	return m.validate(false)
}

// ValidateAll checks the field values on ExecutionEvent with the rules defined
// in the proto definition for this message. If any rules are violated, the
// result is a list of violation errors wrapped in ExecutionEventMultiError,
// or nil if none found.
func (m *ExecutionEvent) ValidateAll() error {
	return m.validate(true)
}

func (m *ExecutionEvent) validate(all bool) error {
	if m == nil {
		return nil
	}

	var errors []error

	// no validation rules for ExecutionId

	// no validation rules for ResourceId

	// no validation rules for ResourceName

	// no validation rules for ResourceType

	// no validation rules for Status

	// no validation rules for Mode

	// no validation rules for OrganizationId

	// no validation rules for Trigger

	// no validation rules for IsDescendantOfStream

	if m.ResourceSubtype != nil {
		// no validation rules for ResourceSubtype
	}

	if m.Result != nil {
		// no validation rules for Result
	}

	if m.IntegrationId != nil {
		// no validation rules for IntegrationId
	}

	if m.IntegrationType != nil {
		// no validation rules for IntegrationType
	}

	if m.UserId != nil {
		// no validation rules for UserId
	}

	if m.ParentId != nil {
		// no validation rules for ParentId
	}

	if m.ParentName != nil {
		// no validation rules for ParentName
	}

	if m.ParentType != nil {
		// no validation rules for ParentType
	}

	if m.ApiId != nil {
		// no validation rules for ApiId
	}

	if len(errors) > 0 {
		return ExecutionEventMultiError(errors)
	}

	return nil
}

// ExecutionEventMultiError is an error wrapping multiple validation errors
// returned by ExecutionEvent.ValidateAll() if the designated constraints
// aren't met.
type ExecutionEventMultiError []error

// Error returns a concatenation of all the error messages it wraps.
func (m ExecutionEventMultiError) Error() string {
	var msgs []string
	for _, err := range m {
		msgs = append(msgs, err.Error())
	}
	return strings.Join(msgs, "; ")
}

// AllErrors returns a list of validation violation errors.
func (m ExecutionEventMultiError) AllErrors() []error { return m }

// ExecutionEventValidationError is the validation error returned by
// ExecutionEvent.Validate if the designated constraints aren't met.
type ExecutionEventValidationError struct {
	field  string
	reason string
	cause  error
	key    bool
}

// Field function returns field value.
func (e ExecutionEventValidationError) Field() string { return e.field }

// Reason function returns reason value.
func (e ExecutionEventValidationError) Reason() string { return e.reason }

// Cause function returns cause value.
func (e ExecutionEventValidationError) Cause() error { return e.cause }

// Key function returns key value.
func (e ExecutionEventValidationError) Key() bool { return e.key }

// ErrorName returns error name.
func (e ExecutionEventValidationError) ErrorName() string { return "ExecutionEventValidationError" }

// Error satisfies the builtin error interface
func (e ExecutionEventValidationError) Error() string {
	cause := ""
	if e.cause != nil {
		cause = fmt.Sprintf(" | caused by: %v", e.cause)
	}

	key := ""
	if e.key {
		key = "key for "
	}

	return fmt.Sprintf(
		"invalid %sExecutionEvent.%s: %s%s",
		key,
		e.field,
		e.reason,
		cause)
}

var _ error = ExecutionEventValidationError{}

var _ interface {
	Field() string
	Reason() string
	Key() bool
	Cause() error
	ErrorName() string
} = ExecutionEventValidationError{}
