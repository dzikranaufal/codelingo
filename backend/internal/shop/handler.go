package shop

import (
	"errors"
	"net/http"

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

// Shop menangani GET /api/v1/shop (katalog dan status barang).
func (h *Handler) Shop(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		httpx.MethodNotAllowed(w, http.MethodGet)
		return
	}
	user, ok := middleware.UserFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "token tidak valid")
		return
	}
	resp, err := h.Service.Get(user.ID)
	if err != nil {
		writeError(w, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, resp)
}

// Purchase menangani POST /api/v1/shop/purchase dengan body {"item": "heart_refill"}.
func (h *Handler) Purchase(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		httpx.MethodNotAllowed(w, http.MethodPost)
		return
	}
	user, ok := middleware.UserFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "token tidak valid")
		return
	}
	var in struct {
		Item string `json:"item"`
	}
	if err := httpx.DecodeJSON(w, r, &in); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "format JSON tidak valid")
		return
	}
	resp, err := h.Service.Purchase(user.ID, in.Item)
	if err != nil {
		writeError(w, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, resp)
}
