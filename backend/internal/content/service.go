package content

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"codelingo/backend/internal/models"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

const defaultLanguageSlug = "c"

type Service struct {
	DB *gorm.DB
	// Now bisa diganti saat testing. Nil = time.Now.
	Now func() time.Time
}

func (s *Service) now() time.Time {
	if s.Now != nil {
		return s.Now()
	}
	return time.Now()
}

// ---------- tipe response ----------

type LanguageInfo struct {
	ID          uint   `json:"id"`
	Slug        string `json:"slug"`
	Name        string `json:"name"`
	IsAvailable bool   `json:"is_available"`
}

type PathInfo struct {
	ID          uint   `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

// LessonNode.Status: "completed" | "current" | "locked".
type LessonNode struct {
	ID            uint   `json:"id"`
	Title         string `json:"title"`
	Description   string `json:"description"`
	OrderIndex    int    `json:"order_index"`
	QuestionCount int    `json:"question_count"`
	Status        string `json:"status"`
	Score         int    `json:"score"`
}

type PathResponse struct {
	Language LanguageInfo `json:"language"`
	Path     *PathInfo    `json:"path"`
	Lessons  []LessonNode `json:"lessons"`
}

// Step selalu bertipe "choice". Jawaban yang benar TIDAK ikut dikirim.
// Urutan Options stabil (berdasarkan id opsi); jawaban dikirim sebagai indeksnya.
type Step struct {
	Type    string   `json:"type"`
	ID      string   `json:"id"`
	Prompt  string   `json:"prompt"`
	Options []string `json:"options"`
}

type LessonResponse struct {
	ID       uint   `json:"id"`
	Title    string `json:"title"`
	XPReward int    `json:"xp_reward"`
	Hearts   int    `json:"hearts"`
	Steps    []Step `json:"steps"`
}

type AnswerInput struct {
	StepID string `json:"step_id"`
	Answer *int   `json:"answer"`
}

type AnswerResponse struct {
	Correct       bool   `json:"correct"`
	CorrectAnswer string `json:"correct_answer"`
	Explanation   string `json:"explanation"`
	Hearts        int    `json:"hearts"`
}

type CompleteResponse struct {
	XPGained int `json:"xp_gained"`
	TotalXP  int `json:"total_xp"`
	Level    int `json:"level"`
}

type StatsResponse struct {
	CourseID           string `json:"course_id"`
	Streak             int    `json:"streak"`
	Hearts             int    `json:"hearts"`
	MaxHearts          int    `json:"max_hearts"`
	NextHeartInSeconds int    `json:"next_heart_in_seconds"`
	NextHeartIn        string `json:"next_heart_in"`
	XP                 int    `json:"xp"`
	Level              int    `json:"level"`
}

// ---------- helper ----------

func notFound(err error) bool { return errors.Is(err, gorm.ErrRecordNotFound) }

// syncLives memuat user, menerapkan regenerasi nyawa, dan menyimpannya jika berubah.
// forUpdate=true mengunci baris user sampai transaksi selesai.
func (s *Service) syncLives(tx *gorm.DB, userID uint, forUpdate bool) (*models.User, time.Time, error) {
	q := tx
	if forUpdate {
		q = tx.Clauses(clause.Locking{Strength: "UPDATE"})
	}
	var u models.User
	if err := q.First(&u, userID).Error; err != nil {
		if notFound(err) {
			return nil, time.Time{}, newErr(http.StatusUnauthorized, "akun tidak ditemukan")
		}
		return nil, time.Time{}, internalErr("load user", err)
	}

	now := s.now()
	anchor := now
	if u.LivesUpdatedAt != nil {
		anchor = *u.LivesUpdatedAt
	}
	lives, newAnchor := RegenLives(u.Lives, anchor, now)
	if lives != u.Lives {
		err := tx.Model(&models.User{}).Where("id = ?", u.ID).
			Updates(map[string]interface{}{"lives": lives, "lives_updated_at": newAnchor}).Error
		if err != nil {
			return nil, time.Time{}, internalErr("regen lives", err)
		}
		u.Lives = lives
	}
	u.LivesUpdatedAt = &newAnchor
	return &u, newAnchor, nil
}

func (s *Service) outOfLivesErr(lives int, anchor time.Time) error {
	return newErr(http.StatusForbidden,
		"nyawa habis, hati berikutnya dalam "+FormatWait(NextHeartIn(lives, anchor, s.now())))
}

type access struct {
	lesson   models.Lesson
	link     models.LearningPathLesson
	path     models.LearningPath
	language models.Language
}

// lessonAccess memastikan lesson ada, bahasanya sudah dibuka, dan pelajaran
// sebelumnya di path sudah selesai (kecuali lesson ini sudah pernah diselesaikan).
func (s *Service) lessonAccess(tx *gorm.DB, userID, lessonID uint) (*access, error) {
	var a access
	if err := tx.First(&a.lesson, lessonID).Error; err != nil {
		if notFound(err) {
			return nil, newErr(http.StatusNotFound, "pelajaran tidak ditemukan")
		}
		return nil, internalErr("find lesson", err)
	}
	err := tx.Where("lesson_id = ?", lessonID).Order("learning_path_id ASC").First(&a.link).Error
	if err != nil {
		if notFound(err) {
			return nil, newErr(http.StatusNotFound, "pelajaran belum terhubung ke jalur belajar")
		}
		return nil, internalErr("find lesson link", err)
	}
	if err := tx.First(&a.path, a.link.LearningPathID).Error; err != nil {
		return nil, internalErr("find path", err)
	}
	if a.path.LanguageID == nil {
		return nil, newErr(http.StatusForbidden, "jalur belajar belum terhubung ke bahasa")
	}
	if err := tx.First(&a.language, *a.path.LanguageID).Error; err != nil {
		return nil, internalErr("find language", err)
	}
	if !a.language.IsAvailable {
		return nil, newErr(http.StatusForbidden, fmt.Sprintf("materi bahasa %s belum tersedia", a.language.Name))
	}

	var done int64
	err = tx.Model(&models.Progress{}).
		Where("user_id = ? AND lesson_id = ? AND status = ?", userID, lessonID, models.ProgressCompleted).
		Count(&done).Error
	if err != nil {
		return nil, internalErr("check completed", err)
	}
	if done > 0 {
		return &a, nil
	}

	var pending int64
	err = tx.Table("learning_path_lessons AS plp").
		Joins("LEFT JOIN progress pr ON pr.lesson_id = plp.lesson_id AND pr.user_id = ? AND pr.status = ?",
			userID, models.ProgressCompleted).
		Where("plp.learning_path_id = ? AND plp.order_index < ? AND pr.id IS NULL",
			a.link.LearningPathID, a.link.OrderIndex).
		Count(&pending).Error
	if err != nil {
		return nil, internalErr("check previous lessons", err)
	}
	if pending > 0 {
		return nil, newErr(http.StatusForbidden, "selesaikan pelajaran sebelumnya terlebih dahulu")
	}
	return &a, nil
}

func (s *Service) resolveLanguage(userID uint, slug string) (*models.Language, error) {
	var lang models.Language

	if slug == "" {
		var ul models.UserLanguage
		err := s.DB.Where("user_id = ?", userID).Order("last_accessed_at DESC").First(&ul).Error
		switch {
		case err == nil:
			if err := s.DB.First(&lang, ul.LanguageID).Error; err != nil {
				return nil, internalErr("find language", err)
			}
			return &lang, nil
		case !notFound(err):
			return nil, internalErr("find user language", err)
		}
		slug = defaultLanguageSlug
	}

	if err := s.DB.Where("slug = ?", slug).First(&lang).Error; err != nil {
		if notFound(err) {
			return nil, newErr(http.StatusNotFound, "bahasa tidak ditemukan")
		}
		return nil, internalErr("find language", err)
	}
	return &lang, nil
}

func (s *Service) pickPath(userID, languageID uint) (*models.LearningPath, error) {
	var ul models.UserLanguage
	err := s.DB.Where("user_id = ? AND language_id = ? AND active_learning_path_id IS NOT NULL", userID, languageID).
		First(&ul).Error
	if err == nil {
		var p models.LearningPath
		e := s.DB.Where("id = ? AND language_id = ?", *ul.ActiveLearningPathID, languageID).First(&p).Error
		if e == nil {
			return &p, nil
		}
		if !notFound(e) {
			return nil, internalErr("find active path", e)
		}
	} else if !notFound(err) {
		return nil, internalErr("find user language", err)
	}

	var p models.LearningPath
	err = s.DB.Where("language_id = ?", languageID).Order("order_index ASC, id ASC").First(&p).Error
	if err != nil {
		if notFound(err) {
			return nil, nil
		}
		return nil, internalErr("find path", err)
	}
	return &p, nil
}

// ---------- operasi ----------

type lessonRow struct {
	ID             uint
	Title          string
	Description    string
	OrderIndex     int
	QuestionCount  int
	ProgressStatus string
	Score          int
}

// LearningPath: jalur belajar satu bahasa beserta status tiap pelajaran untuk user ini.
// slug kosong = bahasa terakhir yang dipakai user, atau C jika belum ada.
func (s *Service) LearningPath(userID uint, slug string) (*PathResponse, error) {
	lang, err := s.resolveLanguage(userID, slug)
	if err != nil {
		return nil, err
	}

	resp := &PathResponse{
		Language: LanguageInfo{ID: lang.ID, Slug: lang.Slug, Name: lang.Name, IsAvailable: lang.IsAvailable},
		Lessons:  []LessonNode{},
	}
	if !lang.IsAvailable {
		return resp, nil
	}

	path, err := s.pickPath(userID, lang.ID)
	if err != nil {
		return nil, err
	}
	if path == nil {
		return resp, nil
	}
	resp.Path = &PathInfo{ID: path.ID, Name: path.Name, Description: path.Description}

	var rows []lessonRow
	err = s.DB.Table("learning_path_lessons AS plp").
		Select("l.id AS id, l.title AS title, l.description AS description, plp.order_index AS order_index, "+
			"(SELECT COUNT(*) FROM questions q WHERE q.lesson_id = l.id) AS question_count, "+
			"COALESCE(pr.status, '') AS progress_status, COALESCE(pr.score, 0) AS score").
		Joins("JOIN lessons l ON l.id = plp.lesson_id").
		Joins("LEFT JOIN progress pr ON pr.lesson_id = l.id AND pr.user_id = ?", userID).
		Where("plp.learning_path_id = ?", path.ID).
		Order("plp.order_index ASC, l.id ASC").
		Scan(&rows).Error
	if err != nil {
		return nil, internalErr("list lessons", err)
	}

	// Aturan urutan sama dengan lessonAccess: pelajaran pertama yang belum selesai
	// menjadi "current"; semua sesudahnya "locked". Pelajaran tanpa soal tidak bisa
	// dimainkan sehingga ikut memblokir yang sesudahnya.
	blocked := false
	for _, r := range rows {
		node := LessonNode{
			ID: r.ID, Title: r.Title, Description: r.Description,
			OrderIndex: r.OrderIndex, QuestionCount: r.QuestionCount, Score: r.Score,
		}
		switch {
		case r.ProgressStatus == models.ProgressCompleted:
			node.Status = "completed"
		case blocked:
			node.Status = "locked"
		case r.QuestionCount == 0:
			node.Status = "locked"
			blocked = true
		default:
			node.Status = "current"
			blocked = true
		}
		resp.Lessons = append(resp.Lessons, node)
	}
	return resp, nil
}

// Lesson: isi pelajaran (soal tanpa kunci jawaban) dan jumlah nyawa saat ini.
func (s *Service) Lesson(userID, lessonID uint) (*LessonResponse, error) {
	var resp *LessonResponse
	err := s.DB.Transaction(func(tx *gorm.DB) error {
		acc, err := s.lessonAccess(tx, userID, lessonID)
		if err != nil {
			return err
		}

		u, anchor, err := s.syncLives(tx, userID, false)
		if err != nil {
			return err
		}
		if u.Lives <= 0 {
			return s.outOfLivesErr(u.Lives, anchor)
		}

		var questions []models.Question
		if err := tx.Where("lesson_id = ?", lessonID).Order("id ASC").Find(&questions).Error; err != nil {
			return internalErr("list questions", err)
		}
		if len(questions) == 0 {
			return newErr(http.StatusConflict, "pelajaran ini belum memiliki soal")
		}

		ids := make([]uint, 0, len(questions))
		for _, q := range questions {
			ids = append(ids, q.ID)
		}
		var options []models.AnswerOption
		if err := tx.Where("question_id IN ?", ids).Order("id ASC").Find(&options).Error; err != nil {
			return internalErr("list options", err)
		}
		byQuestion := make(map[uint][]string, len(questions))
		for _, o := range options {
			byQuestion[o.QuestionID] = append(byQuestion[o.QuestionID], o.OptionText)
		}

		steps := make([]Step, 0, len(questions))
		totalXP := 0
		for _, q := range questions {
			totalXP += q.XPReward
			steps = append(steps, Step{
				Type:    "choice",
				ID:      strconv.FormatUint(uint64(q.ID), 10),
				Prompt:  q.QuestionText,
				Options: byQuestion[q.ID],
			})
		}

		// Tandai "sedang dikerjakan" tanpa menimpa status "completed".
		err = tx.Clauses(clause.OnConflict{DoNothing: true}).Omit(clause.Associations).
			Create(&models.Progress{UserID: userID, LessonID: lessonID, Status: models.ProgressInProgress}).Error
		if err != nil {
			return internalErr("mark in progress", err)
		}

		resp = &LessonResponse{
			ID: acc.lesson.ID, Title: acc.lesson.Title,
			XPReward: totalXP, Hearts: u.Lives, Steps: steps,
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return resp, nil
}

// Answer: periksa satu jawaban. Jawaban salah mengurangi satu nyawa.
func (s *Service) Answer(userID, lessonID uint, in AnswerInput) (*AnswerResponse, error) {
	questionID, ok := parseID(in.StepID)
	if !ok {
		return nil, newErr(http.StatusBadRequest, "step_id tidak valid")
	}
	if in.Answer == nil {
		return nil, newErr(http.StatusBadRequest, "jawaban wajib diisi")
	}

	var resp *AnswerResponse
	err := s.DB.Transaction(func(tx *gorm.DB) error {
		if _, err := s.lessonAccess(tx, userID, lessonID); err != nil {
			return err
		}

		var q models.Question
		if err := tx.Where("id = ? AND lesson_id = ?", questionID, lessonID).First(&q).Error; err != nil {
			if notFound(err) {
				return newErr(http.StatusNotFound, "soal tidak ditemukan di pelajaran ini")
			}
			return internalErr("find question", err)
		}

		var options []models.AnswerOption
		if err := tx.Where("question_id = ?", q.ID).Order("id ASC").Find(&options).Error; err != nil {
			return internalErr("list options", err)
		}
		if *in.Answer < 0 || *in.Answer >= len(options) {
			return newErr(http.StatusBadRequest, "pilihan jawaban tidak valid")
		}

		u, anchor, err := s.syncLives(tx, userID, true)
		if err != nil {
			return err
		}
		if u.Lives <= 0 {
			return s.outOfLivesErr(u.Lives, anchor)
		}

		selected := options[*in.Answer]
		correctText := ""
		for _, o := range options {
			if o.IsCorrect {
				correctText = o.OptionText
				break
			}
		}

		attempt := models.QuizAttempt{
			UserID: userID, QuestionID: q.ID,
			SelectedOptionID: &selected.ID, IsCorrect: selected.IsCorrect,
		}
		if err := tx.Omit(clause.Associations).Create(&attempt).Error; err != nil {
			return internalErr("save attempt", err)
		}

		lives := u.Lives
		if !selected.IsCorrect {
			lives--
			// Jika sebelumnya penuh, hitungan regenerasi dimulai dari sekarang.
			newAnchor := anchor
			if u.Lives >= MaxLives {
				newAnchor = s.now()
			}
			err := tx.Model(&models.User{}).Where("id = ?", userID).
				Updates(map[string]interface{}{"lives": lives, "lives_updated_at": newAnchor}).Error
			if err != nil {
				return internalErr("decrease lives", err)
			}
		}

		resp = &AnswerResponse{
			Correct:       selected.IsCorrect,
			CorrectAnswer: correctText,
			Explanation:   q.Explanation,
			Hearts:        lives,
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return resp, nil
}

// Complete: tandai pelajaran selesai dan beri XP (hanya pada penyelesaian pertama).
// Server memeriksa sendiri bahwa setiap soal pernah dijawab benar oleh user ini.
func (s *Service) Complete(userID, lessonID uint) (*CompleteResponse, error) {
	var resp *CompleteResponse
	err := s.DB.Transaction(func(tx *gorm.DB) error {
		acc, err := s.lessonAccess(tx, userID, lessonID)
		if err != nil {
			return err
		}

		// Kunci baris user dulu: dua request "complete" bersamaan akan berurutan,
		// sehingga XP tidak bisa diberikan dua kali.
		var u models.User
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&u, userID).Error; err != nil {
			return internalErr("lock user", err)
		}

		var questions []models.Question
		if err := tx.Where("lesson_id = ?", lessonID).Find(&questions).Error; err != nil {
			return internalErr("list questions", err)
		}
		if len(questions) == 0 {
			return newErr(http.StatusConflict, "pelajaran ini belum memiliki soal")
		}

		var correctDistinct int64
		err = tx.Table("quiz_attempts AS qa").
			Joins("JOIN questions q ON q.id = qa.question_id").
			Where("qa.user_id = ? AND q.lesson_id = ? AND qa.is_correct = ?", userID, lessonID, true).
			Select("COUNT(DISTINCT qa.question_id)").Scan(&correctDistinct).Error
		if err != nil {
			return internalErr("count correct", err)
		}
		if int(correctDistinct) < len(questions) {
			return newErr(http.StatusConflict, "masih ada soal yang belum dijawab dengan benar")
		}

		var rows []struct {
			QuestionID uint
			IsCorrect  bool
		}
		err = tx.Table("quiz_attempts AS qa").
			Joins("JOIN questions q ON q.id = qa.question_id").
			Where("qa.user_id = ? AND q.lesson_id = ?", userID, lessonID).
			Order("qa.id ASC").
			Select("qa.question_id AS question_id, qa.is_correct AS is_correct").Scan(&rows).Error
		if err != nil {
			return internalErr("load attempts", err)
		}
		attempts := make([]Attempt, 0, len(rows))
		for _, r := range rows {
			attempts = append(attempts, Attempt{QuestionID: r.QuestionID, Correct: r.IsCorrect})
		}
		score := FirstTryScore(attempts)

		var pr models.Progress
		err = tx.Where("user_id = ? AND lesson_id = ?", userID, lessonID).Take(&pr).Error
		alreadyDone := false
		switch {
		case notFound(err):
			pr = models.Progress{UserID: userID, LessonID: lessonID, Status: models.ProgressCompleted, Score: score}
			if err := tx.Omit(clause.Associations).Create(&pr).Error; err != nil {
				return internalErr("create progress", err)
			}
		case err != nil:
			return internalErr("load progress", err)
		case pr.Status == models.ProgressCompleted:
			alreadyDone = true
		default:
			err := tx.Model(&models.Progress{}).Where("id = ?", pr.ID).
				Updates(map[string]interface{}{"status": models.ProgressCompleted, "score": score}).Error
			if err != nil {
				return internalErr("update progress", err)
			}
		}

		gained := 0
		if !alreadyDone {
			for _, q := range questions {
				gained += q.XPReward
			}
		}
		newXP := u.XP + gained
		level := LevelForXP(newXP)

		if gained > 0 {
			err := tx.Model(&models.User{}).Where("id = ?", userID).
				Updates(map[string]interface{}{"xp": newXP, "level": level}).Error
			if err != nil {
				return internalErr("update xp", err)
			}
		}

		now := s.now()
		pathID := acc.path.ID
		var ul models.UserLanguage
		err = tx.Where("user_id = ? AND language_id = ?", userID, acc.language.ID).Take(&ul).Error
		switch {
		case notFound(err):
			ul = models.UserLanguage{
				UserID: userID, LanguageID: acc.language.ID,
				ActiveLearningPathID: &pathID, XP: gained, LastAccessedAt: now,
			}
			if err := tx.Omit(clause.Associations).Create(&ul).Error; err != nil {
				return internalErr("create user language", err)
			}
		case err != nil:
			return internalErr("load user language", err)
		default:
			err := tx.Model(&models.UserLanguage{}).Where("id = ?", ul.ID).
				Updates(map[string]interface{}{
					"xp": ul.XP + gained, "last_accessed_at": now, "active_learning_path_id": pathID,
				}).Error
			if err != nil {
				return internalErr("update user language", err)
			}
		}

		resp = &CompleteResponse{XPGained: gained, TotalXP: newXP, Level: level}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return resp, nil
}

// Stats: data untuk bar statistik (bahasa aktif, streak, nyawa, XP, level).
func (s *Service) Stats(userID uint) (*StatsResponse, error) {
	u, anchor, err := s.syncLives(s.DB, userID, false)
	if err != nil {
		return nil, err
	}
	now := s.now()

	lang, err := s.resolveLanguage(userID, "")
	if err != nil {
		return nil, err
	}

	var days []string
	err = s.DB.Table("quiz_attempts").
		Where("user_id = ? AND is_correct = ? AND created_at >= ?", userID, true, now.AddDate(-1, 0, -1)).
		Distinct().
		Pluck("DATE_FORMAT(created_at, '%Y-%m-%d')", &days).Error
	if err != nil {
		return nil, internalErr("load streak days", err)
	}

	wait := NextHeartIn(u.Lives, anchor, now)
	resp := &StatsResponse{
		CourseID:           lang.Slug,
		Streak:             Streak(days, now),
		Hearts:             u.Lives,
		MaxHearts:          MaxLives,
		NextHeartInSeconds: int(wait.Seconds()),
		XP:                 u.XP,
		Level:              u.Level,
	}
	if u.Lives < MaxLives {
		resp.NextHeartIn = FormatWait(wait)
	}
	return resp, nil
}
