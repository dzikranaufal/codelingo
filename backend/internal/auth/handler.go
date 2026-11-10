package auth

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strings"
)

type Handler struct {
	Service *Service
}

func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.Header().Set("Allow", http.MethodPost)
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{
			"error": "method tidak diizinkan",
		})
		return
	}

	var input RegisterInput
	if err := decodeJSON(w, r, &input); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "format JSON tidak valid",
		})
		return
	}

	result, err := h.Service.Register(input)
	if err != nil {
		writeAuthError(w, err)
		return
	}

	writeJSON(w, http.StatusCreated, result)
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.Header().Set("Allow", http.MethodPost)
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{
			"error": "method tidak diizinkan",
		})
		return
	}

	var input LoginInput
	if err := decodeJSON(w, r, &input); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "format JSON tidak valid",
		})
		return
	}

	result, err := h.Service.Login(input)
	if err != nil {
		writeAuthError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, result)
}

func decodeJSON(w http.ResponseWriter, r *http.Request, target any) error {
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
	defer r.Body.Close()

	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()

	if err := decoder.Decode(target); err != nil {
		return err
	}

	var extra any
	if err := decoder.Decode(&extra); !errors.Is(err, io.EOF) {
		return errors.New("hanya satu objek JSON yang diizinkan")
	}

	return nil
}

func writeAuthError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, ErrInvalidInput):
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "data registrasi tidak valid",
		})
	case errors.Is(err, ErrInvalidCreds):
		writeJSON(w, http.StatusUnauthorized, map[string]string{
			"error": "email/username atau password salah",
		})
	case errors.Is(err, ErrAccountExists):
		writeJSON(w, http.StatusConflict, map[string]string{
			"error": "email atau username sudah digunakan",
		})
	default:
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "terjadi kesalahan internal",
		})
	}
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

// Memastikan identifier yang kosong tidak diterima oleh pemanggil lain
// yang mungkin menggunakan handler ini.
func normalizeIdentifier(value string) string {
	return strings.ToLower(strings.TrimSpace(value))
}
