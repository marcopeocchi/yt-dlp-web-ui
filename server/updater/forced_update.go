package updater

import (
	"io"
	"log"
	"net/http"

	"github.com/goccy/go-json"
)

const (
	gitHubAPILatest   = "https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest"
	gitHubAPIDownload = "https://api.github.com/repos/yt-dlp/yt-dlp/releases/download"
)

var (
	client = &http.Client{
		CheckRedirect: http.DefaultClient.CheckRedirect,
	}
)

func getLatestReleaseTag() (string, error) {
	res, err := client.Get(gitHubAPILatest)
	if err != nil {
		log.Println("Cannot get release tag from GitHub API")
		return "", err
	}
	defer res.Body.Close()

	body, err := io.ReadAll(res.Body)

	if err != nil {
		log.Println("Cannot parse response from GitHub API")
		return "", err
	}

	tag := ReleaseLatestResponse{}
	json.Unmarshal(body, &tag)

	return tag.TagName, nil
}

func ForceUpdate() {
	getLatestReleaseTag()
}
