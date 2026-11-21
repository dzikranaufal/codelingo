package admin

import (
	"net/http"
	"strconv"
	"strings"

	"codelingo/backend/internal/httpx"
	"codelingo/backend/internal/middleware"
)

const adminUsersPrefix = "/api/v1/admin/users/"

// Users menangani GET /api/v1/admin/users?search=&limit=20&offset=0.
func (h *Handler) Users(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		httpx.MethodNotAllowed(w, http.MethodGet)
		return
	}

	limit, offset := 20, 0
	if raw := r.URL.Query().Get("limit"); raw != "" {
		n, err := strconv.Atoi(raw)
		if err != nil || n < 1 || n > 100 {
			httpx.WriteError(w, http.StatusBadRequest, "limit harus angka 1 sampai 100")
			return
		}
		limit = n
	}
	if raw := r.URL.Query().Get("offset"); raw != "" {
		n, err := strconv.Atoi(raw)
		if err != nil || n < 0 {
			httpx.WriteError(w, http.StatusBadRequest, "offset harus angka 0 atau lebih")
			return
		}
		offset = n
	}

	search := r.URL.Query().Get("search")
	if len(search) > 100 {
		httpx.WriteError(w, http.StatusBadRequest, "kata kunci maksimal 100 karakter")
		return
	}

	resp, err := h.Service.ListUsers(search, limit, offset)
	if err != nil {
		writeError(w, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, resp)
}

// UserRoutes menangani:
//
//	PATCH  /api/v1/admin/users/{id}  ubah role
//	DELETE /api/v1/admin/users/{id}  hapus akun
func (h *Handler) UserRoutes(w http.ResponseWriter, r *http.Request) {
	rest := strings.Trim(strings.TrimPrefix(r.URL.Path, adminUsersPrefix), "/")
	if rest == "" || strings.Contains(rest, "/") {
		httpx.WriteError(w, http.StatusNotFound, "alamat tidak ditemukan")
		return
	}
	targetID, ok := parseID(rest)
	if !ok {
		httpx.WriteError(w, http.StatusBadRequest, "id akun tidak valid")
		return
	}

	actor, ok := middleware.UserFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "token tidak valid")
		return
	}

	switch r.Method {
	case http.MethodPatch:
		var in UpdateUserInput
		if err := httpx.DecodeJSON(w, r, &in); err != nil {
			httpx.WriteError(w, http.StatusBadRequest, badBody)
			return
		}
		row, err := h.Service.UpdateUser(actor.ID, targetID, in)
		if err != nil {
			writeError(w, err)
			return
		}
		httpx.WriteJSON(w, http.StatusOK, row)

	case http.MethodDelete:
		if err := h.Service.DeleteUser(actor.ID, targetID); err != nil {
			writeError(w, err)
			return
		}
		httpx.WriteJSON(w, http.StatusOK, map[string]string{"message": "akun berhasil dihapus"})

	default:
		httpx.MethodNotAllowed(w, http.MethodPatch, http.MethodDelete)
	}
}