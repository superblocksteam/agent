package redis

import (
	"testing"

	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
	transportv1 "github.com/superblocksteam/agent/types/gen/go/transport/v1"
)

func TestComputeAllowedKeys(t *testing.T) {
	tests := []struct {
		name        string
		executionID string
		props       *transportv1.Request_Data_Data_Props
		want        []string
	}{
		{
			name:        "nil props returns empty",
			executionID: "exec-1",
			props:       nil,
			want:        nil,
		},
		{
			name:        "empty props returns empty",
			executionID: "exec-1",
			props:       &transportv1.Request_Data_Data_Props{},
			want:        nil,
		},
		{
			name:        "global binding key",
			executionID: "exec-1",
			props: &transportv1.Request_Data_Data_Props{
				BindingKeys: []*transportv1.Request_Data_Data_Props_Binding{
					{Type: "global", Key: "myGlobal"},
				},
			},
			want: []string{"exec-1.context.global.myGlobal"},
		},
		{
			name:        "output binding key",
			executionID: "exec-1",
			props: &transportv1.Request_Data_Data_Props{
				BindingKeys: []*transportv1.Request_Data_Data_Props_Binding{
					{Type: "output", Key: "Step1"},
				},
			},
			want: []string{"exec-1.context.output.Step1"},
		},
		{
			name:        "unknown binding type is skipped",
			executionID: "exec-1",
			props: &transportv1.Request_Data_Data_Props{
				BindingKeys: []*transportv1.Request_Data_Data_Props_Binding{
					{Type: "unknown", Key: "someKey"},
				},
			},
			want: nil,
		},
		{
			name:        "multiple binding keys",
			executionID: "exec-1",
			props: &transportv1.Request_Data_Data_Props{
				BindingKeys: []*transportv1.Request_Data_Data_Props_Binding{
					{Type: "global", Key: "g1"},
					{Type: "output", Key: "o1"},
					{Type: "global", Key: "g2"},
					{Type: "output", Key: "o2"},
				},
			},
			want: []string{
				"exec-1.context.global.g1",
				"exec-1.context.output.o1",
				"exec-1.context.global.g2",
				"exec-1.context.output.o2",
			},
		},
		{
			name:        "simple variable type included",
			executionID: "exec-1",
			props: &transportv1.Request_Data_Data_Props{
				Variables: map[string]*transportv1.Variable{
					"var1": {Type: apiv1.Variables_TYPE_SIMPLE, Key: "VARIABLE.simple-key"},
				},
			},
			want: []string{"VARIABLE.simple-key"},
		},
		{
			name:        "advanced variable type included",
			executionID: "exec-1",
			props: &transportv1.Request_Data_Data_Props{
				Variables: map[string]*transportv1.Variable{
					"var1": {Type: apiv1.Variables_TYPE_ADVANCED, Key: "VARIABLE.advanced-key"},
				},
			},
			want: []string{"VARIABLE.advanced-key"},
		},
		{
			name:        "native variable type included",
			executionID: "exec-1",
			props: &transportv1.Request_Data_Data_Props{
				Variables: map[string]*transportv1.Variable{
					"var1": {Type: apiv1.Variables_TYPE_NATIVE, Key: "VARIABLE.native-key"},
				},
			},
			want: []string{"VARIABLE.native-key"},
		},
		{
			name:        "filepicker variable type included",
			executionID: "exec-1",
			props: &transportv1.Request_Data_Data_Props{
				Variables: map[string]*transportv1.Variable{
					"var1": {Type: apiv1.Variables_TYPE_FILEPICKER, Key: "VARIABLE.filepicker-key"},
				},
			},
			want: []string{"VARIABLE.filepicker-key"},
		},
		{
			name:        "variable with empty key is skipped",
			executionID: "exec-1",
			props: &transportv1.Request_Data_Data_Props{
				Variables: map[string]*transportv1.Variable{
					"var1": {Type: apiv1.Variables_TYPE_SIMPLE, Key: ""},
				},
			},
			want: nil,
		},
		{
			name:        "nil variable in map is skipped",
			executionID: "exec-1",
			props: &transportv1.Request_Data_Data_Props{
				Variables: map[string]*transportv1.Variable{
					"var1": nil,
					"var2": {Type: apiv1.Variables_TYPE_SIMPLE, Key: "VARIABLE.valid"},
				},
			},
			want: []string{"VARIABLE.valid"},
		},
		{
			name:        "all variable types included",
			executionID: "exec-1",
			props: &transportv1.Request_Data_Data_Props{
				Variables: map[string]*transportv1.Variable{
					"simple":     {Type: apiv1.Variables_TYPE_SIMPLE, Key: "VARIABLE.simple"},
					"advanced":   {Type: apiv1.Variables_TYPE_ADVANCED, Key: "VARIABLE.advanced"},
					"native":     {Type: apiv1.Variables_TYPE_NATIVE, Key: "VARIABLE.native"},
					"filepicker": {Type: apiv1.Variables_TYPE_FILEPICKER, Key: "VARIABLE.filepicker"},
				},
			},
			want: []string{
				"VARIABLE.simple",
				"VARIABLE.advanced",
				"VARIABLE.native",
				"VARIABLE.filepicker",
			},
		},
		{
			name:        "combined bindings and variables",
			executionID: "exec-123",
			props: &transportv1.Request_Data_Data_Props{
				BindingKeys: []*transportv1.Request_Data_Data_Props_Binding{
					{Type: "global", Key: "globalVar"},
					{Type: "output", Key: "Step1"},
				},
				Variables: map[string]*transportv1.Variable{
					"myVar": {Type: apiv1.Variables_TYPE_SIMPLE, Key: "VARIABLE.uuid-123"},
				},
			},
			want: []string{
				"exec-123.context.global.globalVar",
				"exec-123.context.output.Step1",
				"VARIABLE.uuid-123",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := ComputeAllowedKeys(tt.executionID, tt.props)

			// For tests with maps (which have non-deterministic iteration order),
			// we need to check that all expected keys are present
			if len(got) != len(tt.want) {
				t.Errorf("ComputeAllowedKeys() returned %d keys, want %d keys\ngot: %v\nwant: %v",
					len(got), len(tt.want), got, tt.want)
				return
			}

			// For simple cases where order is deterministic, check exact match
			// For map iteration cases, check set equality
			gotSet := make(map[string]bool)
			for _, k := range got {
				gotSet[k] = true
			}

			for _, wantKey := range tt.want {
				if !gotSet[wantKey] {
					t.Errorf("ComputeAllowedKeys() missing expected key %q\ngot: %v\nwant: %v",
						wantKey, got, tt.want)
				}
			}
		})
	}
}

func TestComputeAllowedKeys_ExecutionIDFormat(t *testing.T) {
	// Test that execution ID is properly included in binding keys
	executionID := "019ba092-1801-75c9-a64e-d3786ddd6600"
	props := &transportv1.Request_Data_Data_Props{
		BindingKeys: []*transportv1.Request_Data_Data_Props_Binding{
			{Type: "global", Key: "testGlobal"},
			{Type: "output", Key: "testOutput"},
		},
	}

	got := ComputeAllowedKeys(executionID, props)

	expectedGlobal := "019ba092-1801-75c9-a64e-d3786ddd6600.context.global.testGlobal"
	expectedOutput := "019ba092-1801-75c9-a64e-d3786ddd6600.context.output.testOutput"

	if len(got) != 2 {
		t.Fatalf("expected 2 keys, got %d: %v", len(got), got)
	}

	if got[0] != expectedGlobal {
		t.Errorf("expected global key %q, got %q", expectedGlobal, got[0])
	}
	if got[1] != expectedOutput {
		t.Errorf("expected output key %q, got %q", expectedOutput, got[1])
	}
}
