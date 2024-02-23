package rest

import (
	"context"
	"database/sql"
	"errors"
	"log/slog"
	"os"

	"github.com/google/uuid"
	"github.com/marcopeocchi/yt-dlp-web-ui/server/internal"
	"github.com/marcopeocchi/yt-dlp-web-ui/server/sys"
)

type Service struct {
	mdb    *internal.MemoryDB
	db     *sql.DB
	mq     *internal.MessageQueue
	logger *slog.Logger
}

func (s *Service) Exec(req internal.DownloadRequest) (string, error) {
	p := &internal.Process{
		Url:    req.URL,
		Params: req.Params,
		Output: internal.DownloadOutput{
			Path:     req.Path,
			Filename: req.Rename,
		},
		Logger: s.logger,
	}

	id := s.mdb.Set(p)
	s.mq.Publish(p)

	return id, nil
}

func (s *Service) Running(ctx context.Context) (*[]internal.ProcessResponse, error) {
	select {
	case <-ctx.Done():
		return nil, errors.New("context cancelled")
	default:
		return s.mdb.All(), nil
	}
}

func (s *Service) SetCookies(ctx context.Context, cookies string) error {
	fd, err := os.Create("cookies.txt")
	if err != nil {
		return err
	}

	defer fd.Close()
	fd.WriteString(cookies)

	return nil
}

func (s *Service) SaveTemplate(ctx context.Context, template *internal.CustomTemplate) error {
	conn, err := s.db.Conn(ctx)
	if err != nil {
		return err
	}

	defer conn.Close()

	_, err = conn.ExecContext(
		ctx,
		"INSERT INTO templates (id, name, content) VALUES (?, ?, ?)",
		uuid.NewString(),
		template.Name,
		template.Content,
	)

	return err
}

func (s *Service) GetTemplates(ctx context.Context) (*[]internal.CustomTemplate, error) {
	conn, err := s.db.Conn(ctx)
	if err != nil {
		return nil, err
	}

	defer conn.Close()

	rows, err := conn.QueryContext(ctx, "SELECT * FROM templates")
	if err != nil {
		return nil, err
	}

	defer rows.Close()

	templates := make([]internal.CustomTemplate, 0)

	for rows.Next() {
		t := internal.CustomTemplate{}

		err := rows.Scan(&t.Id, &t.Name, &t.Content)
		if err != nil {
			return nil, err
		}

		templates = append(templates, t)
	}

	return &templates, nil
}

func (s *Service) DeleteTemplate(ctx context.Context, id string) error {
	conn, err := s.db.Conn(ctx)
	if err != nil {
		return err
	}

	defer conn.Close()

	_, err = conn.ExecContext(ctx, "DELETE FROM templates WHERE id = ?", id)

	return err
}

func (s *Service) DirectoryTree(ctx context.Context) (*internal.Stack[sys.FSNode], error) {
	return sys.DirectoryTree()
}

func (s *Service) DownloadFile(ctx context.Context, id string) (*string, error) {
	p, err := s.mdb.Get(id)
	if err != nil {
		return nil, err
	}

	return &p.Output.Path, nil
}
