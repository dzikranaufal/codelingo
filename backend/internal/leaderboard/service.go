package leaderboard

import (
	"errors"
	"log"
	"time"

	"codelingo/backend/internal/content"
	"codelingo/backend/internal/models"

	"gorm.io/gorm"
)

const (
	DefaultLimit = 10
	MaxLimit     = 100
)

var (
	ErrInternal      = errors.New("terjadi kesalahan internal")
	ErrInvalidStatus = errors.New("status tidak valid")
)

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

// Entry hanya berisi data yang aman dilihat semua user.
// Email, umur, dan role sengaja TIDAK disertakan.
type Entry struct {
	Rank     int    `json:"rank"`
	Username string `json:"username"`
	Name     string `json:"name"`
	Level    int    `json:"level"`
	XP       int    `json:"xp"`        // total XP sepanjang waktu
	WeeklyXP int    `json:"weekly_xp"` // XP pekan ini; dasar peringkat
	Status   string `json:"status"`    // emoji status, kosong jika tidak ada
	IsMe     bool   `json:"is_me"`
}

// Week = pekan yang sedang berjalan (Senin 00:00 sampai Minggu malam).
type Week struct {
	StartsAt time.Time `json:"starts_at"`
	EndsAt   time.Time `json:"ends_at"`
	DaysLeft int       `json:"days_left"`
}

type Response struct {
	Entries []Entry `json:"entries"`
	// Me berisi peringkat user yang sedang login (null untuk akun admin,
	// karena admin tidak ikut peringkat). Jika user sudah ada di Entries,
	// isinya sama dengan entri tersebut.
	Me   *Entry `json:"me"`
	Week Week   `json:"week"`
}

type row struct {
	ID       uint   `gorm:"column:id"`
	Username string `gorm:"column:username"`
	Name     string `gorm:"column:name"`
	Level    int    `gorm:"column:level"`
	XP       int    `gorm:"column:xp"`
	Status   string `gorm:"column:status_emoji"`
	WeeklyXP int    `gorm:"column:weekly_xp"`
}

// rankAheadSQL menghitung berapa user non-admin yang berada di atas satu user.
// Aturan "di atas" SAMA dengan urutan daftar: XP pekan ini lebih besar; jika
// sama, total XP lebih besar; jika sama lagi, id lebih kecil.
const rankAheadSQL = `
SELECT COUNT(*) FROM (
  SELECT u.id AS id, u.xp AS xp, COALESCE(SUM(e.amount), 0) AS w
  FROM users u
  LEFT JOIN xp_events e ON e.user_id = u.id AND e.created_at >= ? AND e.created_at < ?
  WHERE u.role <> ?
  GROUP BY u.id
) t
WHERE t.w > ? OR (t.w = ? AND (t.xp > ? OR (t.xp = ? AND t.id < ?)))`

// Get mengembalikan top `limit` user berdasarkan XP pekan ini (terbesar dulu).
// Seri diputuskan total XP, lalu id (yang mendaftar lebih dulu), sehingga urutan
// selalu konsisten. Akun admin tidak ikut peringkat.
func (s *Service) Get(viewer *models.User, limit int) (*Response, error) {
	now := s.now()
	start := content.WeekStart(now)
	end := start.AddDate(0, 0, 7)

	var rows []row
	err := s.DB.Table("users AS u").
		Select("u.id AS id, u.username AS username, u.name AS name, u.level AS level, u.xp AS xp, "+
			"u.status_emoji AS status_emoji, COALESCE(SUM(e.amount), 0) AS weekly_xp").
		Joins("LEFT JOIN xp_events e ON e.user_id = u.id AND e.created_at >= ? AND e.created_at < ?", start, end).
		Where("u.role <> ?", models.RoleAdmin).
		Group("u.id").
		Order("weekly_xp DESC").
		Order("u.xp DESC").
		Order("u.id ASC").
		Limit(limit).
		Scan(&rows).Error
	if err != nil {
		log.Printf("leaderboard: gagal mengambil top user: %v", err)
		return nil, ErrInternal
	}

	entries := make([]Entry, 0, len(rows))
	for i, r := range rows {
		entries = append(entries, Entry{
			Rank:     i + 1,
			Username: r.Username,
			Name:     r.Name,
			Level:    r.Level,
			XP:       r.XP,
			WeeklyXP: r.WeeklyXP,
			Status:   r.Status,
			IsMe:     r.ID == viewer.ID,
		})
	}

	resp := &Response{
		Entries: entries,
		Week:    Week{StartsAt: start, EndsAt: end, DaysLeft: content.DaysLeftInWeek(now)},
	}

	if viewer.Role == models.RoleAdmin {
		return resp, nil
	}

	var myWeekly int
	err = s.DB.Model(&models.XPEvent{}).
		Where("user_id = ? AND created_at >= ? AND created_at < ?", viewer.ID, start, end).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&myWeekly).Error
	if err != nil {
		log.Printf("leaderboard: gagal menghitung XP pekan ini: %v", err)
		return nil, ErrInternal
	}

	var ahead int64
	err = s.DB.Raw(rankAheadSQL,
		start, end, models.RoleAdmin,
		myWeekly, myWeekly, viewer.XP, viewer.XP, viewer.ID,
	).Scan(&ahead).Error
	if err != nil {
		log.Printf("leaderboard: gagal menghitung peringkat user: %v", err)
		return nil, ErrInternal
	}

	resp.Me = &Entry{
		Rank:     int(ahead) + 1,
		Username: viewer.Username,
		Name:     viewer.Name,
		Level:    viewer.Level,
		XP:       viewer.XP,
		WeeklyXP: myWeekly,
		Status:   viewer.StatusEmoji,
		IsMe:     true,
	}
	return resp, nil
}

// SetStatus memasang (atau menghapus, jika kosong) status emoji user.
// Nilai divalidasi terhadap daftar putih di status.go. Mengembalikan nilai
// yang tersimpan.
func (s *Service) SetStatus(userID uint, raw string) (string, error) {
	status, ok := NormalizeStatus(raw)
	if !ok {
		return "", ErrInvalidStatus
	}
	err := s.DB.Model(&models.User{}).Where("id = ?", userID).Update("status_emoji", status).Error
	if err != nil {
		log.Printf("leaderboard: gagal menyimpan status: %v", err)
		return "", ErrInternal
	}
	return status, nil
}
