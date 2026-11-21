package admin

import (
	"net/http"

	"codelingo/backend/internal/httpx"

	"gorm.io/gorm"
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

func pathSummaryQuery(db *gorm.DB) *gorm.DB {
	return db.Table("learning_paths AS lp").
		Select("lp.id AS id, lp.name AS name, lp.description AS description, " +
			"lp.language_id AS language_id, COALESCE(lg.name, '') AS language_name, " +
			"COALESCE(lg.is_available, 0) AS language_available, lp.order_index AS order_index, " +
			"(SELECT COUNT(*) FROM learning_path_lessons plp WHERE plp.learning_path_id = lp.id) AS lesson_count").
		Joins("LEFT JOIN languages lg ON lg.id = lp.language_id")
}

func (s *Service) pathSummaryByID(tx *gorm.DB, id uint) (*PathSummary, error) {
	var row PathSummary
	if err := pathSummaryQuery(tx).Where("lp.id = ?", id).Limit(1).Scan(&row).Error; err != nil {
		return nil, internalErr("load path", err)
	}
	if row.ID == 0 {
		return nil, newErr(http.StatusNotFound, "path tidak ditemukan")
	}
	return &row, nil
}

// ListPaths mengembalikan semua learning path beserta bahasa dan jumlah lesson-nya.
func (s *Service) ListPaths() ([]PathSummary, error) {
	var paths []PathSummary
	err := pathSummaryQuery(s.DB).
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

// Paths menangani:
//
//	GET  /api/v1/admin/learning-paths  daftar path
//	POST /api/v1/admin/learning-paths  tambah path
func (h *Handler) Paths(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		paths, err := h.Service.ListPaths()
		if err != nil {
			writeError(w, err)
			return
		}
		httpx.WriteJSON(w, http.StatusOK, map[string]any{"learning_paths": paths})

	case http.MethodPost:
		var in CreatePathInput
		if err := httpx.DecodeJSON(w, r, &in); err != nil {
			httpx.WriteError(w, http.StatusBadRequest, badBody)
			return
		}
		path, err := h.Service.CreatePath(in)
		if err != nil {
			writeError(w, err)
			return
		}
		httpx.WriteJSON(w, http.StatusCreated, path)

	default:
		httpx.MethodNotAllowed(w, http.MethodGet, http.MethodPost)
	}
}

// pathItem dipanggil dari PathRoutes untuk /api/v1/admin/learning-paths/{id}:
//
//	PATCH  ubah path
//	DELETE hapus path (409 jika masih punya lesson)
func (h *Handler) pathItem(w http.ResponseWriter, r *http.Request, pathID uint) {
	switch r.Method {
	case http.MethodPatch:
		var in UpdatePathInput
		if err := httpx.DecodeJSON(w, r, &in); err != nil {
			httpx.WriteError(w, http.StatusBadRequest, badBody)
			return
		}
		path, err := h.Service.UpdatePath(pathID, in)
		if err != nil {
			writeError(w, err)
			return
		}
		httpx.WriteJSON(w, http.StatusOK, path)

	case http.MethodDelete:
		if err := h.Service.DeletePath(pathID); err != nil {
			writeError(w, err)
			return
		}
		httpx.WriteJSON(w, http.StatusOK, map[string]string{"message": "path berhasil dihapus"})

	default:
		httpx.MethodNotAllowed(w, http.MethodPatch, http.MethodDelete)
	}
}

// Languages menangani GET /api/v1/admin/languages.
func (h *Handler) Languages(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		httpx.MethodNotAllowed(w, http.MethodGet)
		return
	}
	languages, err := h.Service.ListLanguages()
	if err != nil {
		writeError(w, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, map[string]any{"languages": languages})
}