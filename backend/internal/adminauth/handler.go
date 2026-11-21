package adminauth

import (
	"errors"
	"net/http"

	"codelingo/backend/internal/httpx"
	"codelingo/backend/internal/middleware"
)

type Handler struct {
	Service *Service
}

// Login menangani POST /api/v1/admin/auth/login (tanpa token).
func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		httpx.MethodNotAllowed(w, http.MethodPost)
		return
	}

	var input LoginInput
	if err := httpx.DecodeJSON(w, r, &input); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "format JSON tidak valid")
		return
	}

	resp, err := h.Service.Login(input)
	if err != nil {
		if errors.Is(err, ErrInvalidCreds) {
			httpx.WriteError(w, http.StatusUnauthorized, "email/username atau password salah")
			return
		}
		httpx.WriteError(w, http.StatusInternalServerError, "terjadi kesalahan internal")
		return
	}
	httpx.WriteJSON(w, http.StatusOK, resp)
}

// Me menangani GET /api/v1/admin/me (wajib Authenticate + RequireRole admin).
// Dipakai frontend untuk memeriksa apakah token masih berlaku dan benar-benar
// milik admin, sekaligus untuk menguji penjagaan role.
func (h *Handler) Me(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		httpx.MethodNotAllowed(w, http.MethodGet)
		return
	}

	user, ok := middleware.UserFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "token tidak valid")
		return
	}
	httpx.WriteJSON(w, http.StatusOK, NewAdminUser(user))
}