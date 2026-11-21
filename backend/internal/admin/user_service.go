package admin

import (
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"codelingo/backend/internal/models"

	"gorm.io/gorm"
)

type UserRow struct {
	ID        uint      `json:"id"`
	Username  string    `json:"username"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Role      string    `json:"role"`
	XP        int       `json:"xp"`
	Level     int       `json:"level"`
	Lives     int       `json:"lives"`
	CreatedAt time.Time `json:"created_at"`
}

type UserListResponse struct {
	Users  []UserRow `json:"users"`
	Total  int64     `json:"total"`
	Limit  int       `json:"limit"`
	Offset int       `json:"offset"`
}

// UpdateUserInput: saat ini hanya role yang bisa diubah admin.
type UpdateUserInput struct {
	Role *string `json:"role"`
}

var userColumns = []string{"id", "username", "name", "email", "role", "xp", "level", "lives", "created_at"}

func toUserRow(u *models.User) UserRow {
	return UserRow{
		ID: u.ID, Username: u.Username, Name: u.Name, Email: u.Email, Role: u.Role,
		XP: u.XP, Level: u.Level, Lives: u.Lives, CreatedAt: u.CreatedAt,
	}
}

// escapeLike mencegah karakter % dan _ pada kata kunci dianggap pola pencarian.
func escapeLike(s string) string {
	return strings.NewReplacer(`\`, `\\`, `%`, `\%`, `_`, `\_`).Replace(s)
}

func (s *Service) userFilter(search string) *gorm.DB {
	q := s.DB.Model(&models.User{})
	search = strings.ToLower(strings.TrimSpace(search))
	if search != "" {
		like := "%" + escapeLike(search) + "%"
		q = q.Where("LOWER(username) LIKE ? OR LOWER(email) LIKE ? OR LOWER(name) LIKE ?", like, like, like)
	}
	return q
}

// ListUsers: daftar akun (tanpa password), terbaru dulu, dengan pencarian dan paginasi.
func (s *Service) ListUsers(search string, limit, offset int) (*UserListResponse, error) {
	var total int64
	if err := s.userFilter(search).Count(&total).Error; err != nil {
		return nil, internalErr("count users", err)
	}

	var users []models.User
	err := s.userFilter(search).
		Select(userColumns).
		Order("id DESC").
		Limit(limit).
		Offset(offset).
		Find(&users).Error
	if err != nil {
		return nil, internalErr("list users", err)
	}

	rows := make([]UserRow, 0, len(users))
	for i := range users {
		rows = append(rows, toUserRow(&users[i]))
	}
	return &UserListResponse{Users: rows, Total: total, Limit: limit, Offset: offset}, nil
}

func (s *Service) findUser(tx *gorm.DB, id uint) (*models.User, error) {
	var u models.User
	if err := tx.Select(userColumns).First(&u, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, newErr(http.StatusNotFound, "akun tidak ditemukan")
		}
		return nil, internalErr("find user", err)
	}
	return &u, nil
}

// UpdateUser: ubah role akun lain. Admin tidak boleh mengubah akunnya sendiri,
// sehingga selalu ada minimal satu admin.
func (s *Service) UpdateUser(actorID, targetID uint, in UpdateUserInput) (*UserRow, error) {
	if in.Role == nil {
		return nil, newErr(http.StatusBadRequest, "role wajib diisi")
	}
	if *in.Role != models.RoleUser && *in.Role != models.RoleAdmin {
		return nil, newErr(http.StatusBadRequest, "role harus user atau admin")
	}
	if actorID == targetID {
		return nil, newErr(http.StatusConflict, "anda tidak bisa mengubah akun anda sendiri")
	}

	var row *UserRow
	err := s.DB.Transaction(func(tx *gorm.DB) error {
		u, err := s.findUser(tx, targetID)
		if err != nil {
			return err
		}
		if err := tx.Model(u).Update("role", *in.Role).Error; err != nil {
			return internalErr("update role", err)
		}
		u.Role = *in.Role
		r := toUserRow(u)
		row = &r
		return nil
	})
	if err != nil {
		return nil, err
	}
	return row, nil
}

// DeleteUser: hapus akun lain. Ditolak (409) untuk akun sendiri, dan untuk akun
// yang sudah punya progress atau riwayat jawaban agar data belajar tidak hilang.
func (s *Service) DeleteUser(actorID, targetID uint) error {
	if actorID == targetID {
		return newErr(http.StatusConflict, "anda tidak bisa menghapus akun anda sendiri")
	}

	return s.DB.Transaction(func(tx *gorm.DB) error {
		u, err := s.findUser(tx, targetID)
		if err != nil {
			return err
		}

		var progress, attempts int64
		if err := tx.Model(&models.Progress{}).Where("user_id = ?", u.ID).Count(&progress).Error; err != nil {
			return internalErr("count progress", err)
		}
		if err := tx.Model(&models.QuizAttempt{}).Where("user_id = ?", u.ID).Count(&attempts).Error; err != nil {
			return internalErr("count attempts", err)
		}
		if progress > 0 || attempts > 0 {
			return newErr(http.StatusConflict,
				fmt.Sprintf("akun sudah memiliki %d progress dan %d jawaban sehingga tidak bisa dihapus", progress, attempts))
		}

		if err := tx.Delete(&models.User{}, u.ID).Error; err != nil {
			return internalErr("delete user", err)
		}
		return nil
	})
}