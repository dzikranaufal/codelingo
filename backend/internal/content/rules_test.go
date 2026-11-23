package content

import (
	"testing"
	"time"
)

func TestLevelForXP(t *testing.T) {
	cases := map[int]int{-5: 1, 0: 1, 99: 1, 100: 2, 199: 2, 200: 3, 1082: 11}
	for xp, want := range cases {
		if got := LevelForXP(xp); got != want {
			t.Errorf("LevelForXP(%d) = %d, want %d", xp, got, want)
		}
	}
}

func TestRegenLives(t *testing.T) {
	base := time.Date(2026, 11, 23, 10, 0, 0, 0, time.UTC)
	cases := []struct {
		name      string
		lives     int
		anchor    time.Time
		now       time.Time
		wantLives int
		wantAnch  time.Time
	}{
		{"penuh tetap penuh", 5, base, base.Add(5 * time.Hour), 5, base.Add(5 * time.Hour)},
		{"belum waktunya", 2, base, base.Add(29 * time.Minute), 2, base},
		{"tepat 30 menit +1", 2, base, base.Add(30 * time.Minute), 3, base.Add(30 * time.Minute)},
		{"75 menit +2, sisa 15 menit dipertahankan", 2, base, base.Add(75 * time.Minute), 4, base.Add(60 * time.Minute)},
		{"melebihi maks dipotong", 0, base, base.Add(10 * time.Hour), 5, base.Add(10 * time.Hour)},
		{"jam mundur tidak mengubah", 1, base, base.Add(-time.Hour), 1, base},
	}
	for _, c := range cases {
		gotL, gotA := RegenLives(c.lives, c.anchor, c.now)
		if gotL != c.wantLives || !gotA.Equal(c.wantAnch) {
			t.Errorf("%s: dapat (%d, %v), mau (%d, %v)", c.name, gotL, gotA, c.wantLives, c.wantAnch)
		}
	}
}

func TestNextHeartIn(t *testing.T) {
	base := time.Date(2026, 11, 23, 10, 0, 0, 0, time.UTC)
	if d := NextHeartIn(5, base, base); d != 0 {
		t.Errorf("penuh harus 0, dapat %v", d)
	}
	if d := NextHeartIn(3, base, base.Add(10*time.Minute)); d != 20*time.Minute {
		t.Errorf("harus 20 menit, dapat %v", d)
	}
	if d := NextHeartIn(3, base, base.Add(2*time.Hour)); d != 0 {
		t.Errorf("lewat waktu harus 0, dapat %v", d)
	}
}

func TestStreak(t *testing.T) {
	today := time.Date(2026, 11, 23, 15, 0, 0, 0, time.UTC)
	cases := []struct {
		name string
		days []string
		want int
	}{
		{"kosong", nil, 0},
		{"hanya hari ini", []string{"2026-11-23"}, 1},
		{"hari ini dan 2 hari sebelumnya", []string{"2026-11-21", "2026-11-22", "2026-11-23"}, 3},
		{"kemarin masih hidup", []string{"2026-11-21", "2026-11-22"}, 2},
		{"putus 2 hari", []string{"2026-11-20", "2026-11-21"}, 0},
		{"ada celah", []string{"2026-11-23", "2026-11-22", "2026-11-20"}, 2},
		{"duplikat dan tidak berurutan", []string{"2026-11-22", "2026-11-23", "2026-11-22"}, 2},
		{"lintas bulan", []string{"2026-10-31", "2026-11-01"}, 0},
	}
	for _, c := range cases {
		if got := Streak(c.days, today); got != c.want {
			t.Errorf("%s: dapat %d, mau %d", c.name, got, c.want)
		}
	}
	// lintas bulan yang valid
	d := time.Date(2026, 12, 1, 9, 0, 0, 0, time.UTC)
	if got := Streak([]string{"2026-11-29", "2026-11-30", "2026-12-01"}, d); got != 3 {
		t.Errorf("lintas bulan: dapat %d, mau 3", got)
	}
}

func TestFirstTryScore(t *testing.T) {
	attempts := []Attempt{
		{1, false}, {1, true}, // soal 1: salah dulu, tidak dihitung
		{2, true},             // soal 2: benar langsung
		{3, true}, {3, false}, // soal 3: percobaan pertama benar
	}
	if got := FirstTryScore(attempts); got != 2 {
		t.Errorf("dapat %d, mau 2", got)
	}
	if got := FirstTryScore(nil); got != 0 {
		t.Errorf("kosong harus 0, dapat %d", got)
	}
}

func TestFormatWait(t *testing.T) {
	cases := map[time.Duration]string{
		0:                            "1 menit",
		20 * time.Minute:             "20 menit",
		20*time.Minute + time.Second: "21 menit",
		60 * time.Minute:             "1 jam",
		90 * time.Minute:             "1 jam 30 menit",
	}
	for d, want := range cases {
		if got := FormatWait(d); got != want {
			t.Errorf("FormatWait(%v) = %q, mau %q", d, got, want)
		}
	}
}
