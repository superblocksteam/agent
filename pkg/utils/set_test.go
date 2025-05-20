package utils

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

type args struct {
	nilSet             *Set[int]
	equalSetA          *Set[int]
	equalSetB          *Set[int]
	unequalSetSameSize *Set[int]
	subSetDiffSize     *Set[int]
}

func validArgs() *args {
	var nilSet *Set[int]

	set1 := NewSet(1, 2, 3)
	set2 := NewSet(1, 2, 3)
	set3 := NewSet(1, 2, 4)
	set4 := NewSet(1, 2)

	return &args{
		nilSet:             nilSet,
		equalSetA:          set1,
		equalSetB:          set2,
		unequalSetSameSize: set3,
		subSetDiffSize:     set4,
	}
}

func verify(t *testing.T, args *args) {
	verifyNilSet(t, args)

	assert.True(t, args.equalSetA.IsEqual(args.equalSetB))
	assert.False(t, args.equalSetA.IsEqual(args.subSetDiffSize))
	assert.False(t, args.equalSetA.IsEqual(args.unequalSetSameSize))

	assert.True(t, args.equalSetA.IsSuperset(args.subSetDiffSize))
	assert.True(t, args.subSetDiffSize.IsSubset(args.equalSetA))

	assert.True(t, args.equalSetA.IsSuperset(args.equalSetB))
	assert.True(t, args.equalSetA.IsSubset(args.equalSetB))

	assert.False(t, args.equalSetA.IsSuperset(args.unequalSetSameSize))
	assert.False(t, args.unequalSetSameSize.IsSubset(args.equalSetA))

	clone := args.equalSetA.Clone()
	assert.True(t, clone.IsEqual(args.equalSetA))

	clone.Clear()
	assert.True(t, clone.IsEmpty())
	assert.False(t, args.equalSetA.IsEmpty())

	assert.ElementsMatch(t, args.equalSetA.ToSlice(), []int{1, 2, 3})
}

func verifyNilSet(t *testing.T, args *args) {
	assert.Panics(t, func() { args.nilSet.Add(1) })
	assert.Panics(t, func() { args.nilSet.Remove(1) })

	assert.False(t, args.nilSet.Contains(1))

	args.nilSet.Clear()
	assert.True(t, args.nilSet.IsEmpty())

	assert.Equal(t, args.nilSet.Size(), 0)
	assert.True(t, args.nilSet.IsEmpty())

	assert.Empty(t, args.nilSet.ToSlice())

	union := args.nilSet.Union(args.equalSetA)
	assert.True(t, union.IsEqual(args.equalSetA))

	intersection := args.nilSet.Intersection(args.equalSetA)
	assert.True(t, intersection.IsEmpty())

	difference := args.nilSet.Difference(args.equalSetA)
	assert.True(t, difference.IsEmpty())

	assert.True(t, args.nilSet.IsSubset(args.nilSet))
	assert.True(t, args.nilSet.IsSubset(args.equalSetA))
	assert.False(t, args.equalSetA.IsSubset(args.nilSet))

	assert.True(t, args.nilSet.IsSuperset(args.nilSet))
	assert.True(t, args.equalSetA.IsSuperset(args.nilSet))
	assert.False(t, args.nilSet.IsSuperset(args.equalSetA))

	assert.True(t, args.nilSet.IsDisjoint(args.equalSetA))
	assert.True(t, args.equalSetA.IsDisjoint(args.nilSet))

	assert.True(t, args.nilSet.IsEqual(args.nilSet))
	assert.False(t, args.nilSet.IsEqual(args.equalSetA))
	assert.False(t, args.equalSetA.IsEqual(args.nilSet))

	clone := args.nilSet.Clone()
	assert.True(t, clone.IsEqual(args.nilSet))
}

func TestOk(t *testing.T) {
	args := validArgs()
	verify(t, args)
}

func TestAddRemove(t *testing.T) {
	set := NewSet[int]()
	set.Add(1, 2, 3, 4)

	assert.Equal(t, set.Size(), 4)
	assert.True(t, set.Contains(1))
	assert.True(t, set.Contains(2))
	assert.True(t, set.Contains(3))
	assert.True(t, set.Contains(4))

	set.Remove(2, 3)

	assert.Equal(t, set.Size(), 2)
	assert.True(t, set.Contains(1))
	assert.False(t, set.Contains(2))
	assert.False(t, set.Contains(3))
	assert.True(t, set.Contains(4))
}

func TestUnion(t *testing.T) {
	set1 := NewSet(1, 2)
	set2 := NewSet(3, 4)

	set3 := set1.Union(set2)

	assert.Equal(t, set3.Size(), 4)
	assert.True(t, set3.Contains(1))
	assert.True(t, set3.Contains(2))
	assert.True(t, set3.Contains(3))
	assert.True(t, set3.Contains(4))

	// Assert original sets are unchanged
	assert.Equal(t, set1.Size(), 2)
	assert.True(t, set1.Contains(1))
	assert.True(t, set1.Contains(2))

	assert.Equal(t, set2.Size(), 2)
	assert.True(t, set2.Contains(3))
	assert.True(t, set2.Contains(4))
}

func TestIntersection(t *testing.T) {
	set1 := NewSet(1, 2, 3)
	set2 := NewSet(2, 3, 4)

	set3 := set1.Intersection(set2)

	assert.Equal(t, set3.Size(), 2)
	assert.True(t, set3.Contains(2))
	assert.True(t, set3.Contains(3))

	// Assert original sets are unchanged
	assert.Equal(t, set1.Size(), 3)
	assert.True(t, set1.Contains(1))
	assert.True(t, set1.Contains(2))
	assert.True(t, set1.Contains(3))

	assert.Equal(t, set2.Size(), 3)
	assert.True(t, set2.Contains(2))
	assert.True(t, set2.Contains(3))
	assert.True(t, set2.Contains(4))
}

func TestDifference(t *testing.T) {
	set1 := NewSet(1, 2, 3)
	set2 := NewSet(2, 3, 4)

	set3 := set1.Difference(set2)

	assert.Equal(t, set3.Size(), 1)
	assert.True(t, set3.Contains(1))

	// Assert original sets are unchanged
	assert.Equal(t, set1.Size(), 3)
	assert.True(t, set1.Contains(1))
	assert.True(t, set1.Contains(2))
	assert.True(t, set1.Contains(3))

	assert.Equal(t, set2.Size(), 3)
	assert.True(t, set2.Contains(2))
	assert.True(t, set2.Contains(3))
	assert.True(t, set2.Contains(4))
}

func TestIsDisjoint(t *testing.T) {
	set1 := NewSet(1, 2)
	set2 := NewSet(3, 4)
	set3 := NewSet(4, 5)

	assert.True(t, set1.IsDisjoint(set2))
	assert.False(t, set2.IsDisjoint(set3))
}
