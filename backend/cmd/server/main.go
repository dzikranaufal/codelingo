package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"codelingo/backend/internal/admin"
	"codelingo/backend/internal/adminauth"
	"codelingo/backend/internal/auth"
	"codelingo/backend/internal/config"
	"codelingo/backend/internal/content"
	"codelingo/backend/internal/database"
	"codelingo/backend/internal/leaderboard"
	"codelingo/backend/internal/middleware"
	"codelingo/backend/internal/models"
	"codelingo/backend/internal/profile"
	"codelingo/backend/internal/quest"
	"codelingo/backend/internal/shop"

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

	authenticate := middleware.Authenticate(db, []byte(cfg.JWTSecret))
	requireAdmin := middleware.RequireRole(models.RoleAdmin)

	// Profil
	profileHandler := &profile.Handler{
		Service: &profile.Service{DB: db},
	}

	mux.Handle("/api/v1/profile", authenticate(http.HandlerFunc(profileHandler.Profile)))
	mux.Handle("/api/v1/profile/password", authenticate(http.HandlerFunc(profileHandler.Password)))

	// Belajar (khusus pelajar)
	requireLearner := middleware.RequireRole(models.RoleUser)

	contentHandler := &content.Handler{
		Service: &content.Service{DB: db},
	}

	mux.Handle("/api/v1/learning-path", authenticate(requireLearner(http.HandlerFunc(contentHandler.Path))))
	mux.Handle("/api/v1/lessons/", authenticate(requireLearner(http.HandlerFunc(contentHandler.LessonRoutes))))
	mux.Handle("/api/v1/me/stats", authenticate(requireLearner(http.HandlerFunc(contentHandler.Stats))))

	// Papan skor
	leaderboardHandler := &leaderboard.Handler{
		Service: &leaderboard.Service{DB: db},
	}

	mux.Handle("/api/v1/leaderboard", authenticate(http.HandlerFunc(leaderboardHandler.List)))
	mux.Handle("/api/v1/leaderboard/status", authenticate(requireLearner(http.HandlerFunc(leaderboardHandler.SetStatus))))

	// Toko dan misi
	shopHandler := &shop.Handler{
		Service: &shop.Service{DB: db},
	}

	mux.Handle("/api/v1/shop", authenticate(requireLearner(http.HandlerFunc(shopHandler.Shop))))
	mux.Handle("/api/v1/shop/purchase", authenticate(requireLearner(http.HandlerFunc(shopHandler.Purchase))))

	questHandler := &quest.Handler{
		Service: &quest.Service{DB: db},
	}

	mux.Handle("/api/v1/quests", authenticate(requireLearner(http.HandlerFunc(questHandler.List))))
	mux.Handle("/api/v1/quests/", authenticate(requireLearner(http.HandlerFunc(questHandler.Claim))))

	// Login dan sesi admin
	adminAuthHandler := &adminauth.Handler{
		Service: &adminauth.Service{
			DB:        db,
			JWTSecret: []byte(cfg.JWTSecret),
		},
	}

	mux.HandleFunc("/api/v1/admin/auth/login", adminAuthHandler.Login)
	mux.Handle("/api/v1/admin/me", authenticate(requireAdmin(http.HandlerFunc(adminAuthHandler.Me))))

	// Kelola konten dan akun (khusus admin)
	adminContent := &admin.Handler{
		Service: &admin.Service{DB: db},
	}

	mux.Handle("/api/v1/admin/stats", authenticate(requireAdmin(http.HandlerFunc(adminContent.Stats))))
	mux.Handle("/api/v1/admin/languages", authenticate(requireAdmin(http.HandlerFunc(adminContent.Languages))))
	mux.Handle("/api/v1/admin/learning-paths", authenticate(requireAdmin(http.HandlerFunc(adminContent.Paths))))
	mux.Handle("/api/v1/admin/learning-paths/", authenticate(requireAdmin(http.HandlerFunc(adminContent.PathRoutes))))
	mux.Handle("/api/v1/admin/lessons/", authenticate(requireAdmin(http.HandlerFunc(adminContent.LessonRoutes))))
	mux.Handle("/api/v1/admin/questions/", authenticate(requireAdmin(http.HandlerFunc(adminContent.QuestionRoutes))))
	mux.Handle("/api/v1/admin/users", authenticate(requireAdmin(http.HandlerFunc(adminContent.Users))))
	mux.Handle("/api/v1/admin/users/", authenticate(requireAdmin(http.HandlerFunc(adminContent.UserRoutes))))

	// Health check
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
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS")
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
