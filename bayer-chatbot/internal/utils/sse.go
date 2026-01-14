package utils

import (
	"bufio"
	"io"
	"net/http"
)

// FlushWriter ensures each write is flushed for streaming responses.
// This helps with SSE passthrough.
type FlushWriter struct {
	w       http.ResponseWriter
	flusher http.Flusher
}

func NewFlushWriter(w http.ResponseWriter) *FlushWriter {
	fw := &FlushWriter{w: w}
	if f, ok := w.(http.Flusher); ok {
		fw.flusher = f
	}
	return fw
}

func (fw *FlushWriter) Write(p []byte) (int, error) {
	n, err := fw.w.Write(p)
	if fw.flusher != nil {
		fw.flusher.Flush()
	}
	return n, err
}

func CopyAndFlush(dst http.ResponseWriter, src io.Reader) error {
	bw := bufio.NewWriterSize(NewFlushWriter(dst), 32*1024)
	_, err := io.Copy(bw, src)
	_ = bw.Flush()
	return err
}
