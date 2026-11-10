package auth

import (
	"errors"
	"strings"
	"time"
	"unicode"

	"codelingo/backend/internal/models"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

var (
	ErrInvalidInput  = errors.New("input tidak valid")
	ErrInvalidCreds  = errors.New("email/username atau password salah")
	ErrAccountExists = errors.New("email atau username sudah digunakan")
	ErrInternal      = errors.New("terjadi kesalahan internal")
)

type Service struct {
	DB        *gorm.DB
	JWTSecret []byte
}

type RegisterInput struct {
	Age      int    `json:"age"`
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginInput struct {
	Identifier string `json:"identifier"`
	Password   string `json:"password"`
}

type AuthUser struct {
	ID       uint   `json:"id"`
	Username string `json:"username"`
	Email    string `json:"email"`
}

type AuthResponse struct {
	Token string   `json:"token"`
	User  AuthUser `json:"user"`
}

func (s *Service) Register(input RegisterInput) (*AuthResponse, error) {
	username := strings.ToLower(strings.TrimSpace(input.Username))
	email := strings.ToLower(strings.TrimSpace(input.Email))

	if len(username) < 3 || len(username) > 30 ||
		len(email) > 100 || !strings.Contains(email, "@") ||
		input.Age < 1 || input.Age > 120 ||
		len(input.Password) < 8 || len(input.Password) > 72 {
		return nil, ErrInvalidInput
	}

	for _, r := range username {
		if !unicode.IsLetter(r) && !unicode.IsDigit(r) && r != '_' {
			return nil, ErrInvalidInput
		}
	}

	var count int64
	if err := s.DB.Model(&models.User{}).
		Where("username = ? OR email = ?", username, email).
		Count(&count).Error; err != nil {
		return nil, ErrInternal
	}
	if count > 0 {
		return nil, ErrAccountExists
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, ErrInternal
	}

	user := models.User{
		Name:     username,
		Username: username,
		Email:    email,
		Age:      input.Age,
		Password: string(hash),
		Role:     models.RoleUser,
	}
	if err := s.DB.Create(&user).Error; err != nil {
		// Indeks unik di database tetap menjadi perlindungan jika
		// dua request mendaftar bersamaan.
		return nil, ErrAccountExists
	}

	return s.issueToken(user)
}

func (s *Service) Login(input LoginInput) (*AuthResponse, error) {
	identifier := strings.ToLower(strings.TrimSpace(input.Identifier))
	if identifier == "" || len(identifier) > 100 ||
		len(input.Password) == 0 || len(input.Password) > 72 {
		return nil, ErrInvalidCreds
	}

	var user models.User
	err := s.DB.Where("email = ? OR username = ?", identifier, identifier).
		First(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrInvalidCreds
		}
		return nil, ErrInternal
	}

	if bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)) != nil {
		return nil, ErrInvalidCreds
	}

	return s.issueToken(user)
}

func (s *Service) issueToken(user models.User) (*AuthResponse, error) {
	if len(s.JWTSecret) < 32 {
		return nil, ErrInternal
	}

	now := time.Now()
	claims := jwt.MapClaims{
		"sub": user.ID,
		"iat": now.Unix(),
		"exp": now.Add(24 * time.Hour).Unix(),
		"iss": "codelingo",
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString(s.JWTSecret)
	if err != nil {
		return nil, ErrInternal
	}

	return &AuthResponse{
		Token: signed,
		User: AuthUser{
			ID:       user.ID,
			Username: user.Username,
			Email:    user.Email,
		},
	}, nil
}
