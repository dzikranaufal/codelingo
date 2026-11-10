package models

import "time"

const (
	RoleUser  = "user"
	RoleAdmin = "admin"

	ProgressNotStarted = "not_started"
	ProgressInProgress = "in_progress"
	ProgressCompleted  = "completed"
)

// All mengembalikan seluruh model untuk AutoMigrate.
// GORM mengurutkan pembuatan tabel berdasarkan dependensi foreign key.
func All() []interface{} {
	return []interface{}{
		&User{},
		&LearningPath{},
		&Lesson{},
		&LearningPathLesson{},
		&Progress{},
		&Question{},
		&AnswerOption{},
		&QuizAttempt{},
		&Achievement{},
		&UserAchievement{},
	}
}

// User (ERD: User). Kolom password menyimpan HASH (bcrypt), bukan plaintext.
type User struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Name      string    `gorm:"size:100;not null" json:"name"`
	Username  string    `gorm:"size:30;not null;uniqueIndex" json:"username"`
	Email     string    `gorm:"size:100;not null;uniqueIndex" json:"email"`
	Age       int       `gorm:"not null" json:"age"`
	Password  string    `gorm:"size:255;not null" json:"-"`
	Role      string    `gorm:"size:20;not null;default:user;index" json:"role"`
	XP        int       `gorm:"not null;default:0;check:chk_users_xp,xp >= 0" json:"xp"`
	Level     int       `gorm:"not null;default:1;check:chk_users_level,level >= 1" json:"level"`
	Lives     int       `gorm:"not null;default:5;check:chk_users_lives,lives >= 0" json:"lives"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}


// LearningPath (ERD: Learning_Path).
type LearningPath struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Name        string    `gorm:"size:100;not null" json:"name"`
	Description string    `gorm:"type:text" json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// Lesson (ERD: Materi).
type Lesson struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Title       string    `gorm:"size:150;not null" json:"title"`
	Description string    `gorm:"type:text" json:"description"`
	Level       int       `gorm:"not null;default:1" json:"level"`
	OrderIndex  int       `gorm:"not null;default:0" json:"order_index"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// LearningPathLesson (ERD: Path_Materi), relasi N-N dengan kolom urutan.
type LearningPathLesson struct {
	LearningPathID uint `gorm:"primaryKey;autoIncrement:false" json:"learning_path_id"`
	LessonID       uint `gorm:"primaryKey;autoIncrement:false" json:"lesson_id"`
	OrderIndex     int  `gorm:"not null;default:0" json:"order_index"`

	LearningPath LearningPath `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"-"`
	Lesson       Lesson       `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"-"`
}

// Progress (ERD: Progress). Satu user hanya punya satu progress per lesson.
type Progress struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"not null;uniqueIndex:idx_progress_user_lesson" json:"user_id"`
	LessonID  uint      `gorm:"not null;uniqueIndex:idx_progress_user_lesson;index" json:"lesson_id"`
	Status    string    `gorm:"size:30;not null;default:not_started" json:"status"`
	Score     int       `gorm:"not null;default:0" json:"score"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	User   User   `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"-"`
	Lesson Lesson `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"-"`
}

func (Progress) TableName() string { return "progress" }

// Question (ERD: Quiz).
type Question struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	LessonID     uint      `gorm:"not null;index" json:"lesson_id"`
	QuestionText string    `gorm:"type:text;not null" json:"question_text"`
	QuestionType string    `gorm:"size:50;not null" json:"question_type"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`

	Lesson Lesson `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"-"`
}

// AnswerOption (ERD: Jawaban) = opsi/kunci jawaban milik sebuah soal.
type AnswerOption struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	QuestionID uint      `gorm:"not null;index" json:"question_id"`
	OptionText string    `gorm:"type:text;not null" json:"option_text"`
	IsCorrect  bool      `gorm:"not null;default:false" json:"is_correct"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`

	Question Question `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"-"`
}

// QuizAttempt (BARU, usulan poin 6) = riwayat jawaban yang dikirim user.
type QuizAttempt struct {
	ID               uint      `gorm:"primaryKey" json:"id"`
	UserID           uint      `gorm:"not null;index" json:"user_id"`
	QuestionID       uint      `gorm:"not null;index" json:"question_id"`
	SelectedOptionID *uint     `gorm:"index" json:"selected_option_id"`
	SubmittedAnswer  *string   `gorm:"type:text" json:"submitted_answer"`
	IsCorrect        bool      `gorm:"not null;default:false" json:"is_correct"`
	CreatedAt        time.Time `json:"created_at"`

	User           User          `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"-"`
	Question       Question      `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"-"`
	SelectedOption *AnswerOption `gorm:"constraint:OnUpdate:CASCADE,OnDelete:SET NULL" json:"-"`
}

// Achievement (ERD: Achievement). Kolom "syarat" (text) diganti
// criteria_type + criteria_value agar bisa dievaluasi backend (usulan poin 8).
type Achievement struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	Name          string    `gorm:"size:100;not null" json:"name"`
	Description   string    `gorm:"type:text" json:"description"`
	CriteriaType  string    `gorm:"size:50;not null" json:"criteria_type"`
	CriteriaValue int       `gorm:"not null;default:0" json:"criteria_value"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// UserAchievement (ERD: User_Achievement).
type UserAchievement struct {
	UserID        uint      `gorm:"primaryKey;autoIncrement:false" json:"user_id"`
	AchievementID uint      `gorm:"primaryKey;autoIncrement:false" json:"achievement_id"`
	EarnedAt      time.Time `gorm:"type:date;not null" json:"earned_at"`

	User        User        `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"-"`
	Achievement Achievement `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"-"`
}