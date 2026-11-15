package admin

import (
	"net/http"

	"codelingo/backend/internal/httpx"
)

type PathSummary struct {
	ID                uint   `json:"id"`
	Name              string `json:"name"`
	Description       string `json:"description"`
	LanguageID        *uint  `json:"language_id"`
	LanguageName      string `json:"language_name"`
	LanguageAvailable bool   `json:"language_available"`
	OrderIndex        int    `json:"order_index"`
	LessonCount       int    `json:"lesson_count"`
}

// ListPaths mengembalikan semua learning path beserta bahasa dan jumlah lesson-nya.
func (s *Service) ListPaths() ([]PathSummary, error) {
	var paths []PathSummary
	err := s.DB.Table("learning_paths AS lp").
		Select("lp.id AS id, lp.name AS name, lp.description AS description, "+
			"lp.language_id AS language_id, COALESCE(lg.name, '') AS language_name, "+
			"COALESCE(lg.is_available, 0) AS language_available, lp.order_index AS order_index, "+
			"(SELECT COUNT(*) FROM learning_path_lessons plp WHERE plp.learning_path_id = lp.id) AS lesson_count").
		Joins("LEFT JOIN languages lg ON lg.id = lp.language_id").
		Order("lg.name ASC, lp.order_index ASC, lp.id ASC").
		Scan(&paths).Error
	if err != nil {
		return nil, internalErr("list paths", err)
	}
	if paths == nil {
		paths = []PathSummary{}
	}
	return paths, nil
}

// Paths menangani GET /api/v1/admin/learning-paths.
func (h *Handler) Paths(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		httpx.MethodNotAllowed(w, http.MethodGet)
		return
	}
	paths, err := h.Service.ListPaths()
	if err != nil {
		writeError(w, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, map[string]any{"paths_placeholder": nil, "learning_paths": paths})
}