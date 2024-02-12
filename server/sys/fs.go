package sys

import (
	"os"
	"path/filepath"

	"github.com/marcopeocchi/yt-dlp-web-ui/server/config"
	"github.com/marcopeocchi/yt-dlp-web-ui/server/internal"
	"golang.org/x/sys/unix"
)

// package containing fs related operation (unix only)

// FreeSpace gets the available Bytes writable to download directory
func FreeSpace() (uint64, error) {
	var stat unix.Statfs_t
	unix.Statfs(config.Instance().DownloadPath, &stat)
	return (stat.Bavail * uint64(stat.Bsize)), nil
}

type FSNode struct {
	path     string
	children []FSNode
}

// Build a directory tree started from the specified path using DFS.
// Then return the flattened tree represented as a list.
func DirectoryTree() (*internal.Stack[FSNode], error) {
	rootPath := config.Instance().DownloadPath

	stack := internal.NewStack[FSNode]()

	stack.Push(FSNode{path: rootPath})

	for stack.IsNotEmpty() {
		current := stack.Pop()
		children, err := os.ReadDir(current.path)
		if err != nil {
			return nil, err
		}
		for _, entry := range children {
			childPath := filepath.Join(current.path, entry.Name())
			childNode := FSNode{path: childPath}

			if entry.IsDir() {
				current.children = append(current.children, childNode)
				stack.Push(childNode)
			}
		}
	}
	return stack, nil
}
