package profile

import (
	"errors"
	"net/http"

	"codelingo/backend/internal/httpx"
	"codelingo/backend/internal/middleware"
)

type Handler struct {
	Service *Service
}

type updateInput struct {
	Name string `json:"name"`
}

type passwordInput struct {
	CurrentPassword string `json:"current_password"`
	NewPassword     string `json:"new_password"`
}

// Profile menangani GET dan PATCH /api/v1/profile (wajib dibungkus Authenticate).
func (h *Handler) Profile(w http.ResponseWriter, r *http.Request) {
	user, ok := middleware.UserFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "token tidak valid")
		return
	}

	switch r.Method {
	case http.MethodGet:
		httpx.WriteJSON(w, http.StatusOK, NewResponse(user))

	case http.MethodPatch:
		var input updateInput
		if err := httpx.DecodeJSON(w, r, &input); err != nil {
			httpx.WriteError(w, http.StatusBadRequest, "format JSON tidak valid")
			return
		}
		if err := h.Service.UpdateName(user, input.Name); err != nil {
			writeServiceError(w, err, "nama harus 2 sampai 100 karakter")
			return
		}
		httpx.WriteJSON(w, http.StatusOK, NewResponse(user))

	default:
		httpx.MethodNotAllowed(w, http.MethodGet, http.MethodPatch)
	}
}

// Password menangani PUT /api/v1/profile/password (wajib dibungkus Authenticate).
func (h *Handler) Password(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		httpx.MethodNotAllowed(w, http.MethodPut)
		return
	}

	user, ok := middleware.UserFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "token tidak valid")
		return
	}

	var input passwordInput
	if err := httpx.DecodeJSON(w, r, &input); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "format JSON tidak valid")
		return
	}

	if err := h.Service.ChangePassword(user, input.CurrentPassword, input.NewPassword); err != nil {
		writeServiceError(w, err, "password saat ini wajib diisi dan password baru harus 8 sampai 72 karakter")
		return
	}
	httpx.WriteJSON(w, http.StatusOK, map[string]string{"message": "password berhasil diubah"})
}

// Password salah dibalas 400 (bukan 401) agar interceptor frontend tidak
// salah mengira sesi login sudah habis.
func writeServiceError(w http.ResponseWriter, err error, invalidMessage string) {
	switch {
	case errors.Is(err, ErrInvalidInput):
		httpx.WriteError(w, http.StatusBadRequest, invalidMessage)
	case errors.Is(err, ErrWrongPassword):
		httpx.WriteError(w, http.StatusBadRequest, "password saat ini salah")
	case errors.Is(err, ErrSamePassword):
		httpx.WriteError(w, http.StatusBadRequest, "password baru harus berbeda dari password saat ini")
	default:
		httpx.WriteError(w, http.StatusInternalServerError, "terjadi kesalahan internal")
	}
}