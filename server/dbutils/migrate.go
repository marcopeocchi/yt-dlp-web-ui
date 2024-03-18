package dbutils

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

	return err
}
