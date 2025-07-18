// Code generated by mockery v2.53.4. DO NOT EDIT.

package executor

import (
	context "github.com/superblocksteam/agent/pkg/context"

	mock "github.com/stretchr/testify/mock"

	structpb "google.golang.org/protobuf/types/known/structpb"

	v1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
)

// MockEvents is an autogenerated mock type for the Events type
type MockEvents struct {
	mock.Mock
}

// Data provides a mock function with given fields: _a0, _a1
func (_m *MockEvents) Data(_a0 *context.Context, _a1 *structpb.Value) {
	_m.Called(_a0, _a1)
}

// Finish provides a mock function with given fields: _a0, _a1, _a2
func (_m *MockEvents) Finish(_a0 *context.Context, _a1 *v1.Performance, _a2 error) {
	_m.Called(_a0, _a1, _a2)
}

// Request provides a mock function with no fields
func (_m *MockEvents) Request() {
	_m.Called()
}

// Start provides a mock function with given fields: _a0
func (_m *MockEvents) Start(_a0 *context.Context) *context.Context {
	ret := _m.Called(_a0)

	if len(ret) == 0 {
		panic("no return value specified for Start")
	}

	var r0 *context.Context
	if rf, ok := ret.Get(0).(func(*context.Context) *context.Context); ok {
		r0 = rf(_a0)
	} else {
		if ret.Get(0) != nil {
			r0 = ret.Get(0).(*context.Context)
		}
	}

	return r0
}

// NewMockEvents creates a new instance of MockEvents. It also registers a testing interface on the mock and a cleanup function to assert the mocks expectations.
// The first argument is typically a *testing.T value.
func NewMockEvents(t interface {
	mock.TestingT
	Cleanup(func())
}) *MockEvents {
	mock := &MockEvents{}
	mock.Mock.Test(t)

	t.Cleanup(func() { mock.AssertExpectations(t) })

	return mock
}
