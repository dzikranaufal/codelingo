package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"codelingo/backend/internal/auth"
	"codelingo/backend/internal/config"
	"codelingo/backend/internal/database"

	"gorm.io/gorm"
)

func main() {
	cfg := config.Load()

	if len(cfg.JWTSecret) < 32 {
		log.Fatal("JWT_SECRET wajib diisi dengan secret acak minimal 32 byte")
	}

	db, err := database.Connect(cfg)
	if err != nil {
		log.Fatalf("gagal membuat koneksi database: %v", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		log.Fatalf("gagal mengakses koneksi database: %v", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := sqlDB.PingContext(ctx); err != nil {
		log.Fatalf("database tidak bisa diakses: %v", err)
	}

	if err := verifyAuthSchema(db); err != nil {
		log.Fatalf("skema database belum siap: %v", err)
	}

	service := &auth.Service{
		DB:        db,
		JWTSecret: []byte(cfg.JWTSecret),
	}
	handler := &auth.Handler{Service: service}

	mux := http.NewServeMux()
	mux.HandleFunc("/api/v1/auth/register", handler.Register)
	mux.HandleFunc("/api/v1/auth/login", handler.Login)
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"status":"ok"}`))
	})

	server := &http.Server{
		Addr:              ":" + cfg.ServerPort,
		Handler:           cors(mux),
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      10 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	log.Printf("Codelingo API berjalan di http://localhost:%s", cfg.ServerPort)
	if err := server.ListenAndServe(); err != nil &&
		!errors.Is(err, http.ErrServerClosed) {
		log.Fatalf("server gagal: %v", err)
	}
}

func verifyAuthSchema(db *gorm.DB) error {
	if !db.Migrator().HasTable("users") {
		return errors.New("tabel users belum ada; jalankan migrasi")
	}

	for _, column := range []string{"username", "age", "email", "password"} {
		if !db.Migrator().HasColumn("users", column) {
			return errors.New("kolom " + column + " belum ada; jalankan migrasi")
		}
	}

	return nil
}

func cors(next http.Handler) http.Handler {
	allowedOrigins := map[string]bool{
		"http://localhost:5173": true,
		"http://127.0.0.1:5173": true,
	}

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")

		if allowedOrigins[origin] {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Add("Vary", "Origin")
			w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		}

		if r.Method == http.MethodOptions {
			if !allowedOrigins[origin] {
				http.Error(w, "origin tidak diizinkan", http.StatusForbidden)
				return
			}
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func init() {
	// Memastikan konfigurasi secret tidak tertukar dengan placeholder.
	if strings.TrimSpace(os.Getenv("JWT_SECRET")) == "" {
		// Config.Load() juga membaca .env; validasi final dilakukan di main.
	}
}
