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

type Service struct {
	DB *gorm.DB
}

// ---------- tipe data ----------

type CreateLessonInput struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Level       *int   `json:"level"`
	OrderIndex  *int   `json:"order_index"`
}

type UpdateLessonInput struct {
	Title       *string `json:"title"`
	Description *string `json:"description"`
	Level       *int    `json:"level"`
	OrderIndex  *int    `json:"order_index"`
}

type LessonView struct {
	ID             uint   `json:"id"`
	Title          string `json:"title"`
	Description    string `json:"description"`
	Level          int    `json:"level"`
	LearningPathID uint   `json:"learning_path_id"`
	OrderIndex     int    `json:"order_index"`
	QuestionCount  int    `json:"question_count"`
}

type PathInfo struct {
	ID          uint   `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	LanguageID  *uint  `json:"language_id"`
	OrderIndex  int    `json:"order_index"`
}

type LessonListResponse struct {
	LearningPath PathInfo     `json:"learning_path"`
	Lessons      []LessonView `json:"lessons"`
}

// Tampilan admin memuat kunci jawaban dan penjelasan (berbeda dari tampilan pelajar).
type AdminOption struct {
	ID        uint   `json:"id"`
	Text      string `json:"text"`
	IsCorrect bool   `json:"is_correct"`
}

type AdminQuestion struct {
	ID          uint          `json:"id"`
	Text        string        `json:"text"`
	Type        string        `json:"type"`
	XPReward    int           `json:"xp_reward"`
	Explanation string        `json:"explanation"`
	Options     []AdminOption `json:"options"`
}

type LessonDetail struct {
	LessonView
	Questions []AdminQuestion `json:"questions"`
}

// ---------- validasi ----------

func validateTitle(s string) (string, error) {
	s = strings.TrimSpace(s)
	if n := utf8.RuneCountInString(s); n < 1 || n > 150 {
		return "", newErr(http.StatusBadRequest, "judul wajib diisi, maksimal 150 karakter")
	}
	return s, nil
}

func validateDescription(s string) (string, error) {
	s = strings.TrimSpace(s)
	if utf8.RuneCountInString(s) > 5000 {
		return "", newErr(http.StatusBadRequest, "deskripsi maksimal 5000 karakter")
	}
	return s, nil
}

func validateLevel(n int) error {
	if n < 1 || n > 100 {
		return newErr(http.StatusBadRequest, "level harus 1 sampai 100")
	}
	return nil
}

func validateOrder(n int) error {
	if n < 1 {
		return newErr(http.StatusBadRequest, "order_index minimal 1")
	}
	return nil
}

// ---------- helper ----------

// availablePath memastikan path ada dan bahasanya sudah dibuka (is_available).
// Saat ini hanya bahasa C yang dibuka.
func (s *Service) availablePath(tx *gorm.DB, pathID uint) (*models.LearningPath, error) {
	var path models.LearningPath
	if err := tx.First(&path, pathID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, newErr(http.StatusNotFound, "path tidak ditemukan")
		}
		return nil, internalErr("find path", err)
	}
	if path.LanguageID == nil {
		return nil, newErr(http.StatusForbidden, "path belum terhubung ke bahasa")
	}

	var lang models.Language
	if err := tx.First(&lang, *path.LanguageID).Error; err != nil {
		return nil, internalErr("find language", err)
	}
	if !lang.IsAvailable {
		return nil, newErr(http.StatusForbidden, fmt.Sprintf("materi untuk bahasa %s belum dibuka", lang.Name))
	}
	return &path, nil
}

func (s *Service) lessonWithLink(tx *gorm.DB, lessonID uint) (*models.Lesson, *models.LearningPathLesson, error) {
	var lesson models.Lesson
	if err := tx.First(&lesson, lessonID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil, newErr(http.StatusNotFound, "lesson tidak ditemukan")
		}
		return nil, nil, internalErr("find lesson", err)
	}

	var link models.LearningPathLesson
	err := tx.Where("lesson_id = ?", lessonID).Order("learning_path_id ASC").First(&link).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil, newErr(http.StatusNotFound, "lesson belum terhubung ke path")
		}
		return nil, nil, internalErr("find lesson link", err)
	}
	return &lesson, &link, nil
}

func (s *Service) ensureOrderFree(tx *gorm.DB, pathID uint, order int, excludeLessonID uint) error {
	q := tx.Model(&models.LearningPathLesson{}).
		Where("learning_path_id = ? AND order_index = ?", pathID, order)
	if excludeLessonID != 0 {
		q = q.Where("lesson_id <> ?", excludeLessonID)
	}

	var used int64
	if err := q.Count(&used).Error; err != nil {
		return internalErr("check order", err)
	}
	if used > 0 {
		return newErr(http.StatusConflict, fmt.Sprintf("urutan %d sudah dipakai lesson lain di path ini", order))
	}
	return nil
}

func (s *Service) countQuestions(tx *gorm.DB, lessonID uint) (int, error) {
	var n int64
	if err := tx.Model(&models.Question{}).Where("lesson_id = ?", lessonID).Count(&n).Error; err != nil {
		return 0, internalErr("count questions", err)
	}
	return int(n), nil
}

func buildView(l *models.Lesson, link *models.LearningPathLesson, questionCount int) *LessonView {
	return &LessonView{
		ID:             l.ID,
		Title:          l.Title,
		Description:    l.Description,
		Level:          l.Level,
		LearningPathID: link.LearningPathID,
		OrderIndex:     link.OrderIndex,
		QuestionCount:  questionCount,
	}
}

// ---------- operasi ----------

// ListLessons: daftar lesson dalam satu path, urut berdasarkan order_index.
func (s *Service) ListLessons(pathID uint) (*LessonListResponse, error) {
	var path models.LearningPath
	if err := s.DB.First(&path, pathID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, newErr(http.StatusNotFound, "path tidak ditemukan")
		}
		return nil, internalErr("find path", err)
	}

	var lessons []LessonView
	err := s.DB.Table("learning_path_lessons AS plp").
		Select("l.id AS id, l.title AS title, l.description AS description, l.level AS level, "+
			"plp.learning_path_id AS learning_path_id, plp.order_index AS order_index, "+
			"(SELECT COUNT(*) FROM questions q WHERE q.lesson_id = l.id) AS question_count").
		Joins("JOIN lessons l ON l.id = plp.lesson_id").
		Where("plp.learning_path_id = ?", path.ID).
		Order("plp.order_index ASC").
		Scan(&lessons).Error
	if err != nil {
		return nil, internalErr("list lessons", err)
	}
	if lessons == nil {
		lessons = []LessonView{}
	}

	return &LessonListResponse{
		LearningPath: PathInfo{
			ID:          path.ID,
			Name:        path.Name,
			Description: path.Description,
			LanguageID:  path.LanguageID,
			OrderIndex:  path.OrderIndex,
		},
		Lessons: lessons,
	}, nil
}

// GetLesson: detail lesson beserta soal, opsi, kunci jawaban, dan penjelasan.
func (s *Service) GetLesson(lessonID uint) (*LessonDetail, error) {
	lesson, link, err := s.lessonWithLink(s.DB, lessonID)
	if err != nil {
		return nil, err
	}

	var questions []models.Question
	if err := s.DB.Where("lesson_id = ?", lesson.ID).Order("id ASC").Find(&questions).Error; err != nil {
		return nil, internalErr("list questions", err)
	}

	optionsByQuestion := make(map[uint][]AdminOption, len(questions))
	if len(questions) > 0 {
		ids := make([]uint, 0, len(questions))
		for _, q := range questions {
			ids = append(ids, q.ID)
		}

		var options []models.AnswerOption
		if err := s.DB.Where("question_id IN ?", ids).Order("id ASC").Find(&options).Error; err != nil {
			return nil, internalErr("list options", err)
		}
		for _, o := range options {
			optionsByQuestion[o.QuestionID] = append(optionsByQuestion[o.QuestionID],
				AdminOption{ID: o.ID, Text: o.OptionText, IsCorrect: o.IsCorrect})
		}
	}

	views := make([]AdminQuestion, 0, len(questions))
	for _, q := range questions {
		opts := optionsByQuestion[q.ID]
		if opts == nil {
			opts = []AdminOption{}
		}
		views = append(views, AdminQuestion{
			ID:          q.ID,
			Text:        q.QuestionText,
			Type:        q.QuestionType,
			XPReward:    q.XPReward,
			Explanation: q.Explanation,
			Options:     opts,
		})
	}

	return &LessonDetail{
		LessonView: *buildView(lesson, link, len(questions)),
		Questions:  views,
	}, nil
}

// CreateLesson: tambah lesson di dalam sebuah path. Jika order_index tidak diisi,
// lesson ditaruh di urutan paling akhir.
func (s *Service) CreateLesson(pathID uint, in CreateLessonInput) (*LessonView, error) {
	title, err := validateTitle(in.Title)
	if err != nil {
		return nil, err
	}
	description, err := validateDescription(in.Description)
	if err != nil {
		return nil, err
	}
	level := 1
	if in.Level != nil {
		if err := validateLevel(*in.Level); err != nil {
			return nil, err
		}
		level = *in.Level
	}
	if in.OrderIndex != nil {
		if err := validateOrder(*in.OrderIndex); err != nil {
			return nil, err
		}
	}

	var view *LessonView
	err = s.DB.Transaction(func(tx *gorm.DB) error {
		if _, err := s.availablePath(tx, pathID); err != nil {
			return err
		}

		var order int
		if in.OrderIndex != nil {
			order = *in.OrderIndex
			if err := s.ensureOrderFree(tx, pathID, order, 0); err != nil {
				return err
			}
		} else {
			var maxOrder int
			err := tx.Model(&models.LearningPathLesson{}).
				Where("learning_path_id = ?", pathID).
				Select("COALESCE(MAX(order_index), 0)").
				Scan(&maxOrder).Error
			if err != nil {
				return internalErr("max order", err)
			}
			order = maxOrder + 1
		}

		lesson := models.Lesson{Title: title, Description: description, Level: level}
		if err := tx.Create(&lesson).Error; err != nil {
			return internalErr("create lesson", err)
		}

		link := models.LearningPathLesson{LearningPathID: pathID, LessonID: lesson.ID, OrderIndex: order}
		if err := tx.Create(&link).Error; err != nil {
			return internalErr("create lesson link", err)
		}

		view = buildView(&lesson, &link, 0)
		return nil
	})
	if err != nil {
		return nil, err
	}
	return view, nil
}

// UpdateLesson: ubah sebagian field lesson (title, description, level, order_index).
// Path dan bahasa tidak bisa dipindah lewat endpoint ini.
func (s *Service) UpdateLesson(lessonID uint, in UpdateLessonInput) (*LessonView, error) {
	if in.Title == nil && in.Description == nil && in.Level == nil && in.OrderIndex == nil {
		return nil, newErr(http.StatusBadRequest, "tidak ada field yang diubah")
	}

	updates := map[string]interface{}{}
	if in.Title != nil {
		t, err := validateTitle(*in.Title)
		if err != nil {
			return nil, err
		}
		updates["title"] = t
	}
	if in.Description != nil {
		d, err := validateDescription(*in.Description)
		if err != nil {
			return nil, err
		}
		updates["description"] = d
	}
	if in.Level != nil {
		if err := validateLevel(*in.Level); err != nil {
			return nil, err
		}
		updates["level"] = *in.Level
	}
	if in.OrderIndex != nil {
		if err := validateOrder(*in.OrderIndex); err != nil {
			return nil, err
		}
	}

	var view *LessonView
	err := s.DB.Transaction(func(tx *gorm.DB) error {
		lesson, link, err := s.lessonWithLink(tx, lessonID)
		if err != nil {
			return err
		}
		if _, err := s.availablePath(tx, link.LearningPathID); err != nil {
			return err
		}

		if in.OrderIndex != nil && *in.OrderIndex != link.OrderIndex {
			if err := s.ensureOrderFree(tx, link.LearningPathID, *in.OrderIndex, lesson.ID); err != nil {
				return err
			}
			err := tx.Model(&models.LearningPathLesson{}).
				Where("learning_path_id = ? AND lesson_id = ?", link.LearningPathID, link.LessonID).
				Update("order_index", *in.OrderIndex).Error
			if err != nil {
				return internalErr("update order", err)
			}
			link.OrderIndex = *in.OrderIndex
		}

		if len(updates) > 0 {
			if err := tx.Model(lesson).Updates(updates).Error; err != nil {
				return internalErr("update lesson", err)
			}
			if err := tx.First(lesson, lessonID).Error; err != nil {
				return internalErr("reload lesson", err)
			}
		}

		count, err := s.countQuestions(tx, lesson.ID)
		if err != nil {
			return err
		}
		view = buildView(lesson, link, count)
		return nil
	})
	if err != nil {
		return nil, err
	}
	return view, nil
}

// DeleteLesson: hapus lesson. Ditolak (409) jika masih punya soal atau sudah ada
// progress pengguna, supaya data dan riwayat tidak hilang diam-diam.
func (s *Service) DeleteLesson(lessonID uint) error {
	return s.DB.Transaction(func(tx *gorm.DB) error {
		lesson, link, err := s.lessonWithLink(tx, lessonID)
		if err != nil {
			return err
		}
		if _, err := s.availablePath(tx, link.LearningPathID); err != nil {
			return err
		}

		questions, err := s.countQuestions(tx, lesson.ID)
		if err != nil {
			return err
		}
		if questions > 0 {
			return newErr(http.StatusConflict,
				fmt.Sprintf("lesson masih memiliki %d soal; hapus soalnya terlebih dahulu", questions))
		}

		var progress int64
		if err := tx.Model(&models.Progress{}).Where("lesson_id = ?", lesson.ID).Count(&progress).Error; err != nil {
			return internalErr("count progress", err)
		}
		if progress > 0 {
			return newErr(http.StatusConflict, "lesson sudah memiliki progress pengguna sehingga tidak bisa dihapus")
		}

		if err := tx.Where("lesson_id = ?", lesson.ID).Delete(&models.LearningPathLesson{}).Error; err != nil {
			return internalErr("delete lesson link", err)
		}
		if err := tx.Delete(&models.Lesson{}, lesson.ID).Error; err != nil {
			return internalErr("delete lesson", err)
		}
		return nil
	})
}