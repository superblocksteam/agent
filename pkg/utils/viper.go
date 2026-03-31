package utils

import (
	"errors"
	"strings"

	"github.com/spf13/viper"
)

// GetStringSlice wraps viper.GetStringSlice and correctly splits
// comma-separated values that come from environment variables.
// See https://github.com/spf13/viper/issues/380
func GetStringSlice(key string) []string {
	raw := viper.GetStringSlice(key)
	var result []string
	for _, s := range raw {
		for _, p := range strings.Split(s, ",") {
			if t := strings.TrimSpace(p); t != "" {
				result = append(result, t)
			}
		}
	}
	return result
}

func GetStringMapString(viperMap map[string]string, env string) (map[string]string, error) {
	if len(viperMap) > 0 {
		return viperMap, nil
	}

	if env == "" {
		return nil, nil
	}

	result := map[string]string{}

	for _, pair := range strings.Split(env, ",") {
		delimeter := strings.Index(pair, "=")

		if delimeter == -1 || delimeter == len(pair)-1 {
			return nil, errors.New("invalid signature keys format")
		}

		result[pair[:delimeter]] = pair[delimeter+1:]
	}

	return result, nil
}
