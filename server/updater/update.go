package updater

import (
	"os/exec"

	"github.com/marcopeocchi/yt-dlp-web-ui/server/config"
)

// Update using the builtin function of yt-dlp
func UpdateExecutable() error {
	cmd := exec.Command(config.Instance().GetConfig().DownloaderPath, "-U")

	err := cmd.Start()
	if err != nil {
		return err
	}

	return cmd.Wait()
}
