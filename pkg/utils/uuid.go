package utils

import (
	uuid "github.com/gofrs/uuid/v5"
)

func UUID() (string, error) {
	val, err := uuid.NewV7()
	if err != nil {
		return "", err
	}

	return val.String(), nil
}
