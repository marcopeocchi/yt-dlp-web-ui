package updater

import (
	"os/exec"
	"strings"

	"github.com/marcopiovanello/yt-dlp-web-ui/v4/server/config"
)

// UpdateDeno upgrades the Deno binary using its builtin update function.
func UpdateDeno() error {
	cmd := exec.Command(denoBinary(), "upgrade")

	if err := cmd.Start(); err != nil {
		return err
	}

	return cmd.Wait()
}

// denoBinary resolves the deno executable from the configured JS runtime
// path (yt-dlp js-runtimes format is "RUNTIME[:PATH]"), falling back to
// "deno" from the system PATH.
func denoBinary() string {
	jsRuntime := config.Instance().Paths.JSRuntimePath

	if strings.HasPrefix(jsRuntime, "deno:") {
		if path := strings.TrimPrefix(jsRuntime, "deno:"); path != "" {
			return path
		}
	}

	return "deno"
}
