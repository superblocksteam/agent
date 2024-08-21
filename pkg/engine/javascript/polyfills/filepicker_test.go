package polyfills

import (
	"bytes"
	"context"
	"errors"
	"os"

	b64 "encoding/base64"
	encoding "encoding/base64"

	"io"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/superblocksteam/agent/pkg/engine"
	"go.uber.org/zap"
	v8 "rogchap.com/v8go"
)

var (
	pdfBase64String = "JVBERi0xLjMNCiXi48/TDQoNCjEgMCBvYmoNCjw8DQovVHlwZSAvQ2F0YWxvZw0KL091dGxpbmVzIDIgMCBSDQovUGFnZXMgMyAwIFINCj4+DQplbmRvYmoNCg0KMiAwIG9iag0KPDwNCi9UeXBlIC9PdXRsaW5lcw0KL0NvdW50IDANCj4+DQplbmRvYmoNCg0KMyAwIG9iag0KPDwNCi9UeXBlIC9QYWdlcw0KL0NvdW50IDINCi9LaWRzIFsgNCAwIFIgNiAwIFIgXSANCj4+DQplbmRvYmoNCg0KNCAwIG9iag0KPDwNCi9UeXBlIC9QYWdlDQovUGFyZW50IDMgMCBSDQovUmVzb3VyY2VzIDw8DQovRm9udCA8PA0KL0YxIDkgMCBSIA0KPj4NCi9Qcm9jU2V0IDggMCBSDQo+Pg0KL01lZGlhQm94IFswIDAgNjEyLjAwMDAgNzkyLjAwMDBdDQovQ29udGVudHMgNSAwIFINCj4+DQplbmRvYmoNCg0KNSAwIG9iag0KPDwgL0xlbmd0aCAxMDc0ID4+DQpzdHJlYW0NCjIgSg0KQlQNCjAgMCAwIHJnDQovRjEgMDAyNyBUZg0KNTcuMzc1MCA3MjIuMjgwMCBUZA0KKCBBIFNpbXBsZSBQREYgRmlsZSApIFRqDQpFVA0KQlQNCi9GMSAwMDEwIFRmDQo2OS4yNTAwIDY4OC42MDgwIFRkDQooIFRoaXMgaXMgYSBzbWFsbCBkZW1vbnN0cmF0aW9uIC5wZGYgZmlsZSAtICkgVGoNCkVUDQpCVA0KL0YxIDAwMTAgVGYNCjY5LjI1MDAgNjY0LjcwNDAgVGQNCigganVzdCBmb3IgdXNlIGluIHRoZSBWaXJ0dWFsIE1lY2hhbmljcyB0dXRvcmlhbHMuIE1vcmUgdGV4dC4gQW5kIG1vcmUgKSBUag0KRVQNCkJUDQovRjEgMDAxMCBUZg0KNjkuMjUwMCA2NTIuNzUyMCBUZA0KKCB0ZXh0LiBBbmQgbW9yZSB0ZXh0LiBBbmQgbW9yZSB0ZXh0LiBBbmQgbW9yZSB0ZXh0LiApIFRqDQpFVA0KQlQNCi9GMSAwMDEwIFRmDQo2OS4yNTAwIDYyOC44NDgwIFRkDQooIEFuZCBtb3JlIHRleHQuIEFuZCBtb3JlIHRleHQuIEFuZCBtb3JlIHRleHQuIEFuZCBtb3JlIHRleHQuIEFuZCBtb3JlICkgVGoNCkVUDQpCVA0KL0YxIDAwMTAgVGYNCjY5LjI1MDAgNjE2Ljg5NjAgVGQNCiggdGV4dC4gQW5kIG1vcmUgdGV4dC4gQm9yaW5nLCB6enp6ei4gQW5kIG1vcmUgdGV4dC4gQW5kIG1vcmUgdGV4dC4gQW5kICkgVGoNCkVUDQpCVA0KL0YxIDAwMTAgVGYNCjY5LjI1MDAgNjA0Ljk0NDAgVGQNCiggbW9yZSB0ZXh0LiBBbmQgbW9yZSB0ZXh0LiBBbmQgbW9yZSB0ZXh0LiBBbmQgbW9yZSB0ZXh0LiBBbmQgbW9yZSB0ZXh0LiApIFRqDQpFVA0KQlQNCi9GMSAwMDEwIFRmDQo2OS4yNTAwIDU5Mi45OTIwIFRkDQooIEFuZCBtb3JlIHRleHQuIEFuZCBtb3JlIHRleHQuICkgVGoNCkVUDQpCVA0KL0YxIDAwMTAgVGYNCjY5LjI1MDAgNTY5LjA4ODAgVGQNCiggQW5kIG1vcmUgdGV4dC4gQW5kIG1vcmUgdGV4dC4gQW5kIG1vcmUgdGV4dC4gQW5kIG1vcmUgdGV4dC4gQW5kIG1vcmUgKSBUag0KRVQNCkJUDQovRjEgMDAxMCBUZg0KNjkuMjUwMCA1NTcuMTM2MCBUZA0KKCB0ZXh0LiBBbmQgbW9yZSB0ZXh0LiBBbmQgbW9yZSB0ZXh0LiBFdmVuIG1vcmUuIENvbnRpbnVlZCBvbiBwYWdlIDIgLi4uKSBUag0KRVQNCmVuZHN0cmVhbQ0KZW5kb2JqDQoNCjYgMCBvYmoNCjw8DQovVHlwZSAvUGFnZQ0KL1BhcmVudCAzIDAgUg0KL1Jlc291cmNlcyA8PA0KL0ZvbnQgPDwNCi9GMSA5IDAgUiANCj4+DQovUHJvY1NldCA4IDAgUg0KPj4NCi9NZWRpYUJveCBbMCAwIDYxMi4wMDAwIDc5Mi4wMDAwXQ0KL0NvbnRlbnRzIDcgMCBSDQo+Pg0KZW5kb2JqDQoNCjcgMCBvYmoNCjw8IC9MZW5ndGggNjc2ID4+DQpzdHJlYW0NCjIgSg0KQlQNCjAgMCAwIHJnDQovRjEgMDAyNyBUZg0KNTcuMzc1MCA3MjIuMjgwMCBUZA0KKCBTaW1wbGUgUERGIEZpbGUgMiApIFRqDQpFVA0KQlQNCi9GMSAwMDEwIFRmDQo2OS4yNTAwIDY4OC42MDgwIFRkDQooIC4uLmNvbnRpbnVlZCBmcm9tIHBhZ2UgMS4gWWV0IG1vcmUgdGV4dC4gQW5kIG1vcmUgdGV4dC4gQW5kIG1vcmUgdGV4dC4gKSBUag0KRVQNCkJUDQovRjEgMDAxMCBUZg0KNjkuMjUwMCA2NzYuNjU2MCBUZA0KKCBBbmQgbW9yZSB0ZXh0LiBBbmQgbW9yZSB0ZXh0LiBBbmQgbW9yZSB0ZXh0LiBBbmQgbW9yZSB0ZXh0LiBBbmQgbW9yZSApIFRqDQpFVA0KQlQNCi9GMSAwMDEwIFRmDQo2OS4yNTAwIDY2NC43MDQwIFRkDQooIHRleHQuIE9oLCBob3cgYm9yaW5nIHR5cGluZyB0aGlzIHN0dWZmLiBCdXQgbm90IGFzIGJvcmluZyBhcyB3YXRjaGluZyApIFRqDQpFVA0KQlQNCi9GMSAwMDEwIFRmDQo2OS4yNTAwIDY1Mi43NTIwIFRkDQooIHBhaW50IGRyeS4gQW5kIG1vcmUgdGV4dC4gQW5kIG1vcmUgdGV4dC4gQW5kIG1vcmUgdGV4dC4gQW5kIG1vcmUgdGV4dC4gKSBUag0KRVQNCkJUDQovRjEgMDAxMCBUZg0KNjkuMjUwMCA2NDAuODAwMCBUZA0KKCBCb3JpbmcuICBNb3JlLCBhIGxpdHRsZSBtb3JlIHRleHQuIFRoZSBlbmQsIGFuZCBqdXN0IGFzIHdlbGwuICkgVGoNCkVUDQplbmRzdHJlYW0NCmVuZG9iag0KDQo4IDAgb2JqDQpbL1BERiAvVGV4dF0NCmVuZG9iag0KDQo5IDAgb2JqDQo8PA0KL1R5cGUgL0ZvbnQNCi9TdWJ0eXBlIC9UeXBlMQ0KL05hbWUgL0YxDQovQmFzZUZvbnQgL0hlbHZldGljYQ0KL0VuY29kaW5nIC9XaW5BbnNpRW5jb2RpbmcNCj4+DQplbmRvYmoNCg0KMTAgMCBvYmoNCjw8DQovQ3JlYXRvciAoUmF2ZSBcKGh0dHA6Ly93d3cubmV2cm9uYS5jb20vcmF2ZVwpKQ0KL1Byb2R1Y2VyIChOZXZyb25hIERlc2lnbnMpDQovQ3JlYXRpb25EYXRlIChEOjIwMDYwMzAxMDcyODI2KQ0KPj4NCmVuZG9iag0KDQp4cmVmDQowIDExDQowMDAwMDAwMDAwIDY1NTM1IGYNCjAwMDAwMDAwMTkgMDAwMDAgbg0KMDAwMDAwMDA5MyAwMDAwMCBuDQowMDAwMDAwMTQ3IDAwMDAwIG4NCjAwMDAwMDAyMjIgMDAwMDAgbg0KMDAwMDAwMDM5MCAwMDAwMCBuDQowMDAwMDAxNTIyIDAwMDAwIG4NCjAwMDAwMDE2OTAgMDAwMDAgbg0KMDAwMDAwMjQyMyAwMDAwMCBuDQowMDAwMDAyNDU2IDAwMDAwIG4NCjAwMDAwMDI1NzQgMDAwMDAgbg0KDQp0cmFpbGVyDQo8PA0KL1NpemUgMTENCi9Sb290IDEgMCBSDQovSW5mbyAxMCAwIFINCj4+DQoNCnN0YXJ0eHJlZg0KMjcxNA0KJSVFT0YNCg=="
)

func loadFileToBuffer(filePath string) []byte {
	file, err := os.Open(filePath)
	if err != nil {
		panic(err)
	}
	defer file.Close()

	buf := new(bytes.Buffer)
	_, err = io.Copy(buf, file)
	if err != nil {
		panic(err)
	}

	return buf.Bytes()
}

func loadFileToRawString(path string) string {
	data, err := os.ReadFile(path)
	if err != nil {
		panic(err)
	}
	return string(data)
}

func TestSerialize(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name        string
		buffer      []byte
		mode        string
		expected    string
		expectedErr error
	}{
		{
			name:        "Binary PDF - Text Mode",
			buffer:      loadFileToBuffer("../../../../test/data/test.pdf"),
			mode:        "text",
			expectedErr: errors.New("file is binary and cannot be converted to text"),
		},
		{
			name:     "Binary PDF - Binary Mode",
			buffer:   loadFileToBuffer("../../../../test/data/test.pdf"),
			mode:     "binary",
			expected: pdfBase64String,
		},
		{
			name:     "Binary PDF - Raw Mode",
			buffer:   loadFileToBuffer("../../../../test/data/test.pdf"),
			mode:     "raw",
			expected: loadFileToRawString("../../../../test/data/test.pdf"),
		},
		{
			name:     "Binary PDF - Default Mode",
			buffer:   loadFileToBuffer("../../../../test/data/test.pdf"),
			mode:     "im_a_default_mode",
			expected: pdfBase64String,
		},
		{
			name:        "Binary Data - Text Mode Error",
			buffer:      []byte{0x00, 0x01, 0xff},
			mode:        "text",
			expected:    "",
			expectedErr: errors.New("file is binary and cannot be converted to text"),
		},
		{
			name:     "Binary Data - Auto Mode",
			buffer:   []byte{0x00, 0x01, 0xff},
			mode:     "auto",
			expected: encoding.StdEncoding.EncodeToString([]byte{0x00, 0x01, 0xff}),
		},
		{
			name:     "Large Buffer - Binary Mode",
			buffer:   make([]byte, 2048),
			mode:     "binary",
			expected: encoding.StdEncoding.EncodeToString(make([]byte, 2048)),
		},
		{
			name:     "Text with Special Chars - Auto Mode",
			buffer:   []byte("Hello\nWorld\x1B"),
			mode:     "auto",
			expected: "Hello\nWorld\x1B",
		},
		{
			name:     "Raw Mode with Text",
			buffer:   []byte("Raw mode text"),
			mode:     "raw",
			expected: "Raw mode text",
		},
		{
			name:     "Raw Mode with Binary",
			buffer:   []byte{0x01, 0x02, 0x03},
			mode:     "raw",
			expected: "\x01\x02\x03",
		},
		{
			name:     "Text with 0x7F Character - Auto Mode",
			buffer:   []byte("Hello\x7FWorld"),
			mode:     "auto",
			expected: encoding.StdEncoding.EncodeToString([]byte("Hello\x7FWorld")),
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			result, err := serialize(tc.buffer, tc.mode)

			if tc.expectedErr != nil {
				assert.EqualError(t, err, tc.expectedErr.Error())
				assert.Equal(t, tc.expected, result)
			} else {
				assert.Nil(t, err)
				assert.Equal(t, tc.expected, result)
			}
		})
	}
}

func TestInjectFilepicker(t *testing.T) {
	t.Parallel()

	for _, test := range []struct {
		name              string
		functionName      string
		inputParams       []any
		getFileFuncReturn string
		expectedResult    string
		expectedError     error
	}{
		{
			name:              "filepicker not async",
			functionName:      "readContents",
			inputParams:       []any{"", "", false},
			getFileFuncReturn: "foo",
			expectedResult:    "foo",
			expectedError:     nil,
		},
		{
			name:              "filepicker async",
			functionName:      "readContents",
			inputParams:       []any{"", "", true},
			getFileFuncReturn: "foo",
			expectedResult:    "[object Promise]",
			expectedError:     nil,
		},
		{
			name:              "filepicker raw mode",
			functionName:      "readContents",
			inputParams:       []any{"", "raw", false},
			getFileFuncReturn: "foo",
			expectedResult:    "foo",
			expectedError:     nil,
		},
		{
			name:              "filepicker text mode",
			functionName:      "readContents",
			inputParams:       []any{"", "text", false},
			getFileFuncReturn: "foo",
			expectedResult:    "foo",
			expectedError:     nil,
		},
		{
			name:              "filepicker binary mode",
			functionName:      "readContents",
			inputParams:       []any{"", "binary", false},
			getFileFuncReturn: "foo",
			expectedResult:    "Zm9v",
			expectedError:     nil,
		},
		{
			name:              "filepicker with large file",
			functionName:      "readContents",
			inputParams:       []any{"", "binary", false},
			getFileFuncReturn: strings.Repeat("a", 5*1024*1024),
			expectedResult:    b64.StdEncoding.EncodeToString([]byte(strings.Repeat("a", 5*1024*1024))),
			expectedError:     nil,
		},
		{
			name:              "invalid arg length",
			functionName:      "readContents",
			inputParams:       []any{},
			getFileFuncReturn: "foo",
			expectedResult:    "foo",
			expectedError:     &v8.JSError{Message: "InternalError", Location: "undefined:0:0"},
		},
		{
			name:              "path isnt string",
			functionName:      "readContents",
			inputParams:       []any{true, "", ""},
			getFileFuncReturn: "foo",
			expectedResult:    "foo",
			expectedError:     &v8.JSError{Message: "InternalError", Location: "undefined:0:0"},
		},
		{
			name:              "mode isnt string",
			functionName:      "readContents",
			inputParams:       []any{"", true, ""},
			getFileFuncReturn: "foo",
			expectedResult:    "foo",
			expectedError:     &v8.JSError{Message: "mode must be a string", Location: "undefined:0:0"},
		},
		{
			name:              "async param isnt bool",
			functionName:      "readContents",
			inputParams:       []any{"", "", ""},
			getFileFuncReturn: "foo",
			expectedResult:    "foo",
			expectedError:     &v8.JSError{Message: "InternalError", Location: "undefined:0:0"}},
	} {

		t.Run(test.name, func(t *testing.T) {
			getFileFunc := func(ctx context.Context, path string) (io.Reader, error) {
				return strings.NewReader(test.getFileFuncReturn), nil
			}

			polyfillFunc := func() Polyfill {
				return FilePicker(test.functionName, getFileFunc, zap.NewNop(), &engine.Console{
					Stderr: &bytes.Buffer{},
					Stdout: &bytes.Buffer{},
				})
			}

			result, err := injectAndCallPolyfillFunction(polyfillFunc, test.functionName, test.inputParams)
			assert.Equal(t, test.expectedError, err)

			if result != nil {
				assert.Equal(t, test.expectedResult, result.String())
			}
		})
	}
}
