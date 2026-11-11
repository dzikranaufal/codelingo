package database

import (
	"errors"
	"log"

	"codelingo/backend/internal/models"

	"gorm.io/gorm"
)

// Backfill menghubungkan learning path lama (yang belum punya language_id) ke
// bahasa C, agar data yang sudah ada tetap utuh setelah struktur multi-bahasa.
// Aman dijalankan berulang: jika tidak ada path tanpa bahasa, tidak ada yang berubah.
// Tidak ada data yang dihapus.
func Backfill(db *gorm.DB) error {
	return db.Transaction(func(tx *gorm.DB) error {
		var orphans int64
		if err := tx.Model(&models.LearningPath{}).
			Where("language_id IS NULL").
			Count(&orphans).Error; err != nil {
			return err
		}
		if orphans == 0 {
			log.Println("backfill: tidak ada learning path tanpa bahasa, dilewati")
			return nil
		}

		var lang models.Language
		err := tx.Where("slug = ?", "c").First(&lang).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			lang = models.Language{
				Name:        "C",
				Slug:        "c",
				Description: "Belajar pemrograman dengan bahasa C.",
				IsAvailable: true,
			}
			err = tx.Create(&lang).Error
		}
		if err != nil {
			return err
		}

		res := tx.Model(&models.LearningPath{}).
			Where("language_id IS NULL").
			Update("language_id", lang.ID)
		if res.Error != nil {
			return res.Error
		}

		log.Printf("backfill: %d learning path lama dihubungkan ke bahasa %q", res.RowsAffected, lang.Name)
		return nil
	})
}