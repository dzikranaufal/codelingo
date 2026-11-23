package missions

import (
	"codelingo/backend/internal/httpx"
	"codelingo/backend/internal/middleware"
	"net/http"
)

type Handler struct{ Service *Service }

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
	result, err := h.Service.Get(user.ID)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "gagal mengambil progres misi")
		return
	}
	httpx.WriteJSON(w, http.StatusOK, result)
}
