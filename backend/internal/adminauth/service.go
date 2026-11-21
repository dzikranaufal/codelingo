package adminauth

import (
	"errors"
	"log"
	"strings"
	"time"

	"codelingo/backend/internal/models"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// Format token sama dengan internal/auth (Dzikra): HS256, "sub" berupa angka,
// "iss" = codelingo, berlaku 24 jam. Dengan begitu middleware Authenticate bisa
// membaca token admin tanpa perubahan.
const (
	tokenIssuer = "codelingo"
	tokenTTL    = 24 * time.Hour
)

var (
	ErrInvalidCreds = errors.New("email/username atau password salah")
	ErrInternal     = errors.New("terjadi kesalahan internal")
)

// dummyHash dipakai agar waktu respons tetap mirip saat akun tidak ditemukan.
var dummyHash, _ = bcrypt.GenerateFromPassword([]byte("codelingo-dummy-password"), bcrypt.DefaultCost)

type Service struct {
	DB        *gorm.DB
	JWTSecret []byte
}

type LoginInput struct {
	Identifier string `json:"identifier"`
	Password   string `json:"password"`
}

type AdminUser struct {
	ID       uint   `json:"id"`
	Username string `json:"username"`
	Name     string `json:"name"`
	Email    string `json:"email"`
	Role     string `json:"role"`
}

type LoginResponse struct {
	Token string    `json:"token"`
	User  AdminUser `json:"user"`
}

func NewAdminUser(u *models.User) AdminUser {
	return AdminUser{
		ID:       u.ID,
		Username: u.Username,
		Name:     u.Name,
		Email:    u.Email,
		Role:     u.Role,
	}
}

// Login hanya berhasil untuk akun ber-role admin. Akun non-admin yang
// memasukkan password benar tetap dijawab "email/username atau password salah",
// agar tidak membocorkan siapa yang admin.
func (s *Service) Login(input LoginInput) (*LoginResponse, error) {
	identifier := strings.ToLower(strings.TrimSpace(input.Identifier))
	if identifier == "" || len(identifier) > 100 ||
		input.Password == "" || len(input.Password) > 72 {
		return nil, ErrInvalidCreds
	}

	var user models.User
	err := s.DB.Where("email = ? OR username = ?", identifier, identifier).First(&user).Error
	notFound := errors.Is(err, gorm.ErrRecordNotFound)
	if err != nil && !notFound {
		log.Printf("admin login: gagal mencari user: %v", err)
		return nil, ErrInternal
	}

	hash := dummyHash
	if !notFound {
		hash = []byte(user.Password)
	}
	passwordOK := bcrypt.CompareHashAndPassword(hash, []byte(input.Password)) == nil

	if notFound || !passwordOK || user.Role != models.RoleAdmin {
		return nil, ErrInvalidCreds
	}

	token, err := s.issueToken(user.ID)
	if err != nil {
		return nil, err
	}
	return &LoginResponse{Token: token, User: NewAdminUser(&user)}, nil
}

func (s *Service) issueToken(userID uint) (string, error) {
	if len(s.JWTSecret) < 32 {
		log.Println("admin login: JWT_SECRET kurang dari 32 karakter")
		return "", ErrInternal
	}

	now := time.Now()
	claims := jwt.MapClaims{
		"sub": userID,
		"iat": now.Unix(),
		"exp": now.Add(tokenTTL).Unix(),
		"iss": tokenIssuer,
	}

	signed, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(s.JWTSecret)
	if err != nil {
		log.Printf("admin login: gagal menandatangani token: %v", err)
		return "", ErrInternal
	}
	return signed, nil
}