package internal

import (
	"bufio"
	"encoding/json"
	"fmt"
	"regexp"
	"sync"
	"syscall"

	"log"
	"os"
	"os/exec"
	"strings"
	"time"

	"github.com/marcopeocchi/fazzoletti/slices"
	"github.com/marcopeocchi/yt-dlp-web-ui/server/cli"
	"github.com/marcopeocchi/yt-dlp-web-ui/server/config"
	"github.com/marcopeocchi/yt-dlp-web-ui/server/rx"
)

const template = `download:
{
	"eta":%(progress.eta)s, 
	"percentage":"%(progress._percent_str)s",
	"speed":%(progress.speed)s
}`

const (
	StatusPending = iota
	StatusDownloading
	StatusCompleted
	StatusErrored
)

type ProgressTemplate struct {
	Percentage string  `json:"percentage"`
	Speed      float32 `json:"speed"`
	Size       string  `json:"size"`
	Eta        float32 `json:"eta"`
}

// Process descriptor
type Process struct {
	Id       string
	Url      string
	Params   []string
	Info     DownloadInfo
	Progress DownloadProgress
	Output   DownloadOutput
	proc     *os.Process
}

type DownloadOutput struct {
	Path     string
	Filename string
}

// Starts spawns/forks a new yt-dlp process and parse its stdout.
// The process is spawned to outputting a custom progress text that
// Resembles a JSON Object in order to Unmarshal it later.
// This approach is anyhow not perfect: quotes are not escaped properly.
// Each process is not identified by its PID but by a UUIDv4
func (p *Process) Start() {
	// escape bash variable escaping and command piping, you'll never know
	// what they might come with...
	p.Params = slices.Filter(p.Params, func(e string) bool {
		match, _ := regexp.MatchString(`(\$\{)|(\&\&)`, e)
		return !match
	})

	p.Params = slices.Filter(p.Params, func(e string) bool {
		return e != ""
	})

	out := DownloadOutput{
		Path:     config.Instance().DownloadPath,
		Filename: "%(title)s.%(ext)s",
	}

	if p.Output.Path != "" {
		out.Path = p.Output.Path
	}

	if p.Output.Filename != "" {
		out.Filename = p.Output.Filename
	}

	buildFilename(&p.Output)

	params := append([]string{
		strings.Split(p.Url, "?list")[0], //no playlist
		"--newline",
		"--no-colors",
		"--no-playlist",
		"--progress-template",
		strings.NewReplacer("\n", "", "\t", "", " ", "").Replace(template),
		"-o",
		fmt.Sprintf("%s/%s", out.Path, out.Filename),
	}, p.Params...)

	// ----------------- main block ----------------- //
	cmd := exec.Command(config.Instance().DownloaderPath, params...)
	cmd.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}

	r, err := cmd.StdoutPipe()
	if err != nil {
		log.Panicln(err)
	}
	scan := bufio.NewScanner(r)

	err = cmd.Start()
	if err != nil {
		log.Panicln(err)
	}

	p.proc = cmd.Process

	// --------------- progress block --------------- //
	var (
		sourceChan = make(chan []byte)
		doneChan   = make(chan struct{})
	)

	// spawn a goroutine that does the dirty job of parsing the stdout
	// filling the channel with as many stdout line as yt-dlp produces (producer)
	go func() {
		defer func() {
			r.Close()
			p.Complete()
			doneChan <- struct{}{}
			close(sourceChan)
			close(doneChan)
		}()

		for scan.Scan() {
			sourceChan <- scan.Bytes()
		}
	}()

	// Slows down the unmarshal operation to every 500ms
	go func() {
		rx.Sample(time.Millisecond*500, sourceChan, doneChan, func(event []byte) {
			stdout := ProgressTemplate{}
			err := json.Unmarshal(event, &stdout)
			if err == nil {
				p.Progress = DownloadProgress{
					Status:     StatusDownloading,
					Percentage: stdout.Percentage,
					Speed:      stdout.Speed,
					ETA:        stdout.Eta,
				}
				log.Println(
					cli.BgGreen, "DL", cli.Reset,
					cli.BgBlue, p.getShortId(), cli.Reset,
					p.Url, stdout.Percentage,
				)
			}
		})
	}()

	// ------------- end progress block ------------- //
	cmd.Wait()
}

// Keep process in the memoryDB but marks it as complete
// Convention: All completed processes has progress -1
// and speed 0 bps.
func (p *Process) Complete() {
	p.Progress = DownloadProgress{
		Status:     StatusCompleted,
		Percentage: "-1",
		Speed:      0,
		ETA:        0,
	}

	shortId := p.getShortId()

	log.Println(
		cli.BgMagenta, "FINISH", cli.Reset,
		cli.BgBlue, shortId, cli.Reset,
		p.Url,
	)
}

// Kill a process and remove it from the memory
func (p *Process) Kill() error {
	// yt-dlp uses multiple child process the parent process
	// has been spawned with setPgid = true. To properly kill
	// all subprocesses a SIGTERM need to be sent to the correct
	// process group
	if p.proc != nil {
		pgid, err := syscall.Getpgid(p.proc.Pid)
		if err != nil {
			return err
		}
		err = syscall.Kill(-pgid, syscall.SIGTERM)

		log.Println("Killed process", p.Id)
		return err
	}

	return nil
}

// Returns the available format for this URL
func (p *Process) GetFormatsSync() (DownloadFormats, error) {
	cmd := exec.Command(config.Instance().DownloaderPath, p.Url, "-J")
	stdout, err := cmd.Output()

	if err != nil {
		return DownloadFormats{}, err
	}

	info := DownloadFormats{URL: p.Url}
	best := Format{}

	var (
		wg            sync.WaitGroup
		decodingError error
	)

	wg.Add(2)

	if err != nil {
		return DownloadFormats{}, err
	}

	log.Println(
		cli.BgRed, "Metadata", cli.Reset,
		cli.BgBlue, "Formats", cli.Reset,
		p.Url,
	)

	go func() {
		decodingError = json.Unmarshal(stdout, &info)
		wg.Done()
	}()

	go func() {
		decodingError = json.Unmarshal(stdout, &best)
		wg.Done()
	}()

	wg.Wait()

	if decodingError != nil {
		return DownloadFormats{}, err
	}

	info.Best = best

	return info, nil
}

func (p *Process) SetPending() {
	p.Progress.Status = StatusPending
}

func (p *Process) SetMetadata() error {
	cmd := exec.Command(config.Instance().DownloaderPath, p.Url, "-J")
	cmd.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		log.Println("Cannot retrieve info for", p.Url)
		return err
	}

	info := DownloadInfo{
		URL:       p.Url,
		CreatedAt: time.Now(),
	}

	err = cmd.Start()
	if err != nil {
		return err
	}

	log.Println(
		cli.BgRed, "Metadata", cli.Reset,
		cli.BgBlue, p.getShortId(), cli.Reset,
		p.Url,
	)

	err = json.NewDecoder(stdout).Decode(&info)
	if err != nil {
		return err
	}

	p.Info = info
	p.Progress.Status = StatusPending

	err = cmd.Wait()

	return err
}

func (p *Process) getShortId() string {
	return strings.Split(p.Id, "-")[0]
}

func buildFilename(o *DownloadOutput) {
	if o.Filename != "" && strings.Contains(o.Filename, ".%(ext)s") {
		o.Filename += ".%(ext)s"
	}

	o.Filename = strings.Replace(
		o.Filename,
		".%(ext)s.%(ext)s",
		".%(ext)s",
		1,
	)
}
