// Code generated by mockery v2.53.4. DO NOT EDIT.

package mocks

import mock "github.com/stretchr/testify/mock"

// SecretManager is an autogenerated mock type for the SecretManager type
type SecretManager struct {
	mock.Mock
}

// GetSecrets provides a mock function with no fields
func (_m *SecretManager) GetSecrets() map[string]string {
	ret := _m.Called()

	if len(ret) == 0 {
		panic("no return value specified for GetSecrets")
	}

	var r0 map[string]string
	if rf, ok := ret.Get(0).(func() map[string]string); ok {
		r0 = rf()
	} else {
		if ret.Get(0) != nil {
			r0 = ret.Get(0).(map[string]string)
		}
	}

	return r0
}

// NewSecretManager creates a new instance of SecretManager. It also registers a testing interface on the mock and a cleanup function to assert the mocks expectations.
// The first argument is typically a *testing.T value.
func NewSecretManager(t interface {
	mock.TestingT
	Cleanup(func())
}) *SecretManager {
	mock := &SecretManager{}
	mock.Mock.Test(t)

	t.Cleanup(func() { mock.AssertExpectations(t) })

	return mock
}
