package leaderboard

import (
	"errors"
	"log"

	"codelingo/backend/internal/models"

	"gorm.io/gorm"
)

const (
	DefaultLimit = 10
	MaxLimit     = 100
)

var ErrInternal = errors.New("terjadi kesalahan internal")

type Service struct {
	DB *gorm.DB
}

// Entry hanya berisi data yang aman dilihat semua user.
// Email, umur, dan role sengaja TIDAK disertakan.
type Entry struct {
	Rank     int    `json:"rank"`
	Username string `json:"username"`
	Name     string `json:"name"`
	Level    int    `json:"level"`
	XP       int    `json:"xp"`
	IsMe     bool   `json:"is_me"`
}

type Response struct {
	Entries []Entry `json:"entries"`
	// Me berisi peringkat user yang sedang login (null untuk akun admin,
	// karena admin tidak ikut peringkat). Jika user sudah ada di Entries,
	// isinya sama dengan entri tersebut.
	Me *Entry `json:"me"`
}

// Get mengembalikan top `limit` user berdasarkan XP (terbesar dulu).
// Jika XP sama, user yang mendaftar lebih dulu (id lebih kecil) di atas,
// sehingga urutan selalu konsisten. Akun admin tidak ikut peringkat.
func (s *Service) Get(viewer *models.User, limit int) (*Response, error) {
	var users []models.User
	err := s.DB.
		Select("id", "username", "name", "level", "xp").
		Where("role <> ?", models.RoleAdmin).
		Order("xp DESC").
		Order("id ASC").
		Limit(limit).
		Find(&users).Error
	if err != nil {
		log.Printf("leaderboard: gagal mengambil top user: %v", err)
		return nil, ErrInternal
	}

	entries := make([]Entry, 0, len(users))
	for i, u := range users {
		entries = append(entries, Entry{
			Rank:     i + 1,
			Username: u.Username,
			Name:     u.Name,
			Level:    u.Level,
			XP:       u.XP,
			IsMe:     u.ID == viewer.ID,
		})
	}

	resp := &Response{Entries: entries}

	if viewer.Role == models.RoleAdmin {
		return resp, nil
	}

	// Peringkat = jumlah user non-admin yang berada di atasnya + 1.
	// Aturan "di atas" sama dengan urutan di atas: XP lebih besar, atau XP sama
	// dengan id lebih kecil.
	var ahead int64
	err = s.DB.Model(&models.User{}).
		Where("role <> ? AND (xp > ? OR (xp = ? AND id < ?))",
			models.RoleAdmin, viewer.XP, viewer.XP, viewer.ID).
		Count(&ahead).Error
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
		IsMe:     true,
	}
	return resp, nil
}