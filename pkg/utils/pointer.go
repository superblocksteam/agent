package utils

func Pointer[T any](x T) *T {
	return &x
}

// PointerDeref returns either the value of the pointer, or if the pointer is
// nil, an uninitialized value of the same type.
//
//	s := "hello"
//	p := &s
//	// s == PointerDeref(p)
//	p = nil
//	// "" == PointerDeref(p)
func PointerDeref[T any](x *T) T {
	if x == nil {
		var n T
		return n
	}
	return *x
}
