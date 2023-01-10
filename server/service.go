package server

import (
	"log"

	"github.com/marcopeocchi/yt-dlp-web-ui/server/sys"
)

type Service int

type Running []ProcessResponse
type Pending []string

type NoArgs struct{}
type Args struct {
	Id     string
	URL    string
	Params []string
}

// Exec spawns a Process.
// The result of the execution is the newly spawned process Id.
func (t *Service) Exec(args Args, result *string) error {
	log.Printf("Spawning new process for %s\n", args.URL)
	p := Process{mem: &db, url: args.URL, params: args.Params}
	p.Start()
	*result = p.id
	return nil
}

// Progess retrieves the Progress of a specific Process given its Id
func (t *Service) Progess(args Args, progress *DownloadProgress) error {
	*progress = db.Get(args.Id).Progress
	return nil
}

// Pending retrieves a slice of all Pending/Running processes ids
func (t *Service) Pending(args NoArgs, pending *Pending) error {
	*pending = Pending(db.Keys())
	return nil
}

// Running retrieves a slice of all Processes progress
func (t *Service) Running(args NoArgs, running *Running) error {
	*running = db.All()
	return nil
}

// Kill kills a process given its id and remove it from the memoryDB
func (t *Service) Kill(args string, killed *string) error {
	proc := db.Get(args)
	var err error
	if proc != nil {
		err = proc.Kill()
	}
	return err
}

// KillAll kills all process unconditionally and removes them from
// the memory db
func (t *Service) KillAll(args NoArgs, killed *string) error {
	keys := db.Keys()
	var err error
	for _, key := range keys {
		proc := db.Get(key)
		if proc != nil {
			proc.Kill()
		}
	}
	return err
}

// FreeSpace gets the available from package sys util
func (t *Service) FreeSpace(args NoArgs, free *uint64) error {
	freeSpace, err := sys.FreeSpace()
	*free = freeSpace
	return err
}
