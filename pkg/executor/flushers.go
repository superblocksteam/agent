package executor

import (
	"bytes"
	"fmt"

	sberrors "github.com/superblocksteam/agent/pkg/errors"
	"github.com/superblocksteam/agent/pkg/utils"
)

type Flusher func(*bytes.Buffer, func() (*string, int, error)) error

var ArrayFlusher Flusher = func(buf *bytes.Buffer, next func() (*string, int, error)) error {
	if _, err := buf.WriteString(`{"output": [`); err != nil {
		return err
	}

	for {
		item, _, err := next()
		if err != nil {
			return err
		}
		if item == nil {
			break
		}

		if _, err := buf.WriteString(*item); err != nil {
			return err
		}
	}

	if _, err := buf.WriteString("]}"); err != nil {
		return err
	}

	return nil
}

var ObjectFlusher = func(keys utils.List[string]) Flusher {
	return func(buf *bytes.Buffer, next func() (*string, int, error)) error {
		if _, err := buf.WriteString(`{"output": {`); err != nil {
			return err
		}

		for {
			item, idx, err := next()
			if err != nil {
				return err
			}
			if item == nil {
				break
			}

			path, ok := keys.Get(idx)
			if !ok {
				return sberrors.ErrInternal
			}

			if _, err := buf.WriteString(fmt.Sprintf(`"%s": %s`, path, *item)); err != nil {
				return err
			}
		}

		if _, err := buf.WriteString("}}"); err != nil {
			return err
		}

		return nil
	}
}
