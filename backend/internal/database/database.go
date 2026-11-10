package database

import (
	"codelingo/backend/internal/config"
	"codelingo/backend/internal/models"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

// Connect membuka koneksi ke MySQL. Database harus sudah dibuat (phpMyAdmin).
func Connect(cfg config.Config) (*gorm.DB, error) {
	return gorm.Open(mysql.Open(cfg.DSN()), &gorm.Config{})
}

// Migrate membuat/menyesuaikan tabel dari struct model.
// AutoMigrate hanya menambah tabel, kolom, index, dan constraint;
// tidak menghapus kolom atau data yang sudah ada.
func Migrate(db *gorm.DB) error {
	return db.AutoMigrate(models.All()...)
}