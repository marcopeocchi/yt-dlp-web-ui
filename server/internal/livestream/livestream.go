package livestream

import (
	"bufio"
	"errors"
	"io"
	"os"
	"os/exec"
	"strings"
	"time"

	"github.com/marcopeocchi/yt-dlp-web-ui/server/config"
)

const (
	waiting = iota
	inProgress
	completed
	errored
)

// Defines a generic livestream.
// A livestream is identified by its url.
type LiveStream struct {
	url          string
	proc         *os.Process        // used to manually kill the yt-dlp process
	status       int                // whether is monitoring or completed
	log          []byte             // keeps tracks of the process logs while monitoring, not when started
	done         chan *LiveStream   // where to signal the completition
	waitTimeChan chan time.Duration // time to livestream start
	errors       chan error
	waitTime     time.Duration
}

func New(url string, done chan *LiveStream) *LiveStream {
	return &LiveStream{
		url:          url,
		done:         done,
		status:       waiting,
		waitTime:     time.Second * 0,
		log:          make([]byte, 0),
		errors:       make(chan error),
		waitTimeChan: make(chan time.Duration),
	}
}

// Start the livestream monitoring process, once completion signals on the done channel
func (l *LiveStream) Start() error {
	cmd := exec.Command(
		config.Instance().DownloaderPath,
		l.url,
		"--wait-for-video", "10", // wait for the stream to be live and rechecke every 10 secs
		"--no-colors", // no ansi color fuzz
	)
	l.proc = cmd.Process

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return err
	}
	defer stdout.Close()

	if err := cmd.Start(); err != nil {
		l.status = errored
		return err
	}

	l.status = waiting

	// Start monitoring when the livestream is goin to be live.
	// If already live do nothing.
	go l.monitorStartTime(stdout)

	// Wait to the yt-dlp+ffmpeg process to finish.
	cmd.Wait()

	// Set the job as completed and notify the parent the completion.
	l.status = completed
	l.done <- l

	return nil
}

func (l *LiveStream) monitorStartTime(r io.Reader) error {
	// yt-dlp shows the time in the stdout
	scanner := bufio.NewScanner(r)

	defer func() {
		close(l.waitTimeChan)
	}()

	// however the time to live is not shown in a new line (and atm there's nothing to to about)
	// use a custom split funciton to set the line separator to \r instead of \r\n or \n
	scanner.Split(func(data []byte, atEOF bool) (advance int, token []byte, err error) {
		for i := 0; i < len(data); i++ {
			if data[i] == '\r' {
				return i + 1, data[:i], nil
			}
		}
		if !atEOF {
			return 0, nil, nil
		}

		return 0, data, bufio.ErrFinalToken
	})

	// start scanning the stdout
	for scanner.Scan() {
		parts := strings.Split(scanner.Text(), ": ")
		if len(parts) < 2 {
			continue
		}

		// if this substring is in the current line the download is starting,
		// no need to monitor the time to live.
		//TODO: silly
		if !strings.Contains(scanner.Text(), "Remaining time until next attempt") {
			l.status = inProgress
			return nil
		}

		startsIn := parts[1]

		parsed, err := time.Parse("15:04:05", startsIn)
		if err != nil {
			continue
		}

		start := time.Now()

		start = start.Add(time.Duration(parsed.Hour()) * time.Hour)
		start = start.Add(time.Duration(parsed.Minute()) * time.Minute)
		start = start.Add(time.Duration(parsed.Second()) * time.Second)

		//TODO: check if useing channels is stupid or not
		// l.waitTimeChan <- time.Until(start)
		l.waitTime = time.Until(start)
	}

	return nil
}

func (l *LiveStream) WaitTime() <-chan time.Duration {
	return l.waitTimeChan
}

func (l *LiveStream) Kill() error {
	l.done <- l

	if l.proc != nil {
		return l.proc.Kill()
	}
	return errors.New("nil yt-dlp process")
}
