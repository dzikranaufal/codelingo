package shop

import (
	"testing"

	"codelingo/backend/internal/content"
)

func TestHeartRefillState(t *testing.T) {
	cases := []struct {
		lives, gems int
		want        string
	}{
		{content.MaxLives, 9999, StateFull}, // penuh menang atas permata
		{3, content.HeartRefillCost - 1, StateNotEnoughGem},
		{3, content.HeartRefillCost, StateOK},
		{0, 1000, StateOK},
		{0, 0, StateNotEnoughGem},
	}
	for _, c := range cases {
		if got := HeartRefillState(c.lives, c.gems); got != c.want {
			t.Errorf("HeartRefillState(%d, %d) = %q, mau %q", c.lives, c.gems, got, c.want)
		}
	}
}

func TestStreakFreezeState(t *testing.T) {
	cases := []struct {
		owned, gems int
		want        string
	}{
		{content.MaxStreakFreezes, 9999, StateMaxOwned},
		{0, content.StreakFreezeCost - 1, StateNotEnoughGem},
		{0, content.StreakFreezeCost, StateOK},
		{content.MaxStreakFreezes - 1, content.StreakFreezeCost, StateOK},
	}
	for _, c := range cases {
		if got := StreakFreezeState(c.owned, c.gems); got != c.want {
			t.Errorf("StreakFreezeState(%d, %d) = %q, mau %q", c.owned, c.gems, got, c.want)
		}
	}
}
