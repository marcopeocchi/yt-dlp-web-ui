package server

type DownloadProgress struct {
	Percentage string  `json:"percentage"`
	Speed      float32 `json:"speed"`
	ETA        int     `json:"eta"`
}

type DownloadInfo struct {
	URL        string `json:"url"`
	Title      string `json:"title"`
	Thumbnail  string `json:"thumbnail"`
	Resolution string `json:"resolution"`
	Size       int32  `json:"filesize_approx"`
	VCodec     string `json:"vcodec"`
	ACodec     string `json:"acodec"`
	Extension  string `json:"ext"`
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
	Url    string   `json:"url"`
	Params []string `json:"params"`
}
