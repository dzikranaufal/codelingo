package quest

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
	log.Printf("quest: %s: %v", op, err)
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

type Item struct {
	ID        string `json:"id"`
	Title     string `json:"title"`
	Progress  int    `json:"progress"`
	Target    int    `json:"target"`
	Reward    int    `json:"reward_gems"`
	Completed bool   `json:"completed"`
	Claimed   bool   `json:"claimed"`
}

type Response struct {
	Quests   []Item `json:"quests"`
	Gems     int    `json:"gems"`
	ResetsAt string `json:"resets_at"` // tengah malam server-local berikutnya
}

// today menghitung total XP dan jumlah pelajaran yang selesai hari ini.
func (s *Service) today(db *gorm.DB, userID uint, start, end time.Time) (xp, lessons int, err error) {
	var row struct {
		XP      int
		Lessons int
	}
	err = db.Model(&models.XPEvent{}).
		Select("COALESCE(SUM(amount), 0) AS xp, COALESCE(SUM(CASE WHEN source = 'lesson' THEN 1 ELSE 0 END), 0) AS lessons").
		Where("user_id = ? AND created_at >= ? AND created_at < ?", userID, start, end).
		Scan(&row).Error
	return row.XP, row.Lessons, err
}

func (s *Service) claimedIDs(db *gorm.DB, userID uint, day time.Time) (map[string]bool, error) {
	var ids []string
	err := db.Model(&models.QuestClaim{}).
		Where("user_id = ? AND day = ?", userID, day.Format("2006-01-02")).
		Pluck("quest_id", &ids).Error
	m := make(map[string]bool, len(ids))
	for _, id := range ids {
		m[id] = true
	}
	return m, err
}

func buildItems(xp, lessons int, claimed map[string]bool) []Item {
	items := make([]Item, 0, len(Daily))
	for _, d := range Daily {
		items = append(items, Item{
			ID: d.ID, Title: d.Title, Target: d.Target, Reward: content.QuestGems,
			Progress:  Progress(d, xp, lessons),
			Completed: Completed(d, xp, lessons),
			Claimed:   claimed[d.ID],
		})
	}
	return items
}

// List: misi hari ini beserta progres nyata dan status klaim.
func (s *Service) List(userID uint) (*Response, error) {
	now := s.now()
	start := content.DayStart(now)
	end := start.AddDate(0, 0, 1)

	var u models.User
	if err := s.DB.Select("id", "gems").First(&u, userID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, newErr(http.StatusUnauthorized, "akun tidak ditemukan")
		}
		return nil, internalErr("load user", err)
	}
	xp, lessons, err := s.today(s.DB, userID, start, end)
	if err != nil {
		return nil, internalErr("progress", err)
	}
	claimed, err := s.claimedIDs(s.DB, userID, start)
	if err != nil {
		return nil, internalErr("claims", err)
	}
	return &Response{Quests: buildItems(xp, lessons, claimed), Gems: u.Gems, ResetsAt: end.Format(time.RFC3339)}, nil
}

// Claim menukar misi selesai dengan permata. Aman terhadap klik ganda:
// primary key quest_claims membuat insert kedua tidak menambah baris, dan
// permata hanya ditambah bila insert benar-benar membuat baris.
func (s *Service) Claim(userID uint, questID string) (*Response, error) {
	def, ok := Find(questID)
	if !ok {
		return nil, newErr(http.StatusNotFound, "misi tidak ditemukan")
	}
	now := s.now()
	start := content.DayStart(now)
	end := start.AddDate(0, 0, 1)

	err := s.DB.Transaction(func(tx *gorm.DB) error {
		var u models.User
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Select("id", "gems").First(&u, userID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return newErr(http.StatusUnauthorized, "akun tidak ditemukan")
			}
			return internalErr("lock user", err)
		}
		xp, lessons, err := s.today(tx, userID, start, end)
		if err != nil {
			return internalErr("progress", err)
		}
		if !Completed(def, xp, lessons) {
			return newErr(http.StatusConflict, "misi belum selesai")
		}
		res := tx.Clauses(clause.OnConflict{DoNothing: true}).
			Create(&models.QuestClaim{UserID: userID, QuestID: def.ID, Day: start})
		if res.Error != nil {
			return internalErr("insert claim", res.Error)
		}
		if res.RowsAffected == 0 {
			return newErr(http.StatusConflict, "hadiah misi ini sudah diklaim")
		}
		if err := tx.Model(&models.User{}).Where("id = ?", userID).
			Update("gems", gorm.Expr("gems + ?", content.QuestGems)).Error; err != nil {
			return internalErr("grant gems", err)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return s.List(userID)
}
