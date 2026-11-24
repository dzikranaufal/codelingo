package shop

import (
	"errors"
	"log"
	"net/http"
	"time"

	"codelingo/backend/internal/content"
	"codelingo/backend/internal/models"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type APIError struct {
	Status  int
	Message string
}

func (e *APIError) Error() string { return e.Message }

func newErr(status int, msg string) *APIError { return &APIError{Status: status, Message: msg} }

func internalErr(op string, err error) *APIError {
	log.Printf("shop: %s: %v", op, err)
	return newErr(http.StatusInternalServerError, "terjadi kesalahan internal")
}

type Service struct {
	DB  *gorm.DB
	Now func() time.Time
}

func (s *Service) now() time.Time {
	if s.Now != nil {
		return s.Now()
	}
	return time.Now()
}

// Item: State "ok" berarti boleh dibeli; selain itu lihat konstanta State*.
type Item struct {
	ID    string `json:"id"`
	Cost  int    `json:"cost"`
	State string `json:"state"`
	Owned int    `json:"owned"` // hanya relevan untuk streak_freeze
	Max   int    `json:"max"`   // hanya relevan untuk streak_freeze
}

type Response struct {
	Gems      int    `json:"gems"`
	Hearts    int    `json:"hearts"`
	MaxHearts int    `json:"max_hearts"`
	Items     []Item `json:"items"`
}

func build(u *models.User, lives int) *Response {
	return &Response{
		Gems: u.Gems, Hearts: lives, MaxHearts: content.MaxLives,
		Items: []Item{
			{ID: ItemHeartRefill, Cost: content.HeartRefillCost, State: HeartRefillState(lives, u.Gems)},
			{
				ID: ItemStreakFreeze, Cost: content.StreakFreezeCost,
				State: StreakFreezeState(u.StreakFreezes, u.Gems),
				Owned: u.StreakFreezes, Max: content.MaxStreakFreezes,
			},
		},
	}
}

// livesNow = nyawa user setelah regenerasi (tidak menyimpan apa pun).
func (s *Service) livesNow(u *models.User) (int, time.Time) {
	now := s.now()
	anchor := now
	if u.LivesUpdatedAt != nil {
		anchor = *u.LivesUpdatedAt
	}
	return content.RegenLives(u.Lives, anchor, now)
}

// Get: katalog toko beserta status tiap barang untuk user ini.
func (s *Service) Get(userID uint) (*Response, error) {
	var u models.User
	if err := s.DB.First(&u, userID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, newErr(http.StatusUnauthorized, "akun tidak ditemukan")
		}
		return nil, internalErr("load user", err)
	}
	lives, _ := s.livesNow(&u)
	return build(&u, lives), nil
}

// Purchase membeli satu barang. Seluruhnya satu transaksi dengan baris user
// terkunci, sehingga dua klik cepat tidak bisa membelanjakan permata yang sama.
func (s *Service) Purchase(userID uint, item string) (*Response, error) {
	if item != ItemHeartRefill && item != ItemStreakFreeze {
		return nil, newErr(http.StatusBadRequest, "barang tidak dikenal")
	}

	var resp *Response
	err := s.DB.Transaction(func(tx *gorm.DB) error {
		var u models.User
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&u, userID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return newErr(http.StatusUnauthorized, "akun tidak ditemukan")
			}
			return internalErr("lock user", err)
		}

		lives, _ := s.livesNow(&u)
		var state string
		var cost int
		switch item {
		case ItemHeartRefill:
			state, cost = HeartRefillState(lives, u.Gems), content.HeartRefillCost
		case ItemStreakFreeze:
			state, cost = StreakFreezeState(u.StreakFreezes, u.Gems), content.StreakFreezeCost
		}
		if state != StateOK {
			return newErr(http.StatusConflict, Message(state))
		}

		updates := map[string]interface{}{"gems": u.Gems - cost}
		switch item {
		case ItemHeartRefill:
			updates["lives"] = content.MaxLives
			updates["lives_updated_at"] = s.now()
			lives = content.MaxLives
		case ItemStreakFreeze:
			updates["streak_freezes"] = u.StreakFreezes + 1
		}
		if err := tx.Model(&models.User{}).Where("id = ?", userID).Updates(updates).Error; err != nil {
			return internalErr("apply purchase", err)
		}

		u.Gems -= cost
		if item == ItemStreakFreeze {
			u.StreakFreezes++
		}
		resp = build(&u, lives)
		return nil
	})
	if err != nil {
		return nil, err
	}
	return resp, nil
}
