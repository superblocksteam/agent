// Code generated by mockery v2.53.4. DO NOT EDIT.

package mocks

import (
	mock "github.com/stretchr/testify/mock"
	v1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
)

// Flags is an autogenerated mock type for the Flags type
type Flags struct {
	mock.Mock
}

// GetApiTimeoutV2 provides a mock function with given fields: api, tier
func (_m *Flags) GetApiTimeoutV2(api *v1.Api, tier string) float64 {
	ret := _m.Called(api, tier)

	if len(ret) == 0 {
		panic("no return value specified for GetApiTimeoutV2")
	}

	var r0 float64
	if rf, ok := ret.Get(0).(func(*v1.Api, string) float64); ok {
		r0 = rf(api, tier)
	} else {
		r0 = ret.Get(0).(float64)
	}

	return r0
}

// GetComputeMinutesPerWeekV2 provides a mock function with given fields: tier, orgId
func (_m *Flags) GetComputeMinutesPerWeekV2(tier string, orgId string) float64 {
	ret := _m.Called(tier, orgId)

	if len(ret) == 0 {
		panic("no return value specified for GetComputeMinutesPerWeekV2")
	}

	var r0 float64
	if rf, ok := ret.Get(0).(func(string, string) float64); ok {
		r0 = rf(tier, orgId)
	} else {
		r0 = ret.Get(0).(float64)
	}

	return r0
}

// GetFlagSource provides a mock function with no fields
func (_m *Flags) GetFlagSource() int {
	ret := _m.Called()

	if len(ret) == 0 {
		panic("no return value specified for GetFlagSource")
	}

	var r0 int
	if rf, ok := ret.Get(0).(func() int); ok {
		r0 = rf()
	} else {
		r0 = ret.Get(0).(int)
	}

	return r0
}

// GetGoWorkerEnabled provides a mock function with given fields: tier, orgId
func (_m *Flags) GetGoWorkerEnabled(tier string, orgId string) bool {
	ret := _m.Called(tier, orgId)

	if len(ret) == 0 {
		panic("no return value specified for GetGoWorkerEnabled")
	}

	var r0 bool
	if rf, ok := ret.Get(0).(func(string, string) bool); ok {
		r0 = rf(tier, orgId)
	} else {
		r0 = ret.Get(0).(bool)
	}

	return r0
}

// GetMaxParallelPoolSizeByAPI provides a mock function with given fields: _a0
func (_m *Flags) GetMaxParallelPoolSizeByAPI(_a0 string) int {
	ret := _m.Called(_a0)

	if len(ret) == 0 {
		panic("no return value specified for GetMaxParallelPoolSizeByAPI")
	}

	var r0 int
	if rf, ok := ret.Get(0).(func(string) int); ok {
		r0 = rf(_a0)
	} else {
		r0 = ret.Get(0).(int)
	}

	return r0
}

// GetMaxParallelPoolSizeV2 provides a mock function with given fields: tier, orgId
func (_m *Flags) GetMaxParallelPoolSizeV2(tier string, orgId string) int {
	ret := _m.Called(tier, orgId)

	if len(ret) == 0 {
		panic("no return value specified for GetMaxParallelPoolSizeV2")
	}

	var r0 int
	if rf, ok := ret.Get(0).(func(string, string) int); ok {
		r0 = rf(tier, orgId)
	} else {
		r0 = ret.Get(0).(int)
	}

	return r0
}

// GetMaxStreamSendSizeByOrg provides a mock function with given fields: _a0
func (_m *Flags) GetMaxStreamSendSizeByOrg(_a0 string) int {
	ret := _m.Called(_a0)

	if len(ret) == 0 {
		panic("no return value specified for GetMaxStreamSendSizeByOrg")
	}

	var r0 int
	if rf, ok := ret.Get(0).(func(string) int); ok {
		r0 = rf(_a0)
	} else {
		r0 = ret.Get(0).(int)
	}

	return r0
}

// GetMaxStreamSendSizeV2 provides a mock function with given fields: tier, orgId
func (_m *Flags) GetMaxStreamSendSizeV2(tier string, orgId string) int {
	ret := _m.Called(tier, orgId)

	if len(ret) == 0 {
		panic("no return value specified for GetMaxStreamSendSizeV2")
	}

	var r0 int
	if rf, ok := ret.Get(0).(func(string, string) int); ok {
		r0 = rf(tier, orgId)
	} else {
		r0 = ret.Get(0).(int)
	}

	return r0
}

// GetStepDurationByOrg provides a mock function with given fields: _a0
func (_m *Flags) GetStepDurationByOrg(_a0 string) int {
	ret := _m.Called(_a0)

	if len(ret) == 0 {
		panic("no return value specified for GetStepDurationByOrg")
	}

	var r0 int
	if rf, ok := ret.Get(0).(func(string) int); ok {
		r0 = rf(_a0)
	} else {
		r0 = ret.Get(0).(int)
	}

	return r0
}

// GetStepDurationV2 provides a mock function with given fields: tier, orgId
func (_m *Flags) GetStepDurationV2(tier string, orgId string) int {
	ret := _m.Called(tier, orgId)

	if len(ret) == 0 {
		panic("no return value specified for GetStepDurationV2")
	}

	var r0 int
	if rf, ok := ret.Get(0).(func(string, string) int); ok {
		r0 = rf(tier, orgId)
	} else {
		r0 = ret.Get(0).(int)
	}

	return r0
}

// GetStepRateByOrg provides a mock function with given fields: _a0
func (_m *Flags) GetStepRateByOrg(_a0 string) int {
	ret := _m.Called(_a0)

	if len(ret) == 0 {
		panic("no return value specified for GetStepRateByOrg")
	}

	var r0 int
	if rf, ok := ret.Get(0).(func(string) int); ok {
		r0 = rf(_a0)
	} else {
		r0 = ret.Get(0).(int)
	}

	return r0
}

// GetStepRatePerApiByOrg provides a mock function with given fields: _a0
func (_m *Flags) GetStepRatePerApiByOrg(_a0 string) int {
	ret := _m.Called(_a0)

	if len(ret) == 0 {
		panic("no return value specified for GetStepRatePerApiByOrg")
	}

	var r0 int
	if rf, ok := ret.Get(0).(func(string) int); ok {
		r0 = rf(_a0)
	} else {
		r0 = ret.Get(0).(int)
	}

	return r0
}

// GetStepRatePerApiV2 provides a mock function with given fields: tier, orgId
func (_m *Flags) GetStepRatePerApiV2(tier string, orgId string) int {
	ret := _m.Called(tier, orgId)

	if len(ret) == 0 {
		panic("no return value specified for GetStepRatePerApiV2")
	}

	var r0 int
	if rf, ok := ret.Get(0).(func(string, string) int); ok {
		r0 = rf(tier, orgId)
	} else {
		r0 = ret.Get(0).(int)
	}

	return r0
}

// GetStepRatePerPluginV2 provides a mock function with given fields: tier, orgId, pluginName
func (_m *Flags) GetStepRatePerPluginV2(tier string, orgId string, pluginName string) int {
	ret := _m.Called(tier, orgId, pluginName)

	if len(ret) == 0 {
		panic("no return value specified for GetStepRatePerPluginV2")
	}

	var r0 int
	if rf, ok := ret.Get(0).(func(string, string, string) int); ok {
		r0 = rf(tier, orgId, pluginName)
	} else {
		r0 = ret.Get(0).(int)
	}

	return r0
}

// GetStepRatePerUserByOrg provides a mock function with given fields: _a0
func (_m *Flags) GetStepRatePerUserByOrg(_a0 string) int {
	ret := _m.Called(_a0)

	if len(ret) == 0 {
		panic("no return value specified for GetStepRatePerUserByOrg")
	}

	var r0 int
	if rf, ok := ret.Get(0).(func(string) int); ok {
		r0 = rf(_a0)
	} else {
		r0 = ret.Get(0).(int)
	}

	return r0
}

// GetStepRatePerUserV2 provides a mock function with given fields: tier, orgId
func (_m *Flags) GetStepRatePerUserV2(tier string, orgId string) int {
	ret := _m.Called(tier, orgId)

	if len(ret) == 0 {
		panic("no return value specified for GetStepRatePerUserV2")
	}

	var r0 int
	if rf, ok := ret.Get(0).(func(string, string) int); ok {
		r0 = rf(tier, orgId)
	} else {
		r0 = ret.Get(0).(int)
	}

	return r0
}

// GetStepRateV2 provides a mock function with given fields: tier, orgId
func (_m *Flags) GetStepRateV2(tier string, orgId string) int {
	ret := _m.Called(tier, orgId)

	if len(ret) == 0 {
		panic("no return value specified for GetStepRateV2")
	}

	var r0 int
	if rf, ok := ret.Get(0).(func(string, string) int); ok {
		r0 = rf(tier, orgId)
	} else {
		r0 = ret.Get(0).(int)
	}

	return r0
}

// GetStepSizeByOrg provides a mock function with given fields: _a0
func (_m *Flags) GetStepSizeByOrg(_a0 string) int {
	ret := _m.Called(_a0)

	if len(ret) == 0 {
		panic("no return value specified for GetStepSizeByOrg")
	}

	var r0 int
	if rf, ok := ret.Get(0).(func(string) int); ok {
		r0 = rf(_a0)
	} else {
		r0 = ret.Get(0).(int)
	}

	return r0
}

// GetStepSizeV2 provides a mock function with given fields: tier, orgId
func (_m *Flags) GetStepSizeV2(tier string, orgId string) int {
	ret := _m.Called(tier, orgId)

	if len(ret) == 0 {
		panic("no return value specified for GetStepSizeV2")
	}

	var r0 int
	if rf, ok := ret.Get(0).(func(string, string) int); ok {
		r0 = rf(tier, orgId)
	} else {
		r0 = ret.Get(0).(int)
	}

	return r0
}

// GetWorkflowPluginInheritanceEnabled provides a mock function with given fields: orgId
func (_m *Flags) GetWorkflowPluginInheritanceEnabled(orgId string) bool {
	ret := _m.Called(orgId)

	if len(ret) == 0 {
		panic("no return value specified for GetWorkflowPluginInheritanceEnabled")
	}

	var r0 bool
	if rf, ok := ret.Get(0).(func(string) bool); ok {
		r0 = rf(orgId)
	} else {
		r0 = ret.Get(0).(bool)
	}

	return r0
}

// NewFlags creates a new instance of Flags. It also registers a testing interface on the mock and a cleanup function to assert the mocks expectations.
// The first argument is typically a *testing.T value.
func NewFlags(t interface {
	mock.TestingT
	Cleanup(func())
}) *Flags {
	mock := &Flags{}
	mock.Mock.Test(t)

	t.Cleanup(func() { mock.AssertExpectations(t) })

	return mock
}
