package utils

type Iterator[K any] interface {
	HasNext() bool
	Next() (string, K)
}
