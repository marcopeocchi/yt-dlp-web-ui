package internal

import "time"

// Progress for the Running call
type DownloadProgress struct {
	Status     int     `json:"process_status"`
	Percentage string  `json:"percentage"`
	Speed      float32 `json:"speed"`
	ETA        int     `json:"eta"`
}

// Used to deser the yt-dlp -J output
type DownloadInfo struct {
	URL        string    `json:"url"`
	Title      string    `json:"title"`
	Thumbnail  string    `json:"thumbnail"`
	Resolution string    `json:"resolution"`
	Size       int32     `json:"filesize_approx"`
	VCodec     string    `json:"vcodec"`
	ACodec     string    `json:"acodec"`
	Extension  string    `json:"ext"`
	CreatedAt  time.Time `json:"created_at"`
}

// Used to deser the formats in the -J output
type DownloadFormats struct {
	Formats   []Format `json:"formats"`
	Best      Format   `json:"best"`
	Thumbnail string   `json:"thumbnail"`
	Title     string   `json:"title"`
	URL       string   `json:"url"`
}

// A skimmed yt-dlp format node
type Format struct {
	Format_id   string  `json:"format_id"`
	Format_note string  `json:"format_note"`
	FPS         float32 `json:"fps"`
	Resolution  string  `json:"resolution"`
	VCodec      string  `json:"vcodec"`
	ACodec      string  `json:"acodec"`
	Size        float32 `json:"filesize_approx"`
}

// struct representing the response sent to the client
// as JSON-RPC result field
type ProcessResponse struct {
	Id       string           `json:"id"`
	Progress DownloadProgress `json:"progress"`
	Info     DownloadInfo     `json:"info"`
}

// struct representing the current status of the memoryDB
// used for serializaton/persistence reasons
type Session struct {
	Processes []ProcessResponse `json:"processes"`
}

// struct representing the intent to stop a specific process
type AbortRequest struct {
	Id string `json:"id"`
}

// struct representing the intent to start a download
type DownloadRequest struct {
	Url      string   `json:"url"`
	Params   []string `json:"params"`
	RenameTo string   `json:"renameTo"`
	Id       string
	URL      string
	Path     string
	Rename   string
}
