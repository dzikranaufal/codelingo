package middleware

import (
	"context"
	"errors"
	"log"
	"math"
	"net/http"
	"strings"

	"codelingo/backend/internal/httpx"
	"codelingo/backend/internal/models"

	"github.com/golang-jwt/jwt/v5"
	"gorm.io/gorm"
)

// Harus sama dengan klaim "iss" yang dibuat internal/auth (issueToken).
const tokenIssuer = "codelingo"

var errInvalidToken = errors.New("token tidak valid")

type contextKey struct{}

// Authenticate memvalidasi "Authorization: Bearer <token>" lalu memuat user
// terbaru dari database. Role dibaca dari database, bukan dari token, sehingga
// perubahan role atau penghapusan akun langsung berlaku.
func Authenticate(db *gorm.DB, secret []byte) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			token := bearerToken(r)
			if token == "" {
				unauthorized(w)
				return
			}

			userID, err := parseUserID(token, secret)
			if err != nil {
				unauthorized(w)
				return
			}

			var user models.User
			if err := db.First(&user, userID).Error; err != nil {
				if errors.Is(err, gorm.ErrRecordNotFound) {
					unauthorized(w)
					return
				}
				log.Printf("authenticate: gagal memuat user: %v", err)
				httpx.WriteError(w, http.StatusInternalServerError, "terjadi kesalahan internal")
				return
			}

			ctx := context.WithValue(r.Context(), contextKey{}, &user)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// RequireRole membatasi akses ke role tertentu. Pasang SETELAH Authenticate.
func RequireRole(roles ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			user, ok := UserFromContext(r.Context())
			if !ok {
				unauthorized(w)
				return
			}
			for _, role := range roles {
				if user.Role == role {
					next.ServeHTTP(w, r)
					return
				}
			}
			httpx.WriteError(w, http.StatusForbidden, "anda tidak memiliki akses ke resource ini")
		})
	}
}

// UserFromContext mengambil user yang sudah diautentikasi.
func UserFromContext(ctx context.Context) (*models.User, bool) {
	u, ok := ctx.Value(contextKey{}).(*models.User)
	return u, ok
}

// parseUserID membaca token buatan internal/auth: klaim "sub" disimpan sebagai
// ANGKA (MapClaims), jadi dibaca sebagai float64, bukan string.
func parseUserID(tokenString string, secret []byte) (uint, error) {
	claims := jwt.MapClaims{}
	token, err := jwt.ParseWithClaims(
		tokenString,
		claims,
		func(t *jwt.Token) (interface{}, error) { return secret, nil },
		jwt.WithValidMethods([]string{"HS256"}),
		jwt.WithExpirationRequired(),
		jwt.WithIssuer(tokenIssuer),
	)
	if err != nil || !token.Valid {
		return 0, errInvalidToken
	}

	sub, ok := claims["sub"].(float64)
	if !ok || sub < 1 || sub != math.Trunc(sub) {
		return 0, errInvalidToken
	}
	return uint(sub), nil
}

func bearerToken(r *http.Request) string {
	parts := strings.SplitN(r.Header.Get("Authorization"), " ", 2)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		return ""
	}
	return strings.TrimSpace(parts[1])
}

func unauthorized(w http.ResponseWriter) {
	w.Header().Set("WWW-Authenticate", "Bearer")
	httpx.WriteError(w, http.StatusUnauthorized, "token tidak ada, tidak valid, atau sudah kedaluwarsa")
}