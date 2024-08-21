package ratelimit

import "strconv"

func intToString(number int) string {
	return strconv.Itoa(number)
}

func int64ToString(number int64) string {
	return strconv.FormatInt(number, 10)
}

func stringToInt64(str string) (int64, error) {
	number, err := strconv.ParseInt(str, 10, 64)
	if err != nil {
		return 0, err
	}
	return number, nil
}

func getInt64(data any, fallback int64) int64 {
	if data == nil {
		return fallback
	}

	str, ok := data.(string)
	if !ok {
		return fallback
	}

	parsed, err := stringToInt64(str)
	if err != nil {
		return fallback
	}

	return parsed
}
