// Code generated by protoc-gen-validate. DO NOT EDIT.
// source: plugins/cockroachdb/v1/plugin.proto

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

// Validate checks the field values on MappedColumns with the rules defined in
// the proto definition for this message. If any rules are violated, the first
// error encountered is returned, or nil if there are no violations.
func (m *MappedColumns) Validate() error {
	return m.validate(false)
}

// ValidateAll checks the field values on MappedColumns with the rules defined
// in the proto definition for this message. If any rules are violated, the
// result is a list of violation errors wrapped in MappedColumnsMultiError, or
// nil if none found.
func (m *MappedColumns) ValidateAll() error {
	return m.validate(true)
}

func (m *MappedColumns) validate(all bool) error {
	if m == nil {
		return nil
	}

	var errors []error

	// no validation rules for Json

	// no validation rules for Sql

	if len(errors) > 0 {
		return MappedColumnsMultiError(errors)
	}

	return nil
}

// MappedColumnsMultiError is an error wrapping multiple validation errors
// returned by MappedColumns.ValidateAll() if the designated constraints
// aren't met.
type MappedColumnsMultiError []error

// Error returns a concatenation of all the error messages it wraps.
func (m MappedColumnsMultiError) Error() string {
	var msgs []string
	for _, err := range m {
		msgs = append(msgs, err.Error())
	}
	return strings.Join(msgs, "; ")
}

// AllErrors returns a list of validation violation errors.
func (m MappedColumnsMultiError) AllErrors() []error { return m }

// MappedColumnsValidationError is the validation error returned by
// MappedColumns.Validate if the designated constraints aren't met.
type MappedColumnsValidationError struct {
	field  string
	reason string
	cause  error
	key    bool
}

// Field function returns field value.
func (e MappedColumnsValidationError) Field() string { return e.field }

// Reason function returns reason value.
func (e MappedColumnsValidationError) Reason() string { return e.reason }

// Cause function returns cause value.
func (e MappedColumnsValidationError) Cause() error { return e.cause }

// Key function returns key value.
func (e MappedColumnsValidationError) Key() bool { return e.key }

// ErrorName returns error name.
func (e MappedColumnsValidationError) ErrorName() string { return "MappedColumnsValidationError" }

// Error satisfies the builtin error interface
func (e MappedColumnsValidationError) Error() string {
	cause := ""
	if e.cause != nil {
		cause = fmt.Sprintf(" | caused by: %v", e.cause)
	}

	key := ""
	if e.key {
		key = "key for "
	}

	return fmt.Sprintf(
		"invalid %sMappedColumns.%s: %s%s",
		key,
		e.field,
		e.reason,
		cause)
}

var _ error = MappedColumnsValidationError{}

var _ interface {
	Field() string
	Reason() string
	Key() bool
	Cause() error
	ErrorName() string
} = MappedColumnsValidationError{}

// Validate checks the field values on SuperblocksMetadata with the rules
// defined in the proto definition for this message. If any rules are
// violated, the first error encountered is returned, or nil if there are no violations.
func (m *SuperblocksMetadata) Validate() error {
	return m.validate(false)
}

// ValidateAll checks the field values on SuperblocksMetadata with the rules
// defined in the proto definition for this message. If any rules are
// violated, the result is a list of violation errors wrapped in
// SuperblocksMetadataMultiError, or nil if none found.
func (m *SuperblocksMetadata) ValidateAll() error {
	return m.validate(true)
}

func (m *SuperblocksMetadata) validate(all bool) error {
	if m == nil {
		return nil
	}

	var errors []error

	// no validation rules for PluginVersion

	if len(errors) > 0 {
		return SuperblocksMetadataMultiError(errors)
	}

	return nil
}

// SuperblocksMetadataMultiError is an error wrapping multiple validation
// errors returned by SuperblocksMetadata.ValidateAll() if the designated
// constraints aren't met.
type SuperblocksMetadataMultiError []error

// Error returns a concatenation of all the error messages it wraps.
func (m SuperblocksMetadataMultiError) Error() string {
	var msgs []string
	for _, err := range m {
		msgs = append(msgs, err.Error())
	}
	return strings.Join(msgs, "; ")
}

// AllErrors returns a list of validation violation errors.
func (m SuperblocksMetadataMultiError) AllErrors() []error { return m }

// SuperblocksMetadataValidationError is the validation error returned by
// SuperblocksMetadata.Validate if the designated constraints aren't met.
type SuperblocksMetadataValidationError struct {
	field  string
	reason string
	cause  error
	key    bool
}

// Field function returns field value.
func (e SuperblocksMetadataValidationError) Field() string { return e.field }

// Reason function returns reason value.
func (e SuperblocksMetadataValidationError) Reason() string { return e.reason }

// Cause function returns cause value.
func (e SuperblocksMetadataValidationError) Cause() error { return e.cause }

// Key function returns key value.
func (e SuperblocksMetadataValidationError) Key() bool { return e.key }

// ErrorName returns error name.
func (e SuperblocksMetadataValidationError) ErrorName() string {
	return "SuperblocksMetadataValidationError"
}

// Error satisfies the builtin error interface
func (e SuperblocksMetadataValidationError) Error() string {
	cause := ""
	if e.cause != nil {
		cause = fmt.Sprintf(" | caused by: %v", e.cause)
	}

	key := ""
	if e.key {
		key = "key for "
	}

	return fmt.Sprintf(
		"invalid %sSuperblocksMetadata.%s: %s%s",
		key,
		e.field,
		e.reason,
		cause)
}

var _ error = SuperblocksMetadataValidationError{}

var _ interface {
	Field() string
	Reason() string
	Key() bool
	Cause() error
	ErrorName() string
} = SuperblocksMetadataValidationError{}

// Validate checks the field values on Plugin with the rules defined in the
// proto definition for this message. If any rules are violated, the first
// error encountered is returned, or nil if there are no violations.
func (m *Plugin) Validate() error {
	return m.validate(false)
}

// ValidateAll checks the field values on Plugin with the rules defined in the
// proto definition for this message. If any rules are violated, the result is
// a list of violation errors wrapped in PluginMultiError, or nil if none found.
func (m *Plugin) ValidateAll() error {
	return m.validate(true)
}

func (m *Plugin) validate(all bool) error {
	if m == nil {
		return nil
	}

	var errors []error

	// no validation rules for Body

	// no validation rules for UsePreparedSql

	for idx, item := range m.GetMappedColumns() {
		_, _ = idx, item

		if all {
			switch v := interface{}(item).(type) {
			case interface{ ValidateAll() error }:
				if err := v.ValidateAll(); err != nil {
					errors = append(errors, PluginValidationError{
						field:  fmt.Sprintf("MappedColumns[%v]", idx),
						reason: "embedded message failed validation",
						cause:  err,
					})
				}
			case interface{ Validate() error }:
				if err := v.Validate(); err != nil {
					errors = append(errors, PluginValidationError{
						field:  fmt.Sprintf("MappedColumns[%v]", idx),
						reason: "embedded message failed validation",
						cause:  err,
					})
				}
			}
		} else if v, ok := interface{}(item).(interface{ Validate() error }); ok {
			if err := v.Validate(); err != nil {
				return PluginValidationError{
					field:  fmt.Sprintf("MappedColumns[%v]", idx),
					reason: "embedded message failed validation",
					cause:  err,
				}
			}
		}

	}

	if all {
		switch v := interface{}(m.GetSuperblocksMetadata()).(type) {
		case interface{ ValidateAll() error }:
			if err := v.ValidateAll(); err != nil {
				errors = append(errors, PluginValidationError{
					field:  "SuperblocksMetadata",
					reason: "embedded message failed validation",
					cause:  err,
				})
			}
		case interface{ Validate() error }:
			if err := v.Validate(); err != nil {
				errors = append(errors, PluginValidationError{
					field:  "SuperblocksMetadata",
					reason: "embedded message failed validation",
					cause:  err,
				})
			}
		}
	} else if v, ok := interface{}(m.GetSuperblocksMetadata()).(interface{ Validate() error }); ok {
		if err := v.Validate(); err != nil {
			return PluginValidationError{
				field:  "SuperblocksMetadata",
				reason: "embedded message failed validation",
				cause:  err,
			}
		}
	}

	if m.Operation != nil {
		// no validation rules for Operation
	}

	if m.UseAdvancedMatching != nil {
		// no validation rules for UseAdvancedMatching
	}

	if m.Table != nil {
		// no validation rules for Table
	}

	if m.NewValues != nil {
		// no validation rules for NewValues
	}

	if m.OldValues != nil {
		// no validation rules for OldValues
	}

	if m.MappingMode != nil {
		// no validation rules for MappingMode
	}

	if m.InsertedRows != nil {
		// no validation rules for InsertedRows
	}

	if m.DeletedRows != nil {
		// no validation rules for DeletedRows
	}

	if m.Schema != nil {
		// no validation rules for Schema
	}

	if len(errors) > 0 {
		return PluginMultiError(errors)
	}

	return nil
}

// PluginMultiError is an error wrapping multiple validation errors returned by
// Plugin.ValidateAll() if the designated constraints aren't met.
type PluginMultiError []error

// Error returns a concatenation of all the error messages it wraps.
func (m PluginMultiError) Error() string {
	var msgs []string
	for _, err := range m {
		msgs = append(msgs, err.Error())
	}
	return strings.Join(msgs, "; ")
}

// AllErrors returns a list of validation violation errors.
func (m PluginMultiError) AllErrors() []error { return m }

// PluginValidationError is the validation error returned by Plugin.Validate if
// the designated constraints aren't met.
type PluginValidationError struct {
	field  string
	reason string
	cause  error
	key    bool
}

// Field function returns field value.
func (e PluginValidationError) Field() string { return e.field }

// Reason function returns reason value.
func (e PluginValidationError) Reason() string { return e.reason }

// Cause function returns cause value.
func (e PluginValidationError) Cause() error { return e.cause }

// Key function returns key value.
func (e PluginValidationError) Key() bool { return e.key }

// ErrorName returns error name.
func (e PluginValidationError) ErrorName() string { return "PluginValidationError" }

// Error satisfies the builtin error interface
func (e PluginValidationError) Error() string {
	cause := ""
	if e.cause != nil {
		cause = fmt.Sprintf(" | caused by: %v", e.cause)
	}

	key := ""
	if e.key {
		key = "key for "
	}

	return fmt.Sprintf(
		"invalid %sPlugin.%s: %s%s",
		key,
		e.field,
		e.reason,
		cause)
}

var _ error = PluginValidationError{}

var _ interface {
	Field() string
	Reason() string
	Key() bool
	Cause() error
	ErrorName() string
} = PluginValidationError{}