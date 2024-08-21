package plugins

type Scanner interface {
	Scan() bool
	Text() string
	Value() string
}
