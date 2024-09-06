package internal

import "time"

// Used to unmarshall yt-dlp progress
type ProgressTemplate struct {
	Percentage string  `json:"percentage"`
	Speed      float32 `json:"speed"`
	Size       string  `json:"size"`
	Eta        float32 `json:"eta"`
}

// Defines where and how the download needs to be saved
type DownloadOutput struct {
	Path          string
	Filename      string
	SavedFilePath string `json:"savedFilePath"`
}

// Progress for the Running call
type DownloadProgress struct {
	Status     int     `json:"process_status"`
	Percentage string  `json:"percentage"`
	Speed      float32 `json:"speed"`
	ETA        float32 `json:"eta"`
}

// Used to deser the yt-dlp -J output
type DownloadInfo struct {
	URL         string    `json:"url"`
	Title       string    `json:"title"`
	Thumbnail   string    `json:"thumbnail"`
	Resolution  string    `json:"resolution"`
	Size        int32     `json:"filesize_approx"`
	VCodec      string    `json:"vcodec"`
	ACodec      string    `json:"acodec"`
	Extension   string    `json:"ext"`
	OriginalURL string    `json:"original_url"`
	FileName    string    `json:"filename"`
	CreatedAt   time.Time `json:"created_at"`
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
	Language    string  `json:"language"`
}

// struct representing the response sent to the client
// as JSON-RPC result field
type ProcessResponse struct {
	Id       string           `json:"id"`
	Progress DownloadProgress `json:"progress"`
	Info     DownloadInfo     `json:"info"`
	Output   DownloadOutput   `json:"output"`
	Params   []string         `json:"params"`
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
	Id     string
	URL    string   `json:"url"`
	Path   string   `json:"path"`
	Rename string   `json:"rename"`
	Params []string `json:"params"`
}

// struct representing request of creating a netscape cookies file
type SetCookiesRequest struct {
	Cookies string `json:"cookies"`
}

// represents a user defined collection of yt-dlp arguments
type CustomTemplate struct {
	Id      string `json:"id"`
	Name    string `json:"name"`
	Content string `json:"content"`
}
