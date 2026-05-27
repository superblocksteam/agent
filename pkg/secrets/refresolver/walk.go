package refresolver

import (
	"context"
	"errors"
	"fmt"

	"google.golang.org/protobuf/types/known/structpb"
)

const (
	maxRefResolverWalkDepth = 64
	maxRefResolverWalkNodes = 10_000
)

var errRefResolverWalkLimitExceeded = errors.New("refresolver: config walk limit exceeded")

// ResolveInConfig walks cfg recursively, locates any embedded
// {resolver, ref, field} maps, resolves them through dispatcher, and
// rewrites them in place as string values.
//
// Literal credentials (regular customer integrations that store plain
// usernames/passwords as scalar fields) are not touched: a struct with
// no "resolver" string field never satisfies RefFromMap, so the walk
// descends past it without resolving anything. This means the call is
// safe to make on every integration the executor fetches, including
// integrations that have nothing to do with database_lifecycle.
//
// A nil cfg or a nil dispatcher with no refs to resolve is a no-op.
// Returning early on a ref-shaped value (i.e. not descending into a
// matched ref's children) is intentional: a resolved ref becomes a
// scalar string, so there is nothing to descend into.
func ResolveInConfig(ctx context.Context, d *Dispatcher, cfg *structpb.Struct) error {
	if cfg == nil {
		return nil
	}
	return resolveStruct(ctx, d, cfg, &refWalkBudget{}, 0)
}

// HasRefs reports whether any integration config in the map carries an
// embedded credential ref. Callers can use it to avoid constructing a
// Dispatcher (and the AWS client behind it) when there is no ref to
// resolve. Cheap: walks structpb in-process without any I/O. If a config
// exceeds the bounded walk limits, HasRefs returns true so callers fail
// closed instead of treating an uninspected subtree as safe.
func HasRefs(configs map[string]*structpb.Struct) bool {
	for _, cfg := range configs {
		hasRef, err := structHasRef(cfg, &refWalkBudget{}, 0)
		if err != nil {
			return true
		}
		if hasRef {
			return true
		}
	}
	return false
}

type refWalkBudget struct {
	nodes int
}

func (b *refWalkBudget) visit(depth int) error {
	if depth > maxRefResolverWalkDepth {
		return fmt.Errorf("%w: depth %d exceeds max %d", errRefResolverWalkLimitExceeded, depth, maxRefResolverWalkDepth)
	}
	b.nodes++
	if b.nodes > maxRefResolverWalkNodes {
		return fmt.Errorf("%w: nodes %d exceeds max %d", errRefResolverWalkLimitExceeded, b.nodes, maxRefResolverWalkNodes)
	}
	return nil
}

func resolveStruct(ctx context.Context, d *Dispatcher, s *structpb.Struct, budget *refWalkBudget, depth int) error {
	if s == nil {
		return nil
	}
	if err := budget.visit(depth); err != nil {
		return err
	}
	for key, val := range s.GetFields() {
		replacement, err := resolveValue(ctx, d, val, budget, depth+1)
		if err != nil {
			return fmt.Errorf("field %q: %w", key, err)
		}
		if replacement != nil {
			s.Fields[key] = replacement
		}
	}
	return nil
}

func resolveValue(ctx context.Context, d *Dispatcher, v *structpb.Value, budget *refWalkBudget, depth int) (*structpb.Value, error) {
	if v == nil {
		return nil, nil
	}
	if err := budget.visit(depth); err != nil {
		return nil, err
	}
	switch kind := v.GetKind().(type) {
	case *structpb.Value_StructValue:
		if ref, ok := refFromStruct(kind.StructValue); ok {
			if d == nil {
				return nil, fmt.Errorf("%w: dispatcher is nil", ErrUnsupportedResolver)
			}
			resolved, err := d.Resolve(ctx, ref)
			if err != nil {
				return nil, err
			}
			return structpb.NewStringValue(resolved), nil
		}
		if err := resolveStruct(ctx, d, kind.StructValue, budget, depth+1); err != nil {
			return nil, err
		}
	case *structpb.Value_ListValue:
		for i, item := range kind.ListValue.GetValues() {
			replacement, err := resolveValue(ctx, d, item, budget, depth+1)
			if err != nil {
				return nil, fmt.Errorf("index %d: %w", i, err)
			}
			if replacement != nil {
				kind.ListValue.Values[i] = replacement
			}
		}
	}
	return nil, nil
}

func structHasRef(s *structpb.Struct, budget *refWalkBudget, depth int) (bool, error) {
	if s == nil {
		return false, nil
	}
	if err := budget.visit(depth); err != nil {
		return false, err
	}
	for _, val := range s.GetFields() {
		hasRef, err := valueHasRef(val, budget, depth+1)
		if err != nil {
			return false, err
		}
		if hasRef {
			return true, nil
		}
	}
	return false, nil
}

func valueHasRef(v *structpb.Value, budget *refWalkBudget, depth int) (bool, error) {
	if v == nil {
		return false, nil
	}
	if err := budget.visit(depth); err != nil {
		return false, err
	}
	switch kind := v.GetKind().(type) {
	case *structpb.Value_StructValue:
		if _, ok := refFromStruct(kind.StructValue); ok {
			return true, nil
		}
		return structHasRef(kind.StructValue, budget, depth+1)
	case *structpb.Value_ListValue:
		for _, item := range kind.ListValue.GetValues() {
			hasRef, err := valueHasRef(item, budget, depth+1)
			if err != nil {
				return false, err
			}
			if hasRef {
				return true, nil
			}
		}
	}
	return false, nil
}

func refFromStruct(s *structpb.Struct) (Ref, bool) {
	if s == nil {
		return Ref{}, false
	}
	fields := s.GetFields()
	resolver := fields["resolver"].GetStringValue()
	ref := fields["ref"].GetStringValue()
	if resolver == "" || ref == "" {
		return Ref{}, false
	}
	return Ref{
		Resolver: ResolverType(resolver),
		Ref:      ref,
		Field:    fields["field"].GetStringValue(),
	}, true
}
