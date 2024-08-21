package utils

import (
	"errors"
	"sync"

	"github.com/pkoukk/tiktoken-go"
	"github.com/sashabaranov/go-openai"
)

var (
	// tokenizers is a map of model name to tokenizer pool.
	// This is used to avoid having to create a new tokenizer
	// for every request.
	tokenizers = map[string]*sync.Pool{
		openai.GPT432K: {
			New: func() any {
				tokenizer, err := tiktoken.EncodingForModel(openai.GPT432K)
				if err != nil {
					return nil
				}

				return tokenizer
			},
		},
		// TODO(frank): Handler other models.
	}
)

// Tokenize takes a prompt and returns the number of tokens.
// Because we don't know the model that will be used to generate
// the response, we hardcode the model to GPT4. This means that
// the number of tokens returned will be an approximation.
func Tokenize(prompt string) (int, error) {
	pool, ok := tokenizers[openai.GPT432K]
	if !ok {
		return 0, errors.New("could not get tokenizer pool")
	}

	tokenizer, ok := pool.Get().(*tiktoken.Tiktoken)
	if !ok {
		return 0, errors.New("could not get tokenizer from pool")
	}

	defer pool.Put(tokenizer)

	return len(tokenizer.Encode(prompt, nil, nil)), nil
}
