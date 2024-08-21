package javascript

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"io"

	apiv1 "github.com/superblocksteam/agent/types/gen/go/api/v1"
)

// TODO(frank): Mutate the transport request so that we can use a gRPC client.
func readFile(body io.Reader) (io.Reader, error) {
	result := bytes.Buffer{}
	scanner := bufio.NewScanner(body)

	for scanner.Scan() {
		// NOTE(frank): Figure out why this is wrapped in the gRPC response.
		type wrapped struct {
			Result *apiv1.DownloadResponse `json:"result"`
		}

		var obj wrapped
		{
			// NOTE(frank): This for some reason does a base64 decode.
			if err := json.Unmarshal(scanner.Bytes(), &obj); err != nil {
				return nil, fmt.Errorf("could not unmarshal file segment: %s", err.Error())
			}
		}

		result.Write(obj.Result.GetData())
	}

	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("error reading file stream: %w", err)
	}

	return &result, nil
}
