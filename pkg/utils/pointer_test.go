package utils

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

type Person struct {
	Name string
}

func TestPointer(t *testing.T) {
	var p Person
	assert.NotNil(t, Pointer(&p))
}

func TestPointerDeref(t *testing.T) {
	var p *Person
	assert.Equal(t, Person{}, PointerDeref(p))

	p = &Person{Name: "hello"}
	assert.Equal(t, Person{Name: "hello"}, PointerDeref(p))
}
