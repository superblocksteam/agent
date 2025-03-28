// Code generated by mockery v2.42.0. DO NOT EDIT.

package mocks

import (
	context "context"

	plugin "workers/golang/internal/plugin"

	mock "github.com/stretchr/testify/mock"

	v1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
)

// PluginExecutor is an autogenerated mock type for the PluginExecutor type
type PluginExecutor struct {
	mock.Mock
}

type PluginExecutor_Expecter struct {
	mock *mock.Mock
}

func (_m *PluginExecutor) EXPECT() *PluginExecutor_Expecter {
	return &PluginExecutor_Expecter{mock: &_m.Mock}
}

// Execute provides a mock function with given fields: ctx, pluginName, props, quotas, perf
func (_m *PluginExecutor) Execute(ctx context.Context, pluginName string, props *v1.Request_Data_Data_Props, quotas *v1.Request_Data_Data_Quota, perf *v1.Performance) (*v1.Response_Data_Data, error) {
	ret := _m.Called(ctx, pluginName, props, quotas, perf)

	if len(ret) == 0 {
		panic("no return value specified for Execute")
	}

	var r0 *v1.Response_Data_Data
	var r1 error
	if rf, ok := ret.Get(0).(func(context.Context, string, *v1.Request_Data_Data_Props, *v1.Request_Data_Data_Quota, *v1.Performance) (*v1.Response_Data_Data, error)); ok {
		return rf(ctx, pluginName, props, quotas, perf)
	}
	if rf, ok := ret.Get(0).(func(context.Context, string, *v1.Request_Data_Data_Props, *v1.Request_Data_Data_Quota, *v1.Performance) *v1.Response_Data_Data); ok {
		r0 = rf(ctx, pluginName, props, quotas, perf)
	} else {
		if ret.Get(0) != nil {
			r0 = ret.Get(0).(*v1.Response_Data_Data)
		}
	}

	if rf, ok := ret.Get(1).(func(context.Context, string, *v1.Request_Data_Data_Props, *v1.Request_Data_Data_Quota, *v1.Performance) error); ok {
		r1 = rf(ctx, pluginName, props, quotas, perf)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}

// PluginExecutor_Execute_Call is a *mock.Call that shadows Run/Return methods with type explicit version for method 'Execute'
type PluginExecutor_Execute_Call struct {
	*mock.Call
}

// Execute is a helper method to define mock.On call
//   - ctx context.Context
//   - pluginName string
//   - props *v1.Request_Data_Data_Props
//   - quotas *v1.Request_Data_Data_Quota
//   - perf *v1.Performance
func (_e *PluginExecutor_Expecter) Execute(ctx interface{}, pluginName interface{}, props interface{}, quotas interface{}, perf interface{}) *PluginExecutor_Execute_Call {
	return &PluginExecutor_Execute_Call{Call: _e.mock.On("Execute", ctx, pluginName, props, quotas, perf)}
}

func (_c *PluginExecutor_Execute_Call) Run(run func(ctx context.Context, pluginName string, props *v1.Request_Data_Data_Props, quotas *v1.Request_Data_Data_Quota, perf *v1.Performance)) *PluginExecutor_Execute_Call {
	_c.Call.Run(func(args mock.Arguments) {
		run(args[0].(context.Context), args[1].(string), args[2].(*v1.Request_Data_Data_Props), args[3].(*v1.Request_Data_Data_Quota), args[4].(*v1.Performance))
	})
	return _c
}

func (_c *PluginExecutor_Execute_Call) Return(_a0 *v1.Response_Data_Data, _a1 error) *PluginExecutor_Execute_Call {
	_c.Call.Return(_a0, _a1)
	return _c
}

func (_c *PluginExecutor_Execute_Call) RunAndReturn(run func(context.Context, string, *v1.Request_Data_Data_Props, *v1.Request_Data_Data_Quota, *v1.Performance) (*v1.Response_Data_Data, error)) *PluginExecutor_Execute_Call {
	_c.Call.Return(run)
	return _c
}

// ListPlugins provides a mock function with given fields:
func (_m *PluginExecutor) ListPlugins() []string {
	ret := _m.Called()

	if len(ret) == 0 {
		panic("no return value specified for ListPlugins")
	}

	var r0 []string
	if rf, ok := ret.Get(0).(func() []string); ok {
		r0 = rf()
	} else {
		if ret.Get(0) != nil {
			r0 = ret.Get(0).([]string)
		}
	}

	return r0
}

// PluginExecutor_ListPlugins_Call is a *mock.Call that shadows Run/Return methods with type explicit version for method 'ListPlugins'
type PluginExecutor_ListPlugins_Call struct {
	*mock.Call
}

// ListPlugins is a helper method to define mock.On call
func (_e *PluginExecutor_Expecter) ListPlugins() *PluginExecutor_ListPlugins_Call {
	return &PluginExecutor_ListPlugins_Call{Call: _e.mock.On("ListPlugins")}
}

func (_c *PluginExecutor_ListPlugins_Call) Run(run func()) *PluginExecutor_ListPlugins_Call {
	_c.Call.Run(func(args mock.Arguments) {
		run()
	})
	return _c
}

func (_c *PluginExecutor_ListPlugins_Call) Return(_a0 []string) *PluginExecutor_ListPlugins_Call {
	_c.Call.Return(_a0)
	return _c
}

func (_c *PluginExecutor_ListPlugins_Call) RunAndReturn(run func() []string) *PluginExecutor_ListPlugins_Call {
	_c.Call.Return(run)
	return _c
}

// Metadata provides a mock function with given fields: ctx, pluginName, props, perf
func (_m *PluginExecutor) Metadata(ctx context.Context, pluginName string, props *v1.Request_Data_Data_Props, perf *v1.Performance) (*v1.Response_Data_Data, error) {
	ret := _m.Called(ctx, pluginName, props, perf)

	if len(ret) == 0 {
		panic("no return value specified for Metadata")
	}

	var r0 *v1.Response_Data_Data
	var r1 error
	if rf, ok := ret.Get(0).(func(context.Context, string, *v1.Request_Data_Data_Props, *v1.Performance) (*v1.Response_Data_Data, error)); ok {
		return rf(ctx, pluginName, props, perf)
	}
	if rf, ok := ret.Get(0).(func(context.Context, string, *v1.Request_Data_Data_Props, *v1.Performance) *v1.Response_Data_Data); ok {
		r0 = rf(ctx, pluginName, props, perf)
	} else {
		if ret.Get(0) != nil {
			r0 = ret.Get(0).(*v1.Response_Data_Data)
		}
	}

	if rf, ok := ret.Get(1).(func(context.Context, string, *v1.Request_Data_Data_Props, *v1.Performance) error); ok {
		r1 = rf(ctx, pluginName, props, perf)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}

// PluginExecutor_Metadata_Call is a *mock.Call that shadows Run/Return methods with type explicit version for method 'Metadata'
type PluginExecutor_Metadata_Call struct {
	*mock.Call
}

// Metadata is a helper method to define mock.On call
//   - ctx context.Context
//   - pluginName string
//   - props *v1.Request_Data_Data_Props
//   - perf *v1.Performance
func (_e *PluginExecutor_Expecter) Metadata(ctx interface{}, pluginName interface{}, props interface{}, perf interface{}) *PluginExecutor_Metadata_Call {
	return &PluginExecutor_Metadata_Call{Call: _e.mock.On("Metadata", ctx, pluginName, props, perf)}
}

func (_c *PluginExecutor_Metadata_Call) Run(run func(ctx context.Context, pluginName string, props *v1.Request_Data_Data_Props, perf *v1.Performance)) *PluginExecutor_Metadata_Call {
	_c.Call.Run(func(args mock.Arguments) {
		run(args[0].(context.Context), args[1].(string), args[2].(*v1.Request_Data_Data_Props), args[3].(*v1.Performance))
	})
	return _c
}

func (_c *PluginExecutor_Metadata_Call) Return(_a0 *v1.Response_Data_Data, _a1 error) *PluginExecutor_Metadata_Call {
	_c.Call.Return(_a0, _a1)
	return _c
}

func (_c *PluginExecutor_Metadata_Call) RunAndReturn(run func(context.Context, string, *v1.Request_Data_Data_Props, *v1.Performance) (*v1.Response_Data_Data, error)) *PluginExecutor_Metadata_Call {
	_c.Call.Return(run)
	return _c
}

// PreDelete provides a mock function with given fields: ctx, pluginName, props, perf
func (_m *PluginExecutor) PreDelete(ctx context.Context, pluginName string, props *v1.Request_Data_Data_Props, perf *v1.Performance) (*v1.Response_Data_Data, error) {
	ret := _m.Called(ctx, pluginName, props, perf)

	if len(ret) == 0 {
		panic("no return value specified for PreDelete")
	}

	var r0 *v1.Response_Data_Data
	var r1 error
	if rf, ok := ret.Get(0).(func(context.Context, string, *v1.Request_Data_Data_Props, *v1.Performance) (*v1.Response_Data_Data, error)); ok {
		return rf(ctx, pluginName, props, perf)
	}
	if rf, ok := ret.Get(0).(func(context.Context, string, *v1.Request_Data_Data_Props, *v1.Performance) *v1.Response_Data_Data); ok {
		r0 = rf(ctx, pluginName, props, perf)
	} else {
		if ret.Get(0) != nil {
			r0 = ret.Get(0).(*v1.Response_Data_Data)
		}
	}

	if rf, ok := ret.Get(1).(func(context.Context, string, *v1.Request_Data_Data_Props, *v1.Performance) error); ok {
		r1 = rf(ctx, pluginName, props, perf)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}

// PluginExecutor_PreDelete_Call is a *mock.Call that shadows Run/Return methods with type explicit version for method 'PreDelete'
type PluginExecutor_PreDelete_Call struct {
	*mock.Call
}

// PreDelete is a helper method to define mock.On call
//   - ctx context.Context
//   - pluginName string
//   - props *v1.Request_Data_Data_Props
//   - perf *v1.Performance
func (_e *PluginExecutor_Expecter) PreDelete(ctx interface{}, pluginName interface{}, props interface{}, perf interface{}) *PluginExecutor_PreDelete_Call {
	return &PluginExecutor_PreDelete_Call{Call: _e.mock.On("PreDelete", ctx, pluginName, props, perf)}
}

func (_c *PluginExecutor_PreDelete_Call) Run(run func(ctx context.Context, pluginName string, props *v1.Request_Data_Data_Props, perf *v1.Performance)) *PluginExecutor_PreDelete_Call {
	_c.Call.Run(func(args mock.Arguments) {
		run(args[0].(context.Context), args[1].(string), args[2].(*v1.Request_Data_Data_Props), args[3].(*v1.Performance))
	})
	return _c
}

func (_c *PluginExecutor_PreDelete_Call) Return(_a0 *v1.Response_Data_Data, _a1 error) *PluginExecutor_PreDelete_Call {
	_c.Call.Return(_a0, _a1)
	return _c
}

func (_c *PluginExecutor_PreDelete_Call) RunAndReturn(run func(context.Context, string, *v1.Request_Data_Data_Props, *v1.Performance) (*v1.Response_Data_Data, error)) *PluginExecutor_PreDelete_Call {
	_c.Call.Return(run)
	return _c
}

// RegisterPlugin provides a mock function with given fields: name, _a1
func (_m *PluginExecutor) RegisterPlugin(name string, _a1 plugin.Plugin) error {
	ret := _m.Called(name, _a1)

	if len(ret) == 0 {
		panic("no return value specified for RegisterPlugin")
	}

	var r0 error
	if rf, ok := ret.Get(0).(func(string, plugin.Plugin) error); ok {
		r0 = rf(name, _a1)
	} else {
		r0 = ret.Error(0)
	}

	return r0
}

// PluginExecutor_RegisterPlugin_Call is a *mock.Call that shadows Run/Return methods with type explicit version for method 'RegisterPlugin'
type PluginExecutor_RegisterPlugin_Call struct {
	*mock.Call
}

// RegisterPlugin is a helper method to define mock.On call
//   - name string
//   - _a1 plugin.Plugin
func (_e *PluginExecutor_Expecter) RegisterPlugin(name interface{}, _a1 interface{}) *PluginExecutor_RegisterPlugin_Call {
	return &PluginExecutor_RegisterPlugin_Call{Call: _e.mock.On("RegisterPlugin", name, _a1)}
}

func (_c *PluginExecutor_RegisterPlugin_Call) Run(run func(name string, _a1 plugin.Plugin)) *PluginExecutor_RegisterPlugin_Call {
	_c.Call.Run(func(args mock.Arguments) {
		run(args[0].(string), args[1].(plugin.Plugin))
	})
	return _c
}

func (_c *PluginExecutor_RegisterPlugin_Call) Return(_a0 error) *PluginExecutor_RegisterPlugin_Call {
	_c.Call.Return(_a0)
	return _c
}

func (_c *PluginExecutor_RegisterPlugin_Call) RunAndReturn(run func(string, plugin.Plugin) error) *PluginExecutor_RegisterPlugin_Call {
	_c.Call.Return(run)
	return _c
}

// Stream provides a mock function with given fields: ctx, pluginName, props, perf, send, until
func (_m *PluginExecutor) Stream(ctx context.Context, pluginName string, props *v1.Request_Data_Data_Props, perf *v1.Performance, send func(interface{}), until func()) error {
	ret := _m.Called(ctx, pluginName, props, perf, send, until)

	if len(ret) == 0 {
		panic("no return value specified for Stream")
	}

	var r0 error
	if rf, ok := ret.Get(0).(func(context.Context, string, *v1.Request_Data_Data_Props, *v1.Performance, func(interface{}), func()) error); ok {
		r0 = rf(ctx, pluginName, props, perf, send, until)
	} else {
		r0 = ret.Error(0)
	}

	return r0
}

// PluginExecutor_Stream_Call is a *mock.Call that shadows Run/Return methods with type explicit version for method 'Stream'
type PluginExecutor_Stream_Call struct {
	*mock.Call
}

// Stream is a helper method to define mock.On call
//   - ctx context.Context
//   - pluginName string
//   - props *v1.Request_Data_Data_Props
//   - perf *v1.Performance
//   - send func(interface{})
//   - until func()
func (_e *PluginExecutor_Expecter) Stream(ctx interface{}, pluginName interface{}, props interface{}, perf interface{}, send interface{}, until interface{}) *PluginExecutor_Stream_Call {
	return &PluginExecutor_Stream_Call{Call: _e.mock.On("Stream", ctx, pluginName, props, perf, send, until)}
}

func (_c *PluginExecutor_Stream_Call) Run(run func(ctx context.Context, pluginName string, props *v1.Request_Data_Data_Props, perf *v1.Performance, send func(interface{}), until func())) *PluginExecutor_Stream_Call {
	_c.Call.Run(func(args mock.Arguments) {
		run(args[0].(context.Context), args[1].(string), args[2].(*v1.Request_Data_Data_Props), args[3].(*v1.Performance), args[4].(func(interface{})), args[5].(func()))
	})
	return _c
}

func (_c *PluginExecutor_Stream_Call) Return(_a0 error) *PluginExecutor_Stream_Call {
	_c.Call.Return(_a0)
	return _c
}

func (_c *PluginExecutor_Stream_Call) RunAndReturn(run func(context.Context, string, *v1.Request_Data_Data_Props, *v1.Performance, func(interface{}), func()) error) *PluginExecutor_Stream_Call {
	_c.Call.Return(run)
	return _c
}

// Test provides a mock function with given fields: ctx, pluginName, props, perf
func (_m *PluginExecutor) Test(ctx context.Context, pluginName string, props *v1.Request_Data_Data_Props, perf *v1.Performance) (*v1.Response_Data_Data, error) {
	ret := _m.Called(ctx, pluginName, props, perf)

	if len(ret) == 0 {
		panic("no return value specified for Test")
	}

	var r0 *v1.Response_Data_Data
	var r1 error
	if rf, ok := ret.Get(0).(func(context.Context, string, *v1.Request_Data_Data_Props, *v1.Performance) (*v1.Response_Data_Data, error)); ok {
		return rf(ctx, pluginName, props, perf)
	}
	if rf, ok := ret.Get(0).(func(context.Context, string, *v1.Request_Data_Data_Props, *v1.Performance) *v1.Response_Data_Data); ok {
		r0 = rf(ctx, pluginName, props, perf)
	} else {
		if ret.Get(0) != nil {
			r0 = ret.Get(0).(*v1.Response_Data_Data)
		}
	}

	if rf, ok := ret.Get(1).(func(context.Context, string, *v1.Request_Data_Data_Props, *v1.Performance) error); ok {
		r1 = rf(ctx, pluginName, props, perf)
	} else {
		r1 = ret.Error(1)
	}

	return r0, r1
}

// PluginExecutor_Test_Call is a *mock.Call that shadows Run/Return methods with type explicit version for method 'Test'
type PluginExecutor_Test_Call struct {
	*mock.Call
}

// Test is a helper method to define mock.On call
//   - ctx context.Context
//   - pluginName string
//   - props *v1.Request_Data_Data_Props
//   - perf *v1.Performance
func (_e *PluginExecutor_Expecter) Test(ctx interface{}, pluginName interface{}, props interface{}, perf interface{}) *PluginExecutor_Test_Call {
	return &PluginExecutor_Test_Call{Call: _e.mock.On("Test", ctx, pluginName, props, perf)}
}

func (_c *PluginExecutor_Test_Call) Run(run func(ctx context.Context, pluginName string, props *v1.Request_Data_Data_Props, perf *v1.Performance)) *PluginExecutor_Test_Call {
	_c.Call.Run(func(args mock.Arguments) {
		run(args[0].(context.Context), args[1].(string), args[2].(*v1.Request_Data_Data_Props), args[3].(*v1.Performance))
	})
	return _c
}

func (_c *PluginExecutor_Test_Call) Return(_a0 *v1.Response_Data_Data, _a1 error) *PluginExecutor_Test_Call {
	_c.Call.Return(_a0, _a1)
	return _c
}

func (_c *PluginExecutor_Test_Call) RunAndReturn(run func(context.Context, string, *v1.Request_Data_Data_Props, *v1.Performance) (*v1.Response_Data_Data, error)) *PluginExecutor_Test_Call {
	_c.Call.Return(run)
	return _c
}

// NewPluginExecutor creates a new instance of PluginExecutor. It also registers a testing interface on the mock and a cleanup function to assert the mocks expectations.
// The first argument is typically a *testing.T value.
func NewPluginExecutor(t interface {
	mock.TestingT
	Cleanup(func())
}) *PluginExecutor {
	mock := &PluginExecutor{}
	mock.Mock.Test(t)

	t.Cleanup(func() { mock.AssertExpectations(t) })

	return mock
}
