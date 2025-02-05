// Code generated by protoc-gen-validate. DO NOT EDIT.
// source: common/v1/health.proto

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
)

// Validate checks the field values on Pool with the rules defined in the proto
// definition for this message. If any rules are violated, the first error
// encountered is returned, or nil if there are no violations.
func (m *Pool) Validate() error {
	return m.validate(false)
}

// ValidateAll checks the field values on Pool with the rules defined in the
// proto definition for this message. If any rules are violated, the result is
// a list of violation errors wrapped in PoolMultiError, or nil if none found.
func (m *Pool) ValidateAll() error {
	return m.validate(true)
}

func (m *Pool) validate(all bool) error {
	if m == nil {
		return nil
	}

	var errors []error

	if m.Hits != nil {
		// no validation rules for Hits
	}

	if m.Misses != nil {
		// no validation rules for Misses
	}

	if m.Timeouts != nil {
		// no validation rules for Timeouts
	}

	if m.Total != nil {
		// no validation rules for Total
	}

	if m.Idle != nil {
		// no validation rules for Idle
	}

	if m.Stale != nil {
		// no validation rules for Stale
	}

	if len(errors) > 0 {
		return PoolMultiError(errors)
	}

	return nil
}

// PoolMultiError is an error wrapping multiple validation errors returned by
// Pool.ValidateAll() if the designated constraints aren't met.
type PoolMultiError []error

// Error returns a concatenation of all the error messages it wraps.
func (m PoolMultiError) Error() string {
	var msgs []string
	for _, err := range m {
		msgs = append(msgs, err.Error())
	}
	return strings.Join(msgs, "; ")
}

// AllErrors returns a list of validation violation errors.
func (m PoolMultiError) AllErrors() []error { return m }

// PoolValidationError is the validation error returned by Pool.Validate if the
// designated constraints aren't met.
type PoolValidationError struct {
	field  string
	reason string
	cause  error
	key    bool
}

// Field function returns field value.
func (e PoolValidationError) Field() string { return e.field }

// Reason function returns reason value.
func (e PoolValidationError) Reason() string { return e.reason }

// Cause function returns cause value.
func (e PoolValidationError) Cause() error { return e.cause }

// Key function returns key value.
func (e PoolValidationError) Key() bool { return e.key }

// ErrorName returns error name.
func (e PoolValidationError) ErrorName() string { return "PoolValidationError" }

// Error satisfies the builtin error interface
func (e PoolValidationError) Error() string {
	cause := ""
	if e.cause != nil {
		cause = fmt.Sprintf(" | caused by: %v", e.cause)
	}

	key := ""
	if e.key {
		key = "key for "
	}

	return fmt.Sprintf(
		"invalid %sPool.%s: %s%s",
		key,
		e.field,
		e.reason,
		cause)
}

var _ error = PoolValidationError{}

var _ interface {
	Field() string
	Reason() string
	Key() bool
	Cause() error
	ErrorName() string
} = PoolValidationError{}

// Validate checks the field values on HealthResponse with the rules defined in
// the proto definition for this message. If any rules are violated, the first
// error encountered is returned, or nil if there are no violations.
func (m *HealthResponse) Validate() error {
	return m.validate(false)
}

// ValidateAll checks the field values on HealthResponse with the rules defined
// in the proto definition for this message. If any rules are violated, the
// result is a list of violation errors wrapped in HealthResponseMultiError,
// or nil if none found.
func (m *HealthResponse) ValidateAll() error {
	return m.validate(true)
}

func (m *HealthResponse) validate(all bool) error {
	if m == nil {
		return nil
	}

	var errors []error

	// no validation rules for Message

	// no validation rules for Uptime

	// no validation rules for Version

	if all {
		switch v := interface{}(m.GetStore()).(type) {
		case interface{ ValidateAll() error }:
			if err := v.ValidateAll(); err != nil {
				errors = append(errors, HealthResponseValidationError{
					field:  "Store",
					reason: "embedded message failed validation",
					cause:  err,
				})
			}
		case interface{ Validate() error }:
			if err := v.Validate(); err != nil {
				errors = append(errors, HealthResponseValidationError{
					field:  "Store",
					reason: "embedded message failed validation",
					cause:  err,
				})
			}
		}
	} else if v, ok := interface{}(m.GetStore()).(interface{ Validate() error }); ok {
		if err := v.Validate(); err != nil {
			return HealthResponseValidationError{
				field:  "Store",
				reason: "embedded message failed validation",
				cause:  err,
			}
		}
	}

	if all {
		switch v := interface{}(m.GetStream()).(type) {
		case interface{ ValidateAll() error }:
			if err := v.ValidateAll(); err != nil {
				errors = append(errors, HealthResponseValidationError{
					field:  "Stream",
					reason: "embedded message failed validation",
					cause:  err,
				})
			}
		case interface{ Validate() error }:
			if err := v.Validate(); err != nil {
				errors = append(errors, HealthResponseValidationError{
					field:  "Stream",
					reason: "embedded message failed validation",
					cause:  err,
				})
			}
		}
	} else if v, ok := interface{}(m.GetStream()).(interface{ Validate() error }); ok {
		if err := v.Validate(); err != nil {
			return HealthResponseValidationError{
				field:  "Stream",
				reason: "embedded message failed validation",
				cause:  err,
			}
		}
	}

	// no validation rules for Id

	if len(errors) > 0 {
		return HealthResponseMultiError(errors)
	}

	return nil
}

// HealthResponseMultiError is an error wrapping multiple validation errors
// returned by HealthResponse.ValidateAll() if the designated constraints
// aren't met.
type HealthResponseMultiError []error

// Error returns a concatenation of all the error messages it wraps.
func (m HealthResponseMultiError) Error() string {
	var msgs []string
	for _, err := range m {
		msgs = append(msgs, err.Error())
	}
	return strings.Join(msgs, "; ")
}

// AllErrors returns a list of validation violation errors.
func (m HealthResponseMultiError) AllErrors() []error { return m }

// HealthResponseValidationError is the validation error returned by
// HealthResponse.Validate if the designated constraints aren't met.
type HealthResponseValidationError struct {
	field  string
	reason string
	cause  error
	key    bool
}

// Field function returns field value.
func (e HealthResponseValidationError) Field() string { return e.field }

// Reason function returns reason value.
func (e HealthResponseValidationError) Reason() string { return e.reason }

// Cause function returns cause value.
func (e HealthResponseValidationError) Cause() error { return e.cause }

// Key function returns key value.
func (e HealthResponseValidationError) Key() bool { return e.key }

// ErrorName returns error name.
func (e HealthResponseValidationError) ErrorName() string { return "HealthResponseValidationError" }

// Error satisfies the builtin error interface
func (e HealthResponseValidationError) Error() string {
	cause := ""
	if e.cause != nil {
		cause = fmt.Sprintf(" | caused by: %v", e.cause)
	}

	key := ""
	if e.key {
		key = "key for "
	}

	return fmt.Sprintf(
		"invalid %sHealthResponse.%s: %s%s",
		key,
		e.field,
		e.reason,
		cause)
}

var _ error = HealthResponseValidationError{}

var _ interface {
	Field() string
	Reason() string
	Key() bool
	Cause() error
	ErrorName() string
} = HealthResponseValidationError{}
