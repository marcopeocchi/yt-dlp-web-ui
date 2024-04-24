package logging

import (
	"compress/gzip"
	"io"
	"os"
	"sync"
	"time"
)

/*
	File base logger with log-rotate capabilities.
	The rotate process must be initiated from an external goroutine.

	After rotation the previous logs file are compressed with gzip algorithm.

	The rotated log follows this naming: [filename].UTC time.gz
*/

// implements io.Writer interface
type LogRotateWriter struct {
	mu       sync.Mutex
	fd       *os.File
	filename string
}

func NewRotableLogger(filename string) (*LogRotateWriter, error) {
	fd, err := os.Create(filename)
	if err != nil {
		return nil, err
	}
	w := &LogRotateWriter{filename: filename, fd: fd}
	return w, nil
}

func (w *LogRotateWriter) Write(b []byte) (int, error) {
	w.mu.Lock()
	defer w.mu.Unlock()
	return w.fd.Write(b)
}

func (w *LogRotateWriter) Rotate() error {
	var err error
	w.mu.Lock()

	gzFile, err := os.Create(w.filename + "." + time.Now().Format(time.RFC3339) + ".gz")
	if err != nil {
		return err
	}

	data, err := io.ReadAll(w.fd)
	if err != nil {
		return err
	}

	defer func() {
		w.mu.Unlock()
		w.gzipLog(gzFile, &data)
	}()

	_, err = os.Stat(w.filename)
	if err != nil {
		return err
	}

	if w.fd != nil {
		err = w.fd.Close()
		w.fd = nil
		if err != nil {
			return err
		}
	}

	err = os.Remove(w.filename)
	if err != nil {
		return err
	}

	w.fd, err = os.Create(w.filename)
	return err
}

func (w *LogRotateWriter) gzipLog(wr io.Writer, data *[]byte) error {
	if _, err := gzip.NewWriter(wr).Write(*data); err != nil {
		return err
	}

	return nil
}
