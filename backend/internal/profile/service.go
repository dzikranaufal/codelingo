package profile

import (
	"errors"
	"log"
	"strings"
	"unicode/utf8"

	"codelingo/backend/internal/models"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

var (
	ErrInvalidInput  = errors.New("input tidak valid")
	ErrWrongPassword = errors.New("password saat ini salah")
	ErrSamePassword  = errors.New("password baru harus berbeda")
	ErrInternal      = errors.New("terjadi kesalahan internal")
)

type Service struct {
	DB *gorm.DB
}

// Response adalah data profil yang dikirim ke frontend (tanpa password).
type Response struct {
	ID       uint   `json:"id"`
	Username string `json:"username"`
	Name     string `json:"name"`
	Email    string `json:"email"`
	Age      int    `json:"age"`
	Role     string `json:"role"`
	XP       int    `json:"xp"`
	Level    int    `json:"level"`
	Lives    int    `json:"lives"`
}

func NewResponse(u *models.User) Response {
	return Response{
		ID:       u.ID,
		Username: u.Username,
		Name:     u.Name,
		Email:    u.Email,
		Age:      u.Age,
		Role:     u.Role,
		XP:       u.XP,
		Level:    u.Level,
		Lives:    u.Lives,
	}
}

// UpdateName hanya mengubah kolom name. Kolom lain tidak bisa diubah dari sini.
func (s *Service) UpdateName(user *models.User, name string) error {
	name = strings.TrimSpace(name)
	if n := utf8.RuneCountInString(name); n < 2 || n > 100 {
		return ErrInvalidInput
	}

	if err := s.DB.Model(user).Update("name", name).Error; err != nil {
		log.Printf("profile: gagal update name: %v", err)
		return ErrInternal
	}
	user.Name = name
	return nil
}

func (s *Service) ChangePassword(user *models.User, current, next string) error {
	if current == "" || len(next) < 8 || len(next) > 72 {
		return ErrInvalidInput
	}
	if bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(current)) != nil {
		return ErrWrongPassword
	}
	if current == next {
		return ErrSamePassword
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(next), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("profile: gagal hash password: %v", err)
		return ErrInternal
	}

	if err := s.DB.Model(user).Update("password", string(hash)).Error; err != nil {
		log.Printf("profile: gagal update password: %v", err)
		return ErrInternal
	}
	user.Password = string(hash)
	return nil
}