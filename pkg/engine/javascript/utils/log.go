package utils

import (
	"io"
)

func Log(rw io.ReadWriter, message string) error {
	_, err := rw.Write([]byte(message))
	return err
}
