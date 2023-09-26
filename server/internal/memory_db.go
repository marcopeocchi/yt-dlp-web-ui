package internal

import (
	"encoding/gob"
	"errors"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sync"

	"github.com/google/uuid"
	"github.com/marcopeocchi/yt-dlp-web-ui/server/cli"
	"github.com/marcopeocchi/yt-dlp-web-ui/server/config"
)

// In-Memory Thread-Safe Key-Value Storage with optional persistence
type MemoryDB struct {
	table sync.Map
}

// Get a process pointer given its id
func (m *MemoryDB) Get(id string) (*Process, error) {
	entry, ok := m.table.Load(id)
	if !ok {
		return nil, errors.New("no process found for the given key")
	}
	return entry.(*Process), nil
}

// Store a pointer of a process and return its id
func (m *MemoryDB) Set(process *Process) string {
	id := uuid.Must(uuid.NewRandom()).String()
	m.table.Store(id, process)
	process.Id = id
	return id
}

// Update a process info/metadata, given the process id
//
// Deprecated: will be removed anytime soon.
func (m *MemoryDB) UpdateInfo(id string, info DownloadInfo) error {
	entry, ok := m.table.Load(id)
	if ok {
		entry.(*Process).Info = info
		m.table.Store(id, entry)
		return nil
	}
	return fmt.Errorf("can't update row with id %s", id)
}

// Update a process progress data, given the process id
// Used for updating completition percentage or ETA.
//
// Deprecated: will be removed anytime soon.
func (m *MemoryDB) UpdateProgress(id string, progress DownloadProgress) error {
	entry, ok := m.table.Load(id)
	if ok {
		entry.(*Process).Progress = progress
		m.table.Store(id, entry)
		return nil
	}
	return fmt.Errorf("can't update row with id %s", id)
}

// Removes a process progress, given the process id
func (m *MemoryDB) Delete(id string) {
	m.table.Delete(id)
}

func (m *MemoryDB) Keys() *[]string {
	running := []string{}
	m.table.Range(func(key, value any) bool {
		running = append(running, key.(string))
		return true
	})
	return &running
}

// Returns a slice of all currently stored processes progess
func (m *MemoryDB) All() *[]ProcessResponse {
	running := []ProcessResponse{}
	m.table.Range(func(key, value any) bool {
		running = append(running, ProcessResponse{
			Id:       key.(string),
			Info:     value.(*Process).Info,
			Progress: value.(*Process).Progress,
		})
		return true
	})
	return &running
}

// WIP: Persist the database in a single file named "session.dat"
func (m *MemoryDB) Persist() {
	running := m.All()

	sessionFile := filepath.Join(
		config.Instance().GetConfig().SessionFilePath,
		"session.dat",
	)

	fd, err := os.Create(sessionFile)
	if err != nil {
		log.Println(cli.Red, "Failed to persist session", cli.Reset)
	}

	session := Session{
		Processes: *running,
	}

	err = gob.NewEncoder(fd).Encode(session)
	if err != nil {
		log.Println(cli.Red, "Failed to persist session", cli.Reset)
	}

	log.Println(cli.BgBlue, "Successfully serialized session", cli.Reset)
}

// WIP: Restore a persisted state
func (m *MemoryDB) Restore() {
	fd, err := os.Open("session.dat")
	if err != nil {
		return
	}

	session := Session{}

	err = gob.NewDecoder(fd).Decode(&session)
	if err != nil {
		return
	}

	for _, proc := range session.Processes {
		restored := &Process{
			Id:       proc.Id,
			Url:      proc.Info.URL,
			Info:     proc.Info,
			Progress: proc.Progress,
		}

		m.table.Store(proc.Id, restored)

		if restored.Progress.Percentage != "-1" {
			go restored.Start()
		}
	}

	log.Println(cli.BgGreen, "Successfully restored session", cli.Reset)
}
