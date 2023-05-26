package rest

import (
	"encoding/hex"
	"errors"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/marcopeocchi/yt-dlp-web-ui/server/config"
	"github.com/marcopeocchi/yt-dlp-web-ui/server/utils"
)

type DirectoryEntry struct {
	Name        string `json:"name"`
	Path        string `json:"path"`
	SHASum      string `json:"shaSum"`
	IsVideo     bool   `json:"isVideo"`
	IsDirectory bool   `json:"isDirectory"`
}

func walkDir(root string) (*[]DirectoryEntry, error) {
	files := []DirectoryEntry{}

	dirs, err := os.ReadDir(root)
	if err != nil {
		return nil, err
	}

	for _, d := range dirs {
		if !utils.IsValidEntry(d) {
			continue
		}

		path := filepath.Join(root, d.Name())

		files = append(files, DirectoryEntry{
			Path:        path,
			Name:        d.Name(),
			SHASum:      utils.ShaSumString(path),
			IsVideo:     utils.IsVideo(d),
			IsDirectory: d.IsDir(),
		})
	}

	return &files, err
}

type ListRequest struct {
	SubDir string `json:"subdir"`
}

func ListDownloaded(ctx *fiber.Ctx) error {
	root := config.Instance().GetConfig().DownloadPath
	req := new(ListRequest)

	err := ctx.BodyParser(req)
	if err != nil {
		return err
	}

	files, err := walkDir(filepath.Join(root, req.SubDir))
	if err != nil {
		return err
	}

	ctx.Status(http.StatusOK)
	return ctx.JSON(files)
}

type DeleteRequest = DirectoryEntry

func DeleteFile(ctx *fiber.Ctx) error {
	req := new(DeleteRequest)

	err := ctx.BodyParser(req)
	if err != nil {
		return err
	}

	sum := utils.ShaSumString(req.Path)
	if sum != req.SHASum {
		return errors.New("shasum mismatch")
	}

	err = os.Remove(req.Path)
	if err != nil {
		return err
	}

	ctx.Status(fiber.StatusOK)
	return ctx.JSON("ok")
}

type PlayRequest struct {
	Path string
}

func PlayFile(ctx *fiber.Ctx) error {
	path := ctx.Query("path")

	if path == "" {
		return errors.New("inexistent path")
	}

	decoded, err := hex.DecodeString(path)
	if err != nil {
		return err
	}

	root := config.Instance().GetConfig().DownloadPath

	// TODO: further path / file validations
	if strings.Contains(filepath.Dir(string(decoded)), root) {
		ctx.SendStatus(fiber.StatusPartialContent)
		return ctx.SendFile(string(decoded))
	}

	ctx.Status(fiber.StatusOK)
	return ctx.SendStatus(fiber.StatusUnauthorized)
}
