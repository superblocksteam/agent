package sse

import (
	"bufio"
	"errors"
	"fmt"
	"io"
	"strings"

	"go.uber.org/zap"
)

var (
	ErrChoppedEvent = errors.New("chopped event")
	ErrGarbage      = errors.New("garbage")
)

type Event struct {
	Name string
	Data string
	Id   string
}

func Parse(log *zap.Logger, r io.Reader, events chan<- Event) error {
	log = log.Named("sse.Parse")

	scanner := bufio.NewScanner(r)
	var name, data, id, garbage strings.Builder

	for scanner.Scan() {
		l := scanner.Text()

		if l == "" { // empty line, new event
			if garbage.Len() > 0 {
				log.Warn("found garbage in SSE stream", zap.String("garbage", garbage.String()))
				garbage.Reset()
			}

			if name.Len() == 0 && data.Len() == 0 && id.Len() == 0 {
				continue
			}

			events <- Event{
				Name: name.String(),
				Data: data.String(),
				Id:   id.String(),
			}

			name.Reset()
			data.Reset()
			id.Reset()
			continue
		}

		if strings.HasPrefix(l, ":") {
			// comments, ignore
			continue
		}

		parts := strings.SplitN(l, ":", 2)
		field := parts[0]
		var value string
		if len(parts) > 1 {
			value = strings.TrimSpace(parts[1])
		}

		switch field {
		case "event":
			name.WriteString(value)
		case "data":
			if data.Len() > 0 {
				data.WriteByte('\n')
			}
			data.WriteString(value)
		case "id":
			id.WriteString(value)
		default:
			garbage.WriteString(l)
		}
	}

	var errs error
	if garbage.Len() != 0 {
		errs = errors.Join(errs, fmt.Errorf("%w: %q", ErrGarbage, garbage.String()))
	}
	if name.Len() != 0 || data.Len() != 0 || id.Len() != 0 {
		errs = errors.Join(errs, fmt.Errorf("%w: %#v", ErrChoppedEvent, Event{
			Name: name.String(),
			Data: data.String(),
			Id:   id.String(),
		}))
	}
	if errs != nil {
		return errs
	}

	if scanner.Err() != nil {
		return scanner.Err()
	}

	return nil
}
