package v1

func (e *Error) Error() string {
	return e.GetMessage()
}
