package admin

import (
	"net/http"
	"strings"

	"codelingo/backend/internal/httpx"
)

const adminQuestionsPrefix = "/api/v1/admin/questions/"

// createQuestion dipanggil dari LessonRoutes untuk POST /api/v1/admin/lessons/{id}/questions.
func (h *Handler) createQuestion(w http.ResponseWriter, r *http.Request, lessonID uint) {
	if r.Method != http.MethodPost {
		httpx.MethodNotAllowed(w, http.MethodPost)
		return
	}

	var in CreateQuestionInput
	if err := httpx.DecodeJSON(w, r, &in); err != nil {
		httpx.WriteError(w, http.StatusBadRequest, badBody)
		return
	}
	q, err := h.Service.CreateQuestion(lessonID, in)
	if err != nil {
		writeError(w, err)
		return
	}
	httpx.WriteJSON(w, http.StatusCreated, q)
}

// QuestionRoutes menangani:
//
//	PATCH  /api/v1/admin/questions/{id}  ubah soal
//	DELETE /api/v1/admin/questions/{id}  hapus soal (409 jika sudah dijawab)
func (h *Handler) QuestionRoutes(w http.ResponseWriter, r *http.Request) {
	rest := strings.Trim(strings.TrimPrefix(r.URL.Path, adminQuestionsPrefix), "/")
	if rest == "" || strings.Contains(rest, "/") {
		httpx.WriteError(w, http.StatusNotFound, "alamat tidak ditemukan")
		return
	}

	questionID, ok := parseID(rest)
	if !ok {
		httpx.WriteError(w, http.StatusBadRequest, "id soal tidak valid")
		return
	}

	switch r.Method {
	case http.MethodPatch:
		var in UpdateQuestionInput
		if err := httpx.DecodeJSON(w, r, &in); err != nil {
			httpx.WriteError(w, http.StatusBadRequest, badBody)
			return
		}
		q, err := h.Service.UpdateQuestion(questionID, in)
		if err != nil {
			writeError(w, err)
			return
		}
		httpx.WriteJSON(w, http.StatusOK, q)

	case http.MethodDelete:
		if err := h.Service.DeleteQuestion(questionID); err != nil {
			writeError(w, err)
			return
		}
		httpx.WriteJSON(w, http.StatusOK, map[string]string{"message": "soal berhasil dihapus"})

	default:
		httpx.MethodNotAllowed(w, http.MethodPatch, http.MethodDelete)
	}
}