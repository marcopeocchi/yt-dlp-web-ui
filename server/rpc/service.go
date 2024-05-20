package rpc

import (
	"log/slog"

	"github.com/marcopeocchi/yt-dlp-web-ui/server/internal"
	"github.com/marcopeocchi/yt-dlp-web-ui/server/sys"
	"github.com/marcopeocchi/yt-dlp-web-ui/server/updater"
)

type Service struct {
	db     *internal.MemoryDB
	mq     *internal.MessageQueue
	logger *slog.Logger
}

type Running []internal.ProcessResponse
type Pending []string

type NoArgs struct{}

type Args struct {
	Id     string
	URL    string
	Params []string
}

// Exec spawns a Process.
// The result of the execution is the newly spawned process Id.
func (s *Service) Exec(args internal.DownloadRequest, result *string) error {
	p := &internal.Process{
		Url:    args.URL,
		Params: args.Params,
		Output: internal.DownloadOutput{
			Path:     args.Path,
			Filename: args.Rename,
		},
		Logger: s.logger,
	}

	s.db.Set(p)
	s.mq.Publish(p)

	*result = p.Id
	return nil
}

// Exec spawns a Process.
// The result of the execution is the newly spawned process Id.
func (s *Service) ExecPlaylist(args internal.DownloadRequest, result *string) error {
	err := internal.PlaylistDetect(args, s.mq, s.db, s.logger)
	if err != nil {
		return err
	}

	*result = ""
	return nil
}

// Progess retrieves the Progress of a specific Process given its Id
func (s *Service) Progess(args Args, progress *internal.DownloadProgress) error {
	proc, err := s.db.Get(args.Id)
	if err != nil {
		return err
	}

	*progress = proc.Progress
	return nil
}

// Progess retrieves available format for a given resource
func (s *Service) Formats(args Args, meta *internal.DownloadFormats) error {
	var (
		err error
		p   = internal.Process{Url: args.URL, Logger: s.logger}
	)
	*meta, err = p.GetFormatsSync()
	return err
}

// Pending retrieves a slice of all Pending/Running processes ids
func (s *Service) Pending(args NoArgs, pending *Pending) error {
	*pending = *s.db.Keys()
	return nil
}

// Running retrieves a slice of all Processes progress
func (s *Service) Running(args NoArgs, running *Running) error {
	*running = *s.db.All()
	return nil
}

// Kill kills a process given its id and remove it from the memoryDB
func (s *Service) Kill(args string, killed *string) error {
	s.logger.Info("Trying killing process with id", slog.String("id", args))

	proc, err := s.db.Get(args)
	if err != nil {
		return err
	}

	if proc != nil {
		err = proc.Kill()
		s.db.Delete(proc.Id)
	}

	s.db.Delete(proc.Id)
	return err
}

// KillAll kills all process unconditionally and removes them from
// the memory db
func (s *Service) KillAll(args NoArgs, killed *string) error {
	s.logger.Info("Killing all spawned processes")

	var (
		keys = s.db.Keys()
		err  error
	)

	for _, key := range *keys {
		proc, err := s.db.Get(key)
		if err != nil {
			return err
		}

		if proc != nil {
			proc.Kill()
			s.db.Delete(proc.Id)
		}
	}

	return err
}

// Remove a process from the db rendering it unusable if active
func (s *Service) Clear(args string, killed *string) error {
	s.logger.Info("Clearing process with id", slog.String("id", args))
	s.db.Delete(args)
	return nil
}

// FreeSpace gets the available from package sys util
func (s *Service) FreeSpace(args NoArgs, free *uint64) error {
	freeSpace, err := sys.FreeSpace()
	if err != nil {
		return err
	}

	*free = freeSpace
	return err
}

// Return a flattned tree of the download directory
func (s *Service) DirectoryTree(args NoArgs, tree *[]string) error {
	dfsTree, err := sys.DirectoryTree()

	if err != nil {
		*tree = nil
		return err
	}

	if dfsTree != nil {
		*tree = *dfsTree
	}

	return nil
}

// Updates the yt-dlp binary using its builtin function
func (s *Service) UpdateExecutable(args NoArgs, updated *bool) error {
	s.logger.Info("Updating yt-dlp executable to the latest release")

	if err := updater.UpdateExecutable(); err != nil {
		s.logger.Error("Failed updating yt-dlp")
		*updated = false
		return err
	}

	*updated = true
	s.logger.Info("Succesfully updated yt-dlp")

	return nil
}
