package plugins

// InputMetadata is a metadata object that contains information about the input.
type InputMetadata struct {
	FieldName string
}

func (m *InputMetadata) GetFieldName() string {
	if m == nil {
		return ""
	}
	return m.FieldName
}

// Input is a struct that contains the data and metadata of an input.
type Input struct {
	Meta *InputMetadata
	Data string
}

// GetData returns the data of the input.
func (i *Input) GetData() string {
	if i == nil {
		return ""
	}
	return i.Data
}

// GetMeta returns the metadata of the input.
func (i *Input) GetMeta() *InputMetadata {
	if i == nil {
		return nil
	}
	return i.Meta
}
