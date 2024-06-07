package dbutil

import (
	"context"
	"database/sql"
)

// Run the table migration
func AutoMigrate(ctx context.Context, db *sql.DB) error {
	conn, err := db.Conn(ctx)
	if err != nil {
		return err
	}

	defer conn.Close()

	_, err = db.ExecContext(
		ctx,
		`CREATE TABLE IF NOT EXISTS templates (
			id CHAR(36) PRIMARY KEY,
			name VARCHAR(255) NOT NULL,
			content TEXT NOT NULL
		)`,
	)
	if err != nil {
		return err
	}

	db.ExecContext(
		ctx,
		`INSERT INTO templates (id, name, content) VALUES
			($1, $2, $3),
			($4, $5, $6);`,
		"0", "default", "--no-mtime",
		"1", "audio only", "-x",
	)

	return err
}
