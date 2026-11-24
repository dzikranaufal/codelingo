package leaderboard

import (
	"errors"
	"net/http"
	"strconv"

	"codelingo/backend/internal/httpx"
	"codelingo/backend/internal/middleware"
)

type Handler struct {
	Service *Service
}

// List menangani GET /api/v1/leaderboard?limit=10 (wajib dibungkus Authenticate).
func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		httpx.MethodNotAllowed(w, http.MethodGet)
		return
	}

	viewer, ok := middleware.UserFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "token tidak valid")
		return
	}

	limit := DefaultLimit
	if raw := r.URL.Query().Get("limit"); raw != "" {
		n, err := strconv.Atoi(raw)
		if err != nil || n < 1 || n > MaxLimit {
			httpx.WriteError(w, http.StatusBadRequest, "limit harus angka 1 sampai 100")
			return
		}
		limit = n
	}

	resp, err := h.Service.Get(viewer, limit)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "terjadi kesalahan internal")
		return
	}
	httpx.WriteJSON(w, http.StatusOK, resp)
}

// SetStatus menangani PUT /api/v1/leaderboard/status dengan body {"status": "🔥"}.
// Status kosong ("") berarti hapus status. Wajib Authenticate + RequireRole(user).
func (h *Handler) SetStatus(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		httpx.MethodNotAllowed(w, http.MethodPut)
		return
	}
	viewer, ok := middleware.UserFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "token tidak valid")
		return
	}

	var in struct {
		Status string `json:"status"`
	}
	if err := httpx.DecodeJSON(w, r, &in); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "format JSON tidak valid")
		return
	}

	saved, err := h.Service.SetStatus(viewer.ID, in.Status)
	if err != nil {
		if errors.Is(err, ErrInvalidStatus) {
			httpx.WriteError(w, http.StatusBadRequest, "status harus salah satu emoji dari daftar")
			return
		}
		httpx.WriteError(w, http.StatusInternalServerError, "terjadi kesalahan internal")
		return
	}
	httpx.WriteJSON(w, http.StatusOK, map[string]string{"status": saved})
}
