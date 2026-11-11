package main

import (
	"log"

	"codelingo/backend/internal/config"
	"codelingo/backend/internal/database"
)

func main() {
	cfg := config.Load()

	db, err := database.Connect(cfg)
	if err != nil {
		log.Fatalf("gagal terhubung ke database: %v", err)
	}

	if err := database.Migrate(db); err != nil {
		log.Fatalf("migrasi gagal: %v", err)
	}

	if err := database.EnsureLanguages(db); err != nil {
		log.Fatalf("seed bahasa gagal: %v", err)
	}
	if err := database.Backfill(db); err != nil {
		log.Fatalf("backfill gagal: %v", err)
	}

	log.Println("migrasi selesai")
}