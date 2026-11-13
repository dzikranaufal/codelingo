// Package admin berisi endpoint pengelolaan konten (path, lesson, soal) khusus admin.
// Semua route harus dibungkus Authenticate dan RequireRole(admin) di main.go.
package admin

import (
	"errors"
	"log"
	"net/http"
	"strconv"

	"codelingo/backend/internal/httpx"
)

// APIError membawa status HTTP dan pesan yang aman ditampilkan ke klien.
type APIError struct {
	Status  int
	Message string
}

func (e *APIError) Error() string { return e.Message }

func newErr(status int, message string) *APIError {
	return &APIError{Status: status, Message: message}
}

// internalErr mencatat detail error di log server, tetapi klien hanya menerima pesan umum.
func internalErr(op string, err error) *APIError {
	log.Printf("admin: %s: %v", op, err)
	return newErr(http.StatusInternalServerError, "terjadi kesalahan internal")
}

func writeError(w http.ResponseWriter, err error) {
	var apiErr *APIError
	if errors.As(err, &apiErr) {
		httpx.WriteError(w, apiErr.Status, apiErr.Message)
		return
	}
	httpx.WriteError(w, http.StatusInternalServerError, "terjadi kesalahan internal")
}

func parseID(raw string) (uint, bool) {
	n, err := strconv.ParseUint(raw, 10, 64)
	if err != nil || n == 0 {
		return 0, false
	}
	return uint(n), true
}