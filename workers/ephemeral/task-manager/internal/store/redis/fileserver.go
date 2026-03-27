package redis

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
)

// FetchFileFromServer retrieves file contents from the orchestrator's file
// server. It is used by both the FetchFile gRPC handler (for sandbox
// readContentsAsync) and the integration executor (for lazy-loading uploaded
// file buffers during nested integration calls).
func FetchFileFromServer(ctx context.Context, fileServerURL, agentKey, remotePath string) ([]byte, error) {
	reqURL := fmt.Sprintf("%s?location=%s", fileServerURL, remotePath)

	req, err := http.NewRequestWithContext(ctx, "GET", reqURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	sanitizedKey := strings.ReplaceAll(agentKey, "/", "__")
	sanitizedKey = strings.ReplaceAll(sanitizedKey, "+", "--")
	req.Header.Set("x-superblocks-agent-key", sanitizedKey)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch file: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("file server returned status %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if strings.Contains(fileServerURL, "v2") {
		return parseV2FileResponse(body)
	}

	return body, nil
}

func parseV2FileResponse(body []byte) ([]byte, error) {
	lines := strings.Split(string(body), "\n")
	var result []byte

	for _, line := range lines {
		if line == "" {
			continue
		}

		var obj struct {
			Result struct {
				Data string `json:"data"`
			} `json:"result"`
		}

		if err := json.Unmarshal([]byte(line), &obj); err != nil {
			continue
		}

		decoded, err := base64.StdEncoding.DecodeString(obj.Result.Data)
		if err != nil {
			continue
		}

		result = append(result, decoded...)
	}

	return result, nil
}
