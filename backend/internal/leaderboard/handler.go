package leaderboard

import (
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