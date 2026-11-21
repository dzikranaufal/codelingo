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

const (
	questionTypeMC  = "multiple_choice"
	defaultXPReward = 10
	minOptions      = 2
	maxOptions      = 6
)

// ---------- tipe data ----------

type OptionInput struct {
	Text      string `json:"text"`
	IsCorrect bool   `json:"is_correct"`
}

type CreateQuestionInput struct {
	Text        string        `json:"text"`
	Type        string        `json:"type"`
	XPReward    *int          `json:"xp_reward"`
	Explanation string        `json:"explanation"`
	Options     []OptionInput `json:"options"`
}

// UpdateQuestionInput: semua field opsional. Jika "options" dikirim, seluruh opsi
// lama diganti dengan daftar baru (dalam satu transaksi).
type UpdateQuestionInput struct {
	Text        *string         `json:"text"`
	XPReward    *int            `json:"xp_reward"`
	Explanation *string         `json:"explanation"`
	Options     *[]OptionInput  `json:"options"`
}

// ---------- validasi ----------

func validateQuestionText(s string) (string, error) {
	s = strings.TrimSpace(s)
	if n := utf8.RuneCountInString(s); n < 1 || n > 2000 {
		return "", newErr(http.StatusBadRequest, "teks soal wajib diisi, maksimal 2000 karakter")
	}
	return s, nil
}

func validateExplanation(s string) (string, error) {
	s = strings.TrimSpace(s)
	if utf8.RuneCountInString(s) > 2000 {
		return "", newErr(http.StatusBadRequest, "penjelasan maksimal 2000 karakter")
	}
	return s, nil
}

func validateXP(n int) error {
	if n < 1 || n > 1000 {
		return newErr(http.StatusBadRequest, "xp_reward harus 1 sampai 1000")
	}
	return nil
}

// validateOptions: 2 sampai 6 opsi, teks tidak boleh kosong atau kembar,
// dan harus ada TEPAT satu jawaban benar.
func validateOptions(in []OptionInput) ([]OptionInput, error) {
	if len(in) < minOptions || len(in) > maxOptions {
		return nil, newErr(http.StatusBadRequest,
			fmt.Sprintf("jumlah opsi harus %d sampai %d", minOptions, maxOptions))
	}

	cleaned := make([]OptionInput, 0, len(in))
	seen := make(map[string]bool, len(in))
	correct := 0
	for _, o := range in {
		text := strings.TrimSpace(o.Text)
		if n := utf8.RuneCountInString(text); n < 1 || n > 300 {
			return nil, newErr(http.StatusBadRequest, "teks opsi wajib diisi, maksimal 300 karakter")
		}
		key := strings.ToLower(text)
		if seen[key] {
			return nil, newErr(http.StatusBadRequest, "teks opsi tidak boleh sama")
		}
		seen[key] = true
		if o.IsCorrect {
			correct++
		}
		cleaned = append(cleaned, OptionInput{Text: text, IsCorrect: o.IsCorrect})
	}
	if correct != 1 {
		return nil, newErr(http.StatusBadRequest, "harus ada tepat satu jawaban benar")
	}
	return cleaned, nil
}

// ---------- helper ----------

// questionInAvailablePath memuat soal dan memastikan lesson-nya berada di path
// yang bahasanya sudah dibuka (saat ini hanya C).
func (s *Service) questionInAvailablePath(tx *gorm.DB, questionID uint) (*models.Question, error) {
	var q models.Question
	if err := tx.First(&q, questionID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, newErr(http.StatusNotFound, "soal tidak ditemukan")
		}
		return nil, internalErr("find question", err)
	}

	_, link, err := s.lessonWithLink(tx, q.LessonID)
	if err != nil {
		return nil, err
	}
	if _, err := s.availablePath(tx, link.LearningPathID); err != nil {
		return nil, err
	}
	return &q, nil
}

func (s *Service) countAttempts(tx *gorm.DB, questionID uint) (int64, error) {
	var n int64
	if err := tx.Model(&models.QuizAttempt{}).Where("question_id = ?", questionID).Count(&n).Error; err != nil {
		return 0, internalErr("count attempts", err)
	}
	return n, nil
}

func (s *Service) createOptions(tx *gorm.DB, questionID uint, options []OptionInput) error {
	for _, o := range options {
		option := models.AnswerOption{QuestionID: questionID, OptionText: o.Text, IsCorrect: o.IsCorrect}
		if err := tx.Create(&option).Error; err != nil {
			return internalErr("create option", err)
		}
	}
	return nil
}

func (s *Service) loadAdminQuestion(tx *gorm.DB, questionID uint) (*AdminQuestion, error) {
	var q models.Question
	if err := tx.First(&q, questionID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, newErr(http.StatusNotFound, "soal tidak ditemukan")
		}
		return nil, internalErr("load question", err)
	}

	var options []models.AnswerOption
	if err := tx.Where("question_id = ?", q.ID).Order("id ASC").Find(&options).Error; err != nil {
		return nil, internalErr("load options", err)
	}

	views := make([]AdminOption, 0, len(options))
	for _, o := range options {
		views = append(views, AdminOption{ID: o.ID, Text: o.OptionText, IsCorrect: o.IsCorrect})
	}

	return &AdminQuestion{
		ID:          q.ID,
		Text:        q.QuestionText,
		Type:        q.QuestionType,
		XPReward:    q.XPReward,
		Explanation: q.Explanation,
		Options:     views,
	}, nil
}

// ---------- operasi ----------

// CreateQuestion: tambah soal pilihan ganda ke sebuah lesson.
func (s *Service) CreateQuestion(lessonID uint, in CreateQuestionInput) (*AdminQuestion, error) {
	text, err := validateQuestionText(in.Text)
	if err != nil {
		return nil, err
	}
	explanation, err := validateExplanation(in.Explanation)
	if err != nil {
		return nil, err
	}
	xp := defaultXPReward
	if in.XPReward != nil {
		if err := validateXP(*in.XPReward); err != nil {
			return nil, err
		}
		xp = *in.XPReward
	}
	if in.Type != "" && in.Type != questionTypeMC {
		return nil, newErr(http.StatusBadRequest, "tipe soal belum didukung; gunakan multiple_choice")
	}
	options, err := validateOptions(in.Options)
	if err != nil {
		return nil, err
	}

	var result *AdminQuestion
	err = s.DB.Transaction(func(tx *gorm.DB) error {
		_, link, err := s.lessonWithLink(tx, lessonID)
		if err != nil {
			return err
		}
		if _, err := s.availablePath(tx, link.LearningPathID); err != nil {
			return err
		}

		q := models.Question{
			LessonID:     lessonID,
			QuestionText: text,
			QuestionType: questionTypeMC,
			XPReward:     xp,
			Explanation:  explanation,
		}
		if err := tx.Create(&q).Error; err != nil {
			return internalErr("create question", err)
		}
		if err := s.createOptions(tx, q.ID, options); err != nil {
			return err
		}

		result, err = s.loadAdminQuestion(tx, q.ID)
		return err
	})
	if err != nil {
		return nil, err
	}
	return result, nil
}

// UpdateQuestion: ubah sebagian field soal. Mengganti opsi ditolak (409) jika
// soal sudah pernah dijawab pengguna, agar riwayat jawaban tidak kehilangan arti.
func (s *Service) UpdateQuestion(questionID uint, in UpdateQuestionInput) (*AdminQuestion, error) {
	if in.Text == nil && in.XPReward == nil && in.Explanation == nil && in.Options == nil {
		return nil, newErr(http.StatusBadRequest, "tidak ada field yang diubah")
	}

	updates := map[string]interface{}{}
	if in.Text != nil {
		t, err := validateQuestionText(*in.Text)
		if err != nil {
			return nil, err
		}
		updates["question_text"] = t
	}
	if in.XPReward != nil {
		if err := validateXP(*in.XPReward); err != nil {
			return nil, err
		}
		updates["xp_reward"] = *in.XPReward
	}
	if in.Explanation != nil {
		e, err := validateExplanation(*in.Explanation)
		if err != nil {
			return nil, err
		}
		updates["explanation"] = e
	}

	var options []OptionInput
	if in.Options != nil {
		var err error
		options, err = validateOptions(*in.Options)
		if err != nil {
			return nil, err
		}
	}

	var result *AdminQuestion
	err := s.DB.Transaction(func(tx *gorm.DB) error {
		q, err := s.questionInAvailablePath(tx, questionID)
		if err != nil {
			return err
		}

		if options != nil {
			attempts, err := s.countAttempts(tx, q.ID)
			if err != nil {
				return err
			}
			if attempts > 0 {
				return newErr(http.StatusConflict,
					fmt.Sprintf("soal sudah dijawab %d kali; opsi tidak bisa diganti", attempts))
			}
			if err := tx.Where("question_id = ?", q.ID).Delete(&models.AnswerOption{}).Error; err != nil {
				return internalErr("delete old options", err)
			}
			if err := s.createOptions(tx, q.ID, options); err != nil {
				return err
			}
		}

		if len(updates) > 0 {
			if err := tx.Model(q).Updates(updates).Error; err != nil {
				return internalErr("update question", err)
			}
		}

		result, err = s.loadAdminQuestion(tx, q.ID)
		return err
	})
	if err != nil {
		return nil, err
	}
	return result, nil
}

// DeleteQuestion: hapus soal beserta opsinya. Ditolak (409) jika sudah pernah dijawab.
func (s *Service) DeleteQuestion(questionID uint) error {
	return s.DB.Transaction(func(tx *gorm.DB) error {
		q, err := s.questionInAvailablePath(tx, questionID)
		if err != nil {
			return err
		}

		attempts, err := s.countAttempts(tx, q.ID)
		if err != nil {
			return err
		}
		if attempts > 0 {
			return newErr(http.StatusConflict,
				fmt.Sprintf("soal sudah dijawab %d kali sehingga tidak bisa dihapus", attempts))
		}

		if err := tx.Where("question_id = ?", q.ID).Delete(&models.AnswerOption{}).Error; err != nil {
			return internalErr("delete options", err)
		}
		if err := tx.Delete(&models.Question{}, q.ID).Error; err != nil {
			return internalErr("delete question", err)
		}
		return nil
	})
}