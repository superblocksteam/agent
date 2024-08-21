package v1

func (x *Metadata_Minified) Tags() (map[string][]byte, error) {
	data := make(map[string][]byte)

	for _, name := range x.Topics {
		data[name] = []byte(name)
	}

	return data, nil
}

func (x *Metadata) Minify() (any, error) {
	minified := &Metadata_Minified{}

	for _, topic := range x.Topics {
		minified.Topics = append(minified.Topics, topic.Name)
	}

	return minified, nil
}
