package javascript

import (
	"bytes"
	"encoding/base64"
	"fmt"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestReadFile(t *testing.T) {
	t.Parallel()

	testCases := []struct {
		name         string
		inputData    string
		expectError  bool
		expectedData string
	}{
		{
			name:         "successful read single segment",
			inputData:    createMockJSONResponse("test data"),
			expectError:  false,
			expectedData: "test data",
		},
		{
			name: "successful read multiple segments",
			inputData: strings.Join([]string{
				createMockJSONResponse("part1"),
				createMockJSONResponse("part2"),
				createMockJSONResponse("part3"),
			}, "\n"),

			expectError:  false,
			expectedData: "part1part2part3",
		},
		{
			name:        "invalid base64 in one segment",
			inputData:   createMockJSONResponse("valid") + "{\"result\": {\"data\":\"invalidbase64\"}}\n",
			expectError: true,
		},
		{
			name:        "invalid json in one segment",
			inputData:   createMockJSONResponse("valid") + "invalid json\n",
			expectError: true,
		},
		{
			name:         "empty data segment",
			inputData:    createMockJSONResponse(""),
			expectError:  false,
			expectedData: "",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			reader := strings.NewReader(tc.inputData)
			result, err := readFile(reader)

			if tc.expectError {
				assert.Error(t, err)
				return
			}

			assert.NoError(t, err)
			buf := new(bytes.Buffer)

			if result != nil {
				_, err = buf.ReadFrom(result)
				assert.NoError(t, err)
				assert.Equal(t, tc.expectedData, buf.String())
			} else {
				t.Errorf("result is nil")
			}
		})
	}
}

func createMockJSONResponse(data string) string {
	return fmt.Sprintf(`{"result": {"data": "%s"}}`, base64.StdEncoding.EncodeToString([]byte(data)))
}
