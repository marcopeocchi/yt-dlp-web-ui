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
	unix.Statfs(config.Instance().GetConfig().DownloadPath, &stat)
	return (stat.Bavail * uint64(stat.Bsize)), nil
}

// Build a directory tree started from the specified path using DFS.
// Then return the flattened tree represented as a list.
func DirectoryTree() (*[]string, error) {
	type Node struct {
		path     string
		children []Node
	}

	rootPath := config.Instance().GetConfig().DownloadPath

	stack := internal.Stack[Node]{
		Nodes: make([]*internal.Node[Node], 5),
	}
	flattened := make([]string, 0)

	root := Node{path: rootPath}
	stack.Push(&internal.Node[Node]{
		Value: root,
	})
	flattened = append(flattened, rootPath)

	for stack.IsNotEmpty() {
		current := stack.Pop().Value
		children, err := os.ReadDir(current.path)
		if err != nil {
			return nil, err
		}
		for _, entry := range children {
			childPath := filepath.Join(current.path, entry.Name())
			childNode := Node{path: childPath}

			if entry.IsDir() {
				current.children = append(current.children, childNode)
				stack.Push(&internal.Node[Node]{
					Value: childNode,
				})
				flattened = append(flattened, childNode.path)
			}
		}
	}
	return &flattened, nil
}
