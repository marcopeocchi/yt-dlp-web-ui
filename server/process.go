package server

import (
	"bufio"
	"regexp"

	"github.com/goccy/go-json"

	"log"
	"os"
	"os/exec"
	"strings"
	"time"

	"github.com/marcopeocchi/fazzoletti/slices"
	"github.com/marcopeocchi/yt-dlp-web-ui/server/rx"
)

const template = `download:
{
	"eta":%(progress.eta)s, 
	"percentage":"%(progress._percent_str)s",
	"speed":%(progress.speed)s
}`

const driver = "yt-dlp"

type ProgressTemplate struct {
	Percentage string  `json:"percentage"`
	Speed      float32 `json:"speed"`
	Size       string  `json:"size"`
	Eta        int     `json:"eta"`
}

// Process descriptor
type Process struct {
	id       string
	url      string
	params   []string
	Info     DownloadInfo
	Progress DownloadProgress
	mem      *MemoryDB
	proc     *os.Process
}

// Starts spawns/forks a new yt-dlp process and parse its stdout.
// The process is spawned to outputting a custom progress text that
// Resembles a JSON Object in order to Unmarshal it later.
// This approach is anyhow not perfect: quotes are not escaped properly.
// Each process is not identified by its PID but by a UUIDv2
func (p *Process) Start() {
	// escape bash variable escaping and command piping, you'll never know
	// what they might come with...
	p.params = slices.Filter(p.params, func(e string) bool {
		match, _ := regexp.MatchString(`(\$\{)|(\&\&)`, e)
		return !match
	})

	params := append([]string{
		strings.Split(p.url, "?list")[0], //no playlist
		"--newline",
		"--no-colors",
		"--no-playlist",
		"--progress-template", strings.ReplaceAll(template, "\n", ""),
		"-o",
		"./downloads/%(title)s.%(ext)s",
	}, p.params...)

	// ----------------- main block ----------------- //
	cmd := exec.Command(driver, params...)
	r, err := cmd.StdoutPipe()
	if err != nil {
		log.Panicln(err)
	}
	scan := bufio.NewScanner(r)

	err = cmd.Start()
	if err != nil {
		log.Panicln(err)
	}

	p.id = p.mem.Set(p)
	p.proc = cmd.Process

	// ----------------- info block ----------------- //
	// spawn a goroutine that retrieves the info for the download
	go func() {
		cmd := exec.Command(driver, p.url, "-J")
		stdout, err := cmd.Output()
		if err != nil {
			log.Println("Cannot retrieve info for", p.url)
		}
		info := DownloadInfo{URL: p.url}
		json.Unmarshal(stdout, &info)
		p.mem.Update(p.id, info)
	}()

	// --------------- progress block --------------- //
	// unbuffered channel connected to stdout
	eventChan := make(chan string)

	// spawn a goroutine that does the dirty job of parsing the stdout
	// fill the channel with as many stdout line as yt-dlp produces (producer)
	go func() {
		defer cmd.Wait()
		defer r.Close()
		defer p.Complete()
		for scan.Scan() {
			eventChan <- scan.Text()
		}
	}()

	// do the unmarshal operation every 500ms (consumer)
	go rx.Sample(time.Millisecond*500, eventChan, func(text string) {
		stdout := ProgressTemplate{}
		err := json.Unmarshal([]byte(text), &stdout)
		if err == nil {
			p.mem.UpdateProgress(p.id, DownloadProgress{
				Percentage: stdout.Percentage,
				Speed:      stdout.Speed,
				ETA:        stdout.Eta,
			})
			shortId := strings.Split(p.id, "-")[0]
			log.Printf("[%s] %s %s\n", shortId, p.url, p.Progress.Percentage)
		}
	})
	// ------------- end progress block ------------- //
}

// Keep process in the memoryDB but marks it as complete
// Convention: All completed processes has progress -1
// and speed 0 bps.
func (p *Process) Complete() {
	p.mem.UpdateProgress(p.id, DownloadProgress{
		Percentage: "-1",
		Speed:      0,
		ETA:        0,
	})
}

// Kill a process and remove it from the memory
func (p *Process) Kill() error {
	err := p.proc.Kill()
	p.mem.Delete(p.id)
	log.Printf("Killed process %s\n", p.id)
	return err
}

func (p *Process) GetFormatsSync() (DownloadFormats, error) {
	cmd := exec.Command(driver, p.url, "-J")
	stdout, err := cmd.Output()

	if err != nil {
		return DownloadFormats{}, err
	}

	cmd.Wait()

	info := DownloadFormats{URL: p.url}
	json.Unmarshal(stdout, &info)

	return info, nil
}
