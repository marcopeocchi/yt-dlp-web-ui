package middlewares

import (
	"fmt"
	"io"
	"io/fs"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

type SpaHandler struct {
	Entrypoint string
	Filesystem fs.FS
	routes     []string
}

func NewSpaHandler(index string, fs fs.FS) *SpaHandler {
	return &SpaHandler{
		Entrypoint: index,
		Filesystem: fs,
	}
}

func (s *SpaHandler) AddClientRoute(route string) *SpaHandler {
	s.routes = append(s.routes, route)
	return s
}

// Handler for serving a compiled react frontend
// each client-side routes must be provided
func (s *SpaHandler) Handler() http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(
				w,
				http.StatusText(http.StatusMethodNotAllowed),
				http.StatusMethodNotAllowed,
			)
			return
		}

		path := filepath.Clean(r.URL.Path)

		// basically all frontend routes are needed :/
		hasRoute := false
		for _, route := range s.routes {
			hasRoute = strings.HasPrefix(path, route)
			if hasRoute {
				break
			}
		}

		if path == "/" || hasRoute {
			path = s.Entrypoint
		}

		path = strings.TrimPrefix(path, "/")

		file, err := s.Filesystem.Open(path)

		if err != nil {
			if os.IsNotExist(err) {
				http.NotFound(w, r)
				return
			}
			http.Error(
				w,
				http.StatusText(http.StatusInternalServerError),
				http.StatusInternalServerError,
			)
			return
		}

		contentType := mime.TypeByExtension(filepath.Ext(path))
		w.Header().Set("Content-Type", contentType)

		if strings.HasPrefix(path, "assets/") {
			w.Header().Set("Cache-Control", "public, max-age=2592000")
		}

		stat, err := file.Stat()
		if err == nil && stat.Size() > 0 {
			w.Header().Set("Content-Length", fmt.Sprintf("%d", stat.Size()))
		}

		w.WriteHeader(http.StatusOK)

		io.Copy(w, file)
	})
}
