package quest

import (
	"errors"
	"net/http"
	"strings"

	"codelingo/backend/internal/httpx"
	"codelingo/backend/internal/middleware"
)

type Handler struct {
	Service *Service
}

func writeError(w http.ResponseWriter, err error) {
	var apiErr *APIError
	if errors.As(err, &apiErr) {
		httpx.WriteError(w, apiErr.Status, apiErr.Message)
		return
	}
	httpx.WriteError(w, http.StatusInternalServerError, "terjadi kesalahan internal")
}

// List menangani GET /api/v1/quests.
func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		httpx.MethodNotAllowed(w, http.MethodGet)
		return
	}
	user, ok := middleware.UserFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "token tidak valid")
		return
	}
	resp, err := h.Service.List(user.ID)
	if err != nil {
		writeError(w, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, resp)
}

// Claim menangani POST /api/v1/quests/{id}/claim.
func (h *Handler) Claim(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		httpx.MethodNotAllowed(w, http.MethodPost)
		return
	}
	user, ok := middleware.UserFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "token tidak valid")
		return
	}
	rest := strings.TrimPrefix(r.URL.Path, "/api/v1/quests/")
	id, tail, found := strings.Cut(rest, "/")
	if !found || tail != "claim" || id == "" {
		httpx.WriteError(w, http.StatusNotFound, "endpoint tidak ditemukan")
		return
	}
	resp, err := h.Service.Claim(user.ID, id)
	if err != nil {
		writeError(w, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, resp)
}
