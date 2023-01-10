package sys

import (
	"os"

	"golang.org/x/sys/unix"
)

// package containing fs related operation (unix only)

// FreeSpace gets the available Bytes writable to download directory
func FreeSpace() (uint64, error) {
	var stat unix.Statfs_t
	wd, err := os.Getwd()
	if err != nil {
		return 0, err
	}
	unix.Statfs(wd+"/downloads", &stat)
	return (stat.Bavail * uint64(stat.Bsize)), nil
}
