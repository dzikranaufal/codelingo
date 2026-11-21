package admin

import (
	"errors"
	"fmt"
	"net/http"
	"strings"
	"unicode/utf8"

	"codelingo/backend/internal/models"

	"gorm.io/gorm"
)

type CreatePathInput struct {
	LanguageID  uint   `json:"language_id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	OrderIndex  *int   `json:"order_index"`
}

// UpdatePathInput: bahasa sebuah path tidak bisa dipindah lewat endpoint ini.
type UpdatePathInput struct {
	Name        *string `json:"name"`
	Description *string `json:"description"`
	OrderIndex  *int    `json:"order_index"`
}

type LanguageView struct {
	ID          uint   `json:"id"`
	Name        string `json:"name"`
	Slug        string `json:"slug"`
	IsAvailable bool   `json:"is_available"`
	PathCount   int    `json:"path_count"`
}

func validatePathName(s string) (string, error) {
	s = strings.TrimSpace(s)
	if n := utf8.RuneCountInString(s); n < 1 || n > 100 {
		return "", newErr(http.StatusBadRequest, "nama path wajib diisi, maksimal 100 karakter")
	}
	return s, nil
}

// ensurePathOrderFree: urutan path harus unik di dalam satu bahasa.
func (s *Service) ensurePathOrderFree(tx *gorm.DB, languageID uint, order int, excludePathID uint) error {
	q := tx.Model(&models.LearningPath{}).
		Where("language_id = ? AND order_index = ?", languageID, order)
	if excludePathID != 0 {
		q = q.Where("id <> ?", excludePathID)
	}

	var used int64
	if err := q.Count(&used).Error; err != nil {
		return internalErr("check path order", err)
	}
	if used > 0 {
		return newErr(http.StatusConflict, fmt.Sprintf("urutan %d sudah dipakai path lain di bahasa ini", order))
	}
	return nil
}

func (s *Service) ListLanguages() ([]LanguageView, error) {
	var languages []LanguageView
	err := s.DB.Table("languages AS lg").
		Select("lg.id AS id, lg.name AS name, lg.slug AS slug, lg.is_available AS is_available, " +
			"(SELECT COUNT(*) FROM learning_paths lp WHERE lp.language_id = lg.id) AS path_count").
		Order("lg.name ASC").
		Scan(&languages).Error
	if err != nil {
		return nil, internalErr("list languages", err)
	}
	if languages == nil {
		languages = []LanguageView{}
	}
	return languages, nil
}

// CreatePath: tambah path di sebuah bahasa yang materinya sudah dibuka (saat ini C).
func (s *Service) CreatePath(in CreatePathInput) (*PathSummary, error) {
	if in.LanguageID == 0 {
		return nil, newErr(http.StatusBadRequest, "language_id wajib diisi")
	}
	name, err := validatePathName(in.Name)
	if err != nil {
		return nil, err
	}
	description, err := validateDescription(in.Description)
	if err != nil {
		return nil, err
	}
	if in.OrderIndex != nil {
		if err := validateOrder(*in.OrderIndex); err != nil {
			return nil, err
		}
	}

	var result *PathSummary
	err = s.DB.Transaction(func(tx *gorm.DB) error {
		var lang models.Language
		if err := tx.First(&lang, in.LanguageID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return newErr(http.StatusNotFound, "bahasa tidak ditemukan")
			}
			return internalErr("find language", err)
		}
		if !lang.IsAvailable {
			return newErr(http.StatusForbidden, fmt.Sprintf("materi untuk bahasa %s belum dibuka", lang.Name))
		}

		var order int
		if in.OrderIndex != nil {
			order = *in.OrderIndex
			if err := s.ensurePathOrderFree(tx, lang.ID, order, 0); err != nil {
				return err
			}
		} else {
			var maxOrder int
			err := tx.Model(&models.LearningPath{}).
				Where("language_id = ?", lang.ID).
				Select("COALESCE(MAX(order_index), 0)").
				Scan(&maxOrder).Error
			if err != nil {
				return internalErr("max path order", err)
			}
			order = maxOrder + 1
		}

		langID := lang.ID
		path := models.LearningPath{Name: name, Description: description, LanguageID: &langID, OrderIndex: order}
		if err := tx.Create(&path).Error; err != nil {
			return internalErr("create path", err)
		}

		result, err = s.pathSummaryByID(tx, path.ID)
		return err
	})
	if err != nil {
		return nil, err
	}
	return result, nil
}

// UpdatePath: ubah nama, deskripsi, atau urutan path.
func (s *Service) UpdatePath(pathID uint, in UpdatePathInput) (*PathSummary, error) {
	if in.Name == nil && in.Description == nil && in.OrderIndex == nil {
		return nil, newErr(http.StatusBadRequest, "tidak ada field yang diubah")
	}

	updates := map[string]interface{}{}
	if in.Name != nil {
		n, err := validatePathName(*in.Name)
		if err != nil {
			return nil, err
		}
		updates["name"] = n
	}
	if in.Description != nil {
		d, err := validateDescription(*in.Description)
		if err != nil {
			return nil, err
		}
		updates["description"] = d
	}
	if in.OrderIndex != nil {
		if err := validateOrder(*in.OrderIndex); err != nil {
			return nil, err
		}
		updates["order_index"] = *in.OrderIndex
	}

	var result *PathSummary
	err := s.DB.Transaction(func(tx *gorm.DB) error {
		path, err := s.availablePath(tx, pathID)
		if err != nil {
			return err
		}

		if in.OrderIndex != nil && *in.OrderIndex != path.OrderIndex {
			if err := s.ensurePathOrderFree(tx, *path.LanguageID, *in.OrderIndex, path.ID); err != nil {
				return err
			}
		}
		if err := tx.Model(path).Updates(updates).Error; err != nil {
			return internalErr("update path", err)
		}

		result, err = s.pathSummaryByID(tx, path.ID)
		return err
	})
	if err != nil {
		return nil, err
	}
	return result, nil
}

// DeletePath: hapus path. Ditolak (409) jika masih punya lesson.
func (s *Service) DeletePath(pathID uint) error {
	return s.DB.Transaction(func(tx *gorm.DB) error {
		path, err := s.availablePath(tx, pathID)
		if err != nil {
			return err
		}

		var lessons int64
		err = tx.Model(&models.LearningPathLesson{}).Where("learning_path_id = ?", path.ID).Count(&lessons).Error
		if err != nil {
			return internalErr("count path lessons", err)
		}
		if lessons > 0 {
			return newErr(http.StatusConflict,
				fmt.Sprintf("path masih memiliki %d lesson; hapus lesson terlebih dahulu", lessons))
		}

		if err := tx.Delete(&models.LearningPath{}, path.ID).Error; err != nil {
			return internalErr("delete path", err)
		}
		return nil
	})
}