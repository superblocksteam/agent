package utils

import (
	"errors"
	"strings"
)

func GetStringMapString(viper map[string]string, env string) (map[string]string, error) {
	if len(viper) > 0 {
		return viper, nil
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
