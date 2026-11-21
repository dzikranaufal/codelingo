package admin

import (
	"net/http"

	"codelingo/backend/internal/httpx"
	"codelingo/backend/internal/models"
)

type Stats struct {
	Students    int64     `json:"students"`
	Admins      int64     `json:"admins"`
	Languages   int64     `json:"available_languages"`
	Paths       int64     `json:"paths"`
	Lessons     int64     `json:"lessons"`
	Questions   int64     `json:"questions"`
	Attempts    int64     `json:"attempts"`
	TotalXP     int64     `json:"total_xp"`
	RecentUsers []UserRow `json:"recent_users"`
}

func (s *Service) count(model interface{}, query string, args ...interface{}) (int64, error) {
	q := s.DB.Model(model)
	if query != "" {
		q = q.Where(query, args...)
	}
	var n int64
	if err := q.Count(&n).Error; err != nil {
		return 0, internalErr("count", err)
	}
	return n, nil
}

// Stats: ringkasan angka untuk halaman awal admin.
func (s *Service) Stats() (*Stats, error) {
	var st Stats
	var err error

	if st.Students, err = s.count(&models.User{}, "role = ?", models.RoleUser); err != nil {
		return nil, err
	}
	if st.Admins, err = s.count(&models.User{}, "role = ?", models.RoleAdmin); err != nil {
		return nil, err
	}
	if st.Languages, err = s.count(&models.Language{}, "is_available = ?", true); err != nil {
		return nil, err
	}
	if st.Paths, err = s.count(&models.LearningPath{}, ""); err != nil {
		return nil, err
	}
	if st.Lessons, err = s.count(&models.Lesson{}, ""); err != nil {
		return nil, err
	}
	if st.Questions, err = s.count(&models.Question{}, ""); err != nil {
		return nil, err
	}
	if st.Attempts, err = s.count(&models.QuizAttempt{}, ""); err != nil {
		return nil, err
	}

	err = s.DB.Model(&models.User{}).
		Where("role = ?", models.RoleUser).
		Select("COALESCE(SUM(xp), 0)").
		Scan(&st.TotalXP).Error
	if err != nil {
		return nil, internalErr("sum xp", err)
	}

	var users []models.User
	if err := s.DB.Select(userColumns).Order("id DESC").Limit(5).Find(&users).Error; err != nil {
		return nil, internalErr("recent users", err)
	}
	st.RecentUsers = make([]UserRow, 0, len(users))
	for i := range users {
		st.RecentUsers = append(st.RecentUsers, toUserRow(&users[i]))
	}
	return &st, nil
}

// Stats menangani GET /api/v1/admin/stats.
func (h *Handler) Stats(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		httpx.MethodNotAllowed(w, http.MethodGet)
		return
	}
	st, err := h.Service.Stats()
	if err != nil {
		writeError(w, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, st)
}