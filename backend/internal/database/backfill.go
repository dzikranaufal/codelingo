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

// BackfillXPEvents membuat satu baris buku besar XP untuk user lama yang sudah
// punya XP tetapi belum punya riwayat xp_events. Baris diberi tanggal lama
// (2000-01-01) supaya XP lama tidak dihitung sebagai XP minggu ini maupun misi
// hari ini. Aman dijalankan berulang: user yang sudah punya riwayat dilewati.
func BackfillXPEvents(db *gorm.DB) error {
	res := db.Exec(`
		INSERT INTO xp_events (user_id, amount, source, created_at)
		SELECT u.id, u.xp, 'backfill', '2000-01-01 00:00:00'
		FROM users u
		WHERE u.xp > 0
		  AND NOT EXISTS (SELECT 1 FROM xp_events e WHERE e.user_id = u.id)`)
	if res.Error != nil {
		return res.Error
	}
	log.Printf("backfill: %d user lama dibuatkan riwayat XP", res.RowsAffected)
	return nil
}
