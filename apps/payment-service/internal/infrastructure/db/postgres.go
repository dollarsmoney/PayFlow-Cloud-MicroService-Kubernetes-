package db

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"time"

	_ "github.com/lib/pq"
)

var DB *sql.DB

func Connect() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Fatal("[DB] DATABASE_URL is not set")
	}

	var err error
	for i := 0; i < 10; i++ {
		DB, err = sql.Open("postgres", dsn)
		if err == nil {
			err = DB.Ping()
		}
		if err == nil {
			break
		}
		log.Printf("[DB] Connection attempt %d failed: %v. Retrying in 3s...", i+1, err)
		time.Sleep(3 * time.Second)
	}
	if err != nil {
		log.Fatalf("[DB] Failed to connect after retries: %v", err)
	}

	DB.SetMaxOpenConns(25)
	DB.SetMaxIdleConns(5)
	DB.SetConnMaxLifetime(5 * time.Minute)

	if err := migrate(); err != nil {
		log.Fatalf("[DB] Migration failed: %v", err)
	}

	log.Println("[DB] Connected to PostgreSQL")
}

func migrate() error {
	_, err := DB.Exec(`
		CREATE TABLE IF NOT EXISTS payments (
			id          TEXT PRIMARY KEY,
			user_id     TEXT NOT NULL,
			amount      NUMERIC(18,2) NOT NULL,
			currency    TEXT NOT NULL DEFAULT 'USD',
			status      TEXT NOT NULL DEFAULT 'PENDING',
			gateway_ref TEXT,
			fail_reason TEXT,
			created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);
		CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
	`)
	if err != nil {
		return fmt.Errorf("migrate: %w", err)
	}
	return nil
}
