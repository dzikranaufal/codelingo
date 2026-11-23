package missions

import (
	"codelingo/backend/internal/models"
	"gorm.io/gorm"
	"time"
)

type Service struct {
	DB  *gorm.DB
	Now func() time.Time
}
type Mission struct {
	ID        string `json:"id"`
	Title     string `json:"title"`
	Current   int    `json:"current"`
	Target    int    `json:"target"`
	Completed bool   `json:"completed"`
}
type Response struct {
	Missions []Mission `json:"missions"`
	ResetAt  time.Time `json:"reset_at"`
	Timezone string    `json:"timezone"`
}

// Get mengukur aktivitas berdasarkan catatan yang benar-benar tersimpan.
// Hari misi memakai UTC agar konsisten di semua instance backend.
func (s *Service) Get(userID uint) (*Response, error) {
	now := time.Now().UTC()
	if s.Now != nil {
		now = s.Now().UTC()
	}
	start := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
	end := start.Add(24 * time.Hour)
	var completedLessons int64
	if err := s.DB.Model(&models.Progress{}).Where("user_id = ? AND status = ? AND updated_at >= ? AND updated_at < ?", userID, models.ProgressCompleted, start, end).Count(&completedLessons).Error; err != nil {
		return nil, err
	}
	var attempts int64
	if err := s.DB.Model(&models.QuizAttempt{}).Where("user_id = ? AND created_at >= ? AND created_at < ?", userID, start, end).Count(&attempts).Error; err != nil {
		return nil, err
	}
	// XP dihitung dari reward soal pada pelajaran yang pertama kali selesai hari ini.
	// Complete() tidak memperbarui progress ketika pelajaran sudah pernah selesai,
	// sehingga penyelesaian ulang tidak menggandakan XP.
	var xpToday int64
	err := s.DB.Table("progress AS p").Joins("JOIN questions q ON q.lesson_id = p.lesson_id").
		Where("p.user_id = ? AND p.status = ? AND p.updated_at >= ? AND p.updated_at < ?", userID, models.ProgressCompleted, start, end).
		Select("COALESCE(SUM(q.xp_reward), 0)").Scan(&xpToday).Error
	if err != nil {
		return nil, err
	}
	missions := []Mission{
		{ID: "xp", Title: "Dapatkan 10 XP", Current: int(xpToday), Target: 10},
		{ID: "lesson", Title: "Selesaikan 1 pelajaran", Current: int(completedLessons), Target: 1},
		{ID: "practice", Title: "Kirim 7 jawaban latihan", Current: int(attempts), Target: 7},
	}
	for i := range missions {
		if missions[i].Current > missions[i].Target {
			missions[i].Current = missions[i].Target
		}
		missions[i].Completed = missions[i].Current >= missions[i].Target
	}
	return &Response{Missions: missions, ResetAt: end, Timezone: "UTC"}, nil
}
