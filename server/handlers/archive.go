package handlers

import (
	"encoding/base64"
	"encoding/json"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/marcopeocchi/yt-dlp-web-ui/server/config"
	"github.com/marcopeocchi/yt-dlp-web-ui/server/utils"
)

type DirectoryEntry struct {
	Name        string    `json:"name"`
	Path        string    `json:"path"`
	Size        int64     `json:"size"`
	SHASum      string    `json:"shaSum"`
	ModTime     time.Time `json:"modTime"`
	IsVideo     bool      `json:"isVideo"`
	IsDirectory bool      `json:"isDirectory"`
}

func walkDir(root string) (*[]DirectoryEntry, error) {
	dirs, err := os.ReadDir(root)
	if err != nil {
		return nil, err
	}

	var validEntries int

	for _, d := range dirs {
		if utils.IsValidEntry(d) {
			validEntries++
		}
	}

	files := make([]DirectoryEntry, validEntries+1)

	for i, d := range dirs {
		if !utils.IsValidEntry(d) {
			continue
		}

		path := filepath.Join(root, d.Name())

		info, err := d.Info()
		if err != nil {
			return nil, err
		}

		files[i] = DirectoryEntry{
			Path:        path,
			Name:        d.Name(),
			Size:        info.Size(),
			SHASum:      utils.ShaSumString(path),
			IsVideo:     utils.IsVideo(d),
			IsDirectory: d.IsDir(),
			ModTime:     info.ModTime(),
		}
	}

	return &files, err
}

type ListRequest struct {
	SubDir  string `json:"subdir"`
	OrderBy string `json:"orderBy"`
}

func ListDownloaded(w http.ResponseWriter, r *http.Request) {
	root := config.Instance().DownloadPath
	req := new(ListRequest)

	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	files, err := walkDir(filepath.Join(root, req.SubDir))
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if req.OrderBy == "modtime" {
		sort.SliceStable(*files, func(i, j int) bool {
			return (*files)[i].ModTime.After((*files)[j].ModTime)
		})
	}

	w.WriteHeader(http.StatusOK)
	err = json.NewEncoder(w).Encode(files)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

type DeleteRequest = DirectoryEntry

func DeleteFile(w http.ResponseWriter, r *http.Request) {
	req := new(DeleteRequest)

	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	sum := utils.ShaSumString(req.Path)
	if sum != req.SHASum {
		http.Error(w, "shasum mismatch", http.StatusBadRequest)
		return
	}

	err = os.Remove(req.Path)
	if err != nil {
		http.Error(w, "shasum mismatch", http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode("ok")
}

func SendFile(w http.ResponseWriter, r *http.Request) {
	path := chi.URLParam(r, "id")

	if path == "" {
		http.Error(w, "inexistent path", http.StatusBadRequest)
		return
	}

	path, err := url.QueryUnescape(path)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	decoded, err := base64.StdEncoding.DecodeString(path)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	filename := string(decoded)

	root := config.Instance().DownloadPath

	// TODO: further path / file validations
	if strings.Contains(filepath.Dir(filename), root) {
		w.Header().Add(
			"Content-Disposition",
			"inline; filename="+filepath.Base(filename),
		)

		http.ServeFile(w, r, filename)
	}

	w.WriteHeader(http.StatusUnauthorized)
}
