package models

import "time"

// Language = bahasa pemrograman (C, Python, JavaScript, dst.).
// Satu bahasa punya banyak learning path (mis. C Beginner, C Intermediate).
type Language struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Name        string    `gorm:"size:50;not null;uniqueIndex" json:"name"`
	Slug        string    `gorm:"size:50;not null;uniqueIndex" json:"slug"`
	Description string    `gorm:"type:text" json:"description"`
	// IsAvailable = materi untuk bahasa ini sudah tersedia. Saat ini hanya C.
	// Bahasa lain tetap bisa dipilih user, tetapi belum punya path/lesson yang bisa
	// diakses (tampil "segera hadir"). Diubah lewat database, belum lewat API admin.
	IsAvailable bool      `gorm:"not null;default:false" json:"is_available"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// UserLanguage = keterlibatan satu user pada satu bahasa: XP bahasa itu,
// path yang sedang aktif, dan kapan terakhir dibuka. Bahasa aktif user adalah
// baris dengan last_accessed_at terbaru. Progress per lesson tetap di tabel
// progress, yang sudah terpisah per bahasa karena lesson milik satu path.
type UserLanguage struct {
	ID                   uint      `gorm:"primaryKey" json:"id"`
	UserID               uint      `gorm:"not null;uniqueIndex:idx_user_language" json:"user_id"`
	LanguageID           uint      `gorm:"not null;uniqueIndex:idx_user_language;index" json:"language_id"`
	ActiveLearningPathID *uint     `gorm:"index" json:"active_learning_path_id"`
	XP                   int       `gorm:"not null;default:0;check:chk_user_languages_xp,xp >= 0" json:"xp"`
	LastAccessedAt       time.Time `gorm:"not null" json:"last_accessed_at"`
	CreatedAt            time.Time `json:"created_at"`
	UpdatedAt            time.Time `json:"updated_at"`

	User               User          `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"-"`
	Language           Language      `gorm:"constraint:OnUpdate:CASCADE,OnDelete:RESTRICT" json:"-"`
	ActiveLearningPath *LearningPath `gorm:"foreignKey:ActiveLearningPathID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL" json:"-"`
}