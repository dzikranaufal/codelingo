package content

import (
	"net/http"
	"strings"

	"codelingo/backend/internal/httpx"
	"codelingo/backend/internal/middleware"
)

const lessonsPrefix = "/api/v1/lessons/"

type Handler struct {
	Service *Service
}

// Path menangani GET /api/v1/learning-path?language=c
func (h *Handler) Path(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		httpx.MethodNotAllowed(w, http.MethodGet)
		return
	}
	user, ok := middleware.UserFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "token tidak valid")
		return
	}
	resp, err := h.Service.LearningPath(user.ID, strings.TrimSpace(r.URL.Query().Get("language")))
	if err != nil {
		writeError(w, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, resp)
}

// Stats menangani GET /api/v1/me/stats
func (h *Handler) Stats(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		httpx.MethodNotAllowed(w, http.MethodGet)
		return
	}
	user, ok := middleware.UserFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "token tidak valid")
		return
	}
	resp, err := h.Service.Stats(user.ID)
	if err != nil {
		writeError(w, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, resp)
}

// LessonRoutes menangani:
//
//	GET  /api/v1/lessons/{id}           isi pelajaran (tanpa kunci jawaban)
//	POST /api/v1/lessons/{id}/answers   kirim satu jawaban {step_id, answer}
//	POST /api/v1/lessons/{id}/complete  selesaikan pelajaran
func (h *Handler) LessonRoutes(w http.ResponseWriter, r *http.Request) {
	user, ok := middleware.UserFromContext(r.Context())
	if !ok {
		httpx.WriteError(w, http.StatusUnauthorized, "token tidak valid")
		return
	}

	rest := strings.Trim(strings.TrimPrefix(r.URL.Path, lessonsPrefix), "/")
	if rest == "" {
		httpx.WriteError(w, http.StatusNotFound, "alamat tidak ditemukan")
		return
	}
	parts := strings.Split(rest, "/")
	if len(parts) > 2 {
		httpx.WriteError(w, http.StatusNotFound, "alamat tidak ditemukan")
		return
	}
	lessonID, ok := parseID(parts[0])
	if !ok {
		httpx.WriteError(w, http.StatusBadRequest, "id pelajaran tidak valid")
		return
	}

	if len(parts) == 1 {
		if r.Method != http.MethodGet {
			httpx.MethodNotAllowed(w, http.MethodGet)
			return
		}
		resp, err := h.Service.Lesson(user.ID, lessonID)
		if err != nil {
			writeError(w, err)
			return
		}
		httpx.WriteJSON(w, http.StatusOK, resp)
		return
	}

	switch parts[1] {
	case "answers":
		if r.Method != http.MethodPost {
			httpx.MethodNotAllowed(w, http.MethodPost)
			return
		}
		var in AnswerInput
		if err := httpx.DecodeJSON(w, r, &in); err != nil {
			httpx.WriteError(w, http.StatusBadRequest, "format JSON tidak valid; answer harus berupa angka indeks pilihan")
			return
		}
		resp, err := h.Service.Answer(user.ID, lessonID, in)
		if err != nil {
			writeError(w, err)
			return
		}
		httpx.WriteJSON(w, http.StatusOK, resp)

	case "complete":
		if r.Method != http.MethodPost {
			httpx.MethodNotAllowed(w, http.MethodPost)
			return
		}
		resp, err := h.Service.Complete(user.ID, lessonID)
		if err != nil {
			writeError(w, err)
			return
		}
		httpx.WriteJSON(w, http.StatusOK, resp)

	default:
		httpx.WriteError(w, http.StatusNotFound, "alamat tidak ditemukan")
	}
}
