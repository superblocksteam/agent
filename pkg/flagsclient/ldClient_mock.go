// Code generated by mockery v2.53.4. DO NOT EDIT.

package flagsclient

import (
	ldcontext "github.com/launchdarkly/go-sdk-common/v3/ldcontext"
	mock "github.com/stretchr/testify/mock"
)

// mockLdClient is an autogenerated mock type for the ldClient type
type mockLdClient struct {
	mock.Mock
}

// BoolVariation provides a mock function with given fields: key, context, defaultVal
func (_m *mockLdClient) BoolVariation(key string, context ldcontext.Context, defaultVal bool) (bool, error) {
	ret := _m.Called(key, context, defaultVal)

	if len(ret) == 0 {
		panic("no return value specified for BoolVariation")
	}

	var r0 bool
	var r1 error
	if rf, ok := ret.Get(0).(func(string, ldcontext.Context, bool) (bool, error)); ok {
		return rf(key, context, defaultVal)
	}
	if rf, ok := ret.Get(0).(func(string, ldcontext.Context, bool) bool); ok {
		r0 = rf(key, context, defaultVal)
	} else {
		r0 = ret.Get(0).(bool)
	}

	if rf, ok := ret.Get(1).(func(string, ldcontext.Context, bool) error); ok {
		r1 = rf(key, context, defaultVal)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}

// Close provides a mock function with no fields
func (_m *mockLdClient) Close() error {
	ret := _m.Called()

	if len(ret) == 0 {
		panic("no return value specified for Close")
	}

	var r0 error
	if rf, ok := ret.Get(0).(func() error); ok {
		r0 = rf()
	} else {
		r0 = ret.Error(0)
	}

	return r0
}

// Float64Variation provides a mock function with given fields: key, context, defaultVal
func (_m *mockLdClient) Float64Variation(key string, context ldcontext.Context, defaultVal float64) (float64, error) {
	ret := _m.Called(key, context, defaultVal)

	if len(ret) == 0 {
		panic("no return value specified for Float64Variation")
	}

	var r0 float64
	var r1 error
	if rf, ok := ret.Get(0).(func(string, ldcontext.Context, float64) (float64, error)); ok {
		return rf(key, context, defaultVal)
	}
	if rf, ok := ret.Get(0).(func(string, ldcontext.Context, float64) float64); ok {
		r0 = rf(key, context, defaultVal)
	} else {
		r0 = ret.Get(0).(float64)
	}

	if rf, ok := ret.Get(1).(func(string, ldcontext.Context, float64) error); ok {
		r1 = rf(key, context, defaultVal)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}

// IntVariation provides a mock function with given fields: key, context, defaultVal
func (_m *mockLdClient) IntVariation(key string, context ldcontext.Context, defaultVal int) (int, error) {
	ret := _m.Called(key, context, defaultVal)

	if len(ret) == 0 {
		panic("no return value specified for IntVariation")
	}

	var r0 int
	var r1 error
	if rf, ok := ret.Get(0).(func(string, ldcontext.Context, int) (int, error)); ok {
		return rf(key, context, defaultVal)
	}
	if rf, ok := ret.Get(0).(func(string, ldcontext.Context, int) int); ok {
		r0 = rf(key, context, defaultVal)
	} else {
		r0 = ret.Get(0).(int)
	}

	if rf, ok := ret.Get(1).(func(string, ldcontext.Context, int) error); ok {
		r1 = rf(key, context, defaultVal)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}

// StringVariation provides a mock function with given fields: key, context, defaultVal
func (_m *mockLdClient) StringVariation(key string, context ldcontext.Context, defaultVal string) (string, error) {
	ret := _m.Called(key, context, defaultVal)

	if len(ret) == 0 {
		panic("no return value specified for StringVariation")
	}

	var r0 string
	var r1 error
	if rf, ok := ret.Get(0).(func(string, ldcontext.Context, string) (string, error)); ok {
		return rf(key, context, defaultVal)
	}
	if rf, ok := ret.Get(0).(func(string, ldcontext.Context, string) string); ok {
		r0 = rf(key, context, defaultVal)
	} else {
		r0 = ret.Get(0).(string)
	}

	if rf, ok := ret.Get(1).(func(string, ldcontext.Context, string) error); ok {
		r1 = rf(key, context, defaultVal)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}

// newMockLdClient creates a new instance of mockLdClient. It also registers a testing interface on the mock and a cleanup function to assert the mocks expectations.
// The first argument is typically a *testing.T value.
func newMockLdClient(t interface {
	mock.TestingT
	Cleanup(func())
}) *mockLdClient {
	mock := &mockLdClient{}
	mock.Mock.Test(t)

	t.Cleanup(func() { mock.AssertExpectations(t) })

	return mock
}
