package updater

import (
	"os/exec"

	"github.com/marcopeocchi/yt-dlp-web-ui/server/config"
)

var path = config.Instance().GetConfig().DownloaderPath

// Update using the builtin function of yt-dlp
func UpdateExecutable() error {
	cmd := exec.Command(path, "-U")
	cmd.Start()

	err := cmd.Wait()
	return err
}
