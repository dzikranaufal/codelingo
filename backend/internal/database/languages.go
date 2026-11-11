package database

import (
	"errors"
	"log"

	"codelingo/backend/internal/models"

	"gorm.io/gorm"
)

type defaultLanguage struct {
	Name        string
	Slug        string
	Description string
	Available   bool
}

// Daftar bahasa bawaan. Semua bisa dipilih user di dashboard, tetapi saat ini
// hanya C yang materinya tersedia (Available = true).
var defaultLanguages = []defaultLanguage{
	{"C", "c", "Belajar pemrograman dengan bahasa C.", true},
	{"Java", "java", "Belajar pemrograman dengan bahasa Java.", false},
	{"Python", "python", "Belajar pemrograman dengan bahasa Python.", false},
	{"JavaScript", "javascript", "Belajar pemrograman dengan bahasa JavaScript.", false},
	{"PHP", "php", "Belajar pemrograman dengan bahasa PHP.", false},
}

// EnsureLanguages membuat bahasa bawaan yang belum ada (dicek lewat slug) dan
// memastikan bahasa C berstatus tersedia. Aman dijalankan berulang, tidak
// menghapus atau mengubah data lain.
func EnsureLanguages(db *gorm.DB) error {
	return db.Transaction(func(tx *gorm.DB) error {
		for _, d := range defaultLanguages {
			var lang models.Language
			err := tx.Where("slug = ?", d.Slug).First(&lang).Error

			if errors.Is(err, gorm.ErrRecordNotFound) {
				lang = models.Language{
					Name:        d.Name,
					Slug:        d.Slug,
					Description: d.Description,
					IsAvailable: d.Available,
				}
				if err := tx.Create(&lang).Error; err != nil {
					return err
				}
				log.Printf("bahasa dibuat: %s (tersedia: %t)", d.Name, d.Available)
				continue
			}
			if err != nil {
				return err
			}

			// Kolom is_available baru ditambahkan: pastikan C yang sudah ada tersedia.
			if d.Slug == "c" && !lang.IsAvailable {
				if err := tx.Model(&lang).Update("is_available", true).Error; err != nil {
					return err
				}
				log.Println("bahasa C ditandai tersedia")
			}
		}
		return nil
	})
}