package store

import (
	"fmt"

	"github.com/superblocksteam/agent/pkg/utils"
)

func Key(prefix, _ string) (string, error) {
	var random string
	{
		id, err := utils.UUID()
		if err != nil {
			return "", err
		} else {
			random = id
		}
	}
	return fmt.Sprintf("%s.%s", prefix, random), nil
}
