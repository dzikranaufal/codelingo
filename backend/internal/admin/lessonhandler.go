package admin

import (
	"net/http"
	"strings"

	"codelingo/backend/internal/httpx"
)

const (
	adminPathsPrefix   = "/api/v1/admin/learning-paths/"
	adminLessonsPrefix = "/api/v1/admin/lessons/"
)

type Handler struct {
	Service *Service
}

const badBody = "format JSON tidak valid atau memuat field yang tidak dikenal"

// PathRoutes menangani:
//
//	GET  /api/v1/admin/learning-paths/{id}/lessons  daftar lesson dalam path
//	POST /api/v1/admin/learning-paths/{id}/lessons  tambah lesson
func (h *Handler) PathRoutes(w http.ResponseWriter, r *http.Request) {
	rest := strings.Trim(strings.TrimPrefix(r.URL.Path, adminPathsPrefix), "/")
	parts := strings.Split(rest, "/")
	if len(parts) != 2 || parts[1] != "lessons" {
		httpx.WriteError(w, http.StatusNotFound, "alamat tidak ditemukan")
		return
	}

	pathID, ok := parseID(parts[0])
	if !ok {
		httpx.WriteError(w, http.StatusBadRequest, "id path tidak valid")
		return
	}

	switch r.Method {
	case http.MethodGet:
		resp, err := h.Service.ListLessons(pathID)
		if err != nil {
			writeError(w, err)
			return
		}
		httpx.WriteJSON(w, http.StatusOK, resp)

	case http.MethodPost:
		var in CreateLessonInput
		if err := httpx.DecodeJSON(w, r, &in); err != nil {
			httpx.WriteError(w, http.StatusBadRequest, badBody)
			return
		}
		view, err := h.Service.CreateLesson(pathID, in)
		if err != nil {
			writeError(w, err)
			return
		}
		httpx.WriteJSON(w, http.StatusCreated, view)

	default:
		httpx.MethodNotAllowed(w, http.MethodGet, http.MethodPost)
	}
}

// LessonRoutes menangani:
//
//	GET    /api/v1/admin/lessons/{id}  detail lesson + soal + kunci jawaban
//	PATCH  /api/v1/admin/lessons/{id}  ubah lesson
//	DELETE /api/v1/admin/lessons/{id}  hapus lesson (409 jika masih punya isi)
func (h *Handler) LessonRoutes(w http.ResponseWriter, r *http.Request) {
	rest := strings.Trim(strings.TrimPrefix(r.URL.Path, adminLessonsPrefix), "/")
	if rest == "" || strings.Contains(rest, "/") {
		httpx.WriteError(w, http.StatusNotFound, "alamat tidak ditemukan")
		return
	}

	lessonID, ok := parseID(rest)
	if !ok {
		httpx.WriteError(w, http.StatusBadRequest, "id lesson tidak valid")
		return
	}

	switch r.Method {
	case http.MethodGet:
		detail, err := h.Service.GetLesson(lessonID)
		if err != nil {
			writeError(w, err)
			return
		}
		httpx.WriteJSON(w, http.StatusOK, detail)

	case http.MethodPatch:
		var in UpdateLessonInput
		if err := httpx.DecodeJSON(w, r, &in); err != nil {
			httpx.WriteError(w, http.StatusBadRequest, badBody)
			return
		}
		view, err := h.Service.UpdateLesson(lessonID, in)
		if err != nil {
			writeError(w, err)
			return
		}
		httpx.WriteJSON(w, http.StatusOK, view)

	case http.MethodDelete:
		if err := h.Service.DeleteLesson(lessonID); err != nil {
			writeError(w, err)
			return
		}
		httpx.WriteJSON(w, http.StatusOK, map[string]string{"message": "lesson berhasil dihapus"})

	default:
		httpx.MethodNotAllowed(w, http.MethodGet, http.MethodPatch, http.MethodDelete)
	}
}