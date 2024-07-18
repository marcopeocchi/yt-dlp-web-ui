package livestream

import (
	"testing"
	"time"

	"github.com/marcopeocchi/yt-dlp-web-ui/server/config"
)

func setupTest() {
	config.Instance().DownloaderPath = "yt-dlp"
}

func TestLivestream(t *testing.T) {
	setupTest()

	done := make(chan *LiveStream)

	ls := New("https://www.youtube.com/watch?v=PYVr6Rv8-Ug", done)
	go ls.Start()

	time.AfterFunc(time.Second*20, func() {
		ls.Kill()
	})

	for {
		select {
		case wt := <-ls.WaitTime():
			t.Log(wt)
		case <-done:
			t.Log("done")
			return
		}
	}
}
