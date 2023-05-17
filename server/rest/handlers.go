package rest

import (
	"crypto/sha256"
	"encoding/hex"
	"io/fs"
	"os"
	"path/filepath"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/marcopeocchi/yt-dlp-web-ui/server/config"
	"golang.org/x/exp/slices"
)

type DirectoryEntry struct {
	Name   string `json:"name"`
	Path   string `json:"path"`
	SHASum string `json:"shaSum"`
}

func walkDir(root string) (*[]DirectoryEntry, error) {
	files := []DirectoryEntry{}

	err := filepath.WalkDir(root, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if !d.IsDir() && !strings.HasPrefix(d.Name(), ".") {
			h := sha256.New()
			h.Write([]byte(path))

			files = append(files, DirectoryEntry{
				Path:   path,
				Name:   d.Name(),
				SHASum: hex.EncodeToString(h.Sum(nil)),
			})
		}
		return nil
	})

	return &files, err
}

func ListDownloaded(ctx *fiber.Ctx) error {
	root := config.Instance().GetConfig().DownloadPath

	files, err := walkDir(root)
	if err != nil {
		return err
	}

	return ctx.JSON(files)
}

type DeleteRequest = DirectoryEntry

func DeleteFile(ctx *fiber.Ctx) error {
	req := new(DeleteRequest)

	err := ctx.BodyParser(req)
	if err != nil {
		return err
	}

	root := config.Instance().GetConfig().DownloadPath

	files, err := walkDir(root)
	if err != nil {
		return err
	}

	index := slices.IndexFunc(*files, func(e DirectoryEntry) bool {
		return e.Path == req.Path && e.SHASum == req.SHASum
	})

	if index >= 0 {
		err := os.Remove(req.Path)
		if err != nil {
			return err
		}
	}

	return ctx.JSON(index)
}

type PlayRequest struct {
	Path string
}

func PlayFile(ctx *fiber.Ctx) error {
	req := new(PlayRequest)

	err := ctx.BodyParser(req)
	if err != nil {
		return err
	}

	root := config.Instance().GetConfig().DownloadPath

	if strings.Contains(filepath.Dir(req.Path), root) {
		return ctx.SendFile(req.Path)
	}

	return ctx.SendStatus(fiber.StatusUnauthorized)
}
