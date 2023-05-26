package utils

import (
	"crypto/sha256"
	"encoding/hex"
	"io/fs"
	"regexp"
	"strings"
)

var (
	videoRe = regexp.MustCompile(`(?i)/\.mov|\.mp4|\.webm|\.mvk|/gmi`)
)

func IsVideo(d fs.DirEntry) bool {
	return videoRe.MatchString(d.Name())
}

func IsValidEntry(d fs.DirEntry) bool {
	return !strings.HasPrefix(d.Name(), ".") &&
		!strings.HasSuffix(d.Name(), ".part") &&
		!strings.HasSuffix(d.Name(), ".ytdl")
}

func ShaSumString(path string) string {
	h := sha256.New()
	h.Write([]byte(path))
	return hex.EncodeToString(h.Sum(nil))
}
