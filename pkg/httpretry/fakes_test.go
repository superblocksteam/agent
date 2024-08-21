package httpretry

import (
	"net/http"
	"sync"
)

type fakeRoundTripper struct {
	mu   sync.Mutex
	err  error
	resp *http.Response
}

func newFakeRoundTripper() *fakeRoundTripper {
	return &fakeRoundTripper{
		resp: &http.Response{
			StatusCode: http.StatusOK,
			Header:     http.Header{},
		},
	}
}

func (f *fakeRoundTripper) RoundTrip(req *http.Request) (*http.Response, error) {
	f.mu.Lock()
	defer f.mu.Unlock()

	if f.err != nil {
		return nil, f.err
	}

	return f.resp, nil
}

func (f *fakeRoundTripper) SetErr(err error) {
	f.mu.Lock()
	defer f.mu.Unlock()

	f.err = err
}

func (f *fakeRoundTripper) SetStatusCode(code int) {
	f.mu.Lock()
	defer f.mu.Unlock()

	f.resp.StatusCode = code
}

var _ ErrorRetriable = &fakeError{}

type fakeError struct {
	temporary bool
	timeout   bool
}

func (f *fakeError) Error() string {
	return "fake-network-error"
}

func (f *fakeError) Temporary() bool {
	return f.temporary
}

func (f *fakeError) Timeout() bool {
	return f.timeout
}
