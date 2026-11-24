package content

import (
	"strconv"
	"time"
)

// Aturan permainan. Semua fungsi di file ini murni (tanpa database) supaya
// mudah dites. Perhitungan XP, level, nyawa, dan streak HARUS dilakukan di
// backend, bukan dipercaya dari frontend.

const (
	MaxLives           = 5
	HeartRegenInterval = 30 * time.Minute
	XPPerLevel         = 100
)

// LevelForXP: level 1 untuk 0-99 XP, level 2 untuk 100-199 XP, dst.
func LevelForXP(xp int) int {
	if xp < 0 {
		xp = 0
	}
	return xp/XPPerLevel + 1
}

// RegenLives menghitung nyawa setelah regenerasi. anchor = waktu terakhir
// hitungan regenerasi dimulai. Mengembalikan nyawa baru dan anchor baru.
// Nyawa penuh tidak butuh anchor, jadi anchor dikembalikan sebagai now.
func RegenLives(lives int, anchor, now time.Time) (int, time.Time) {
	if lives >= MaxLives {
		return lives, now
	}
	if now.Before(anchor) {
		return lives, anchor
	}
	gained := int(now.Sub(anchor) / HeartRegenInterval)
	if gained == 0 {
		return lives, anchor
	}
	lives += gained
	if lives >= MaxLives {
		return MaxLives, now
	}
	return lives, anchor.Add(time.Duration(gained) * HeartRegenInterval)
}

// NextHeartIn = sisa waktu sampai nyawa bertambah satu. 0 jika sudah penuh.
func NextHeartIn(lives int, anchor, now time.Time) time.Duration {
	if lives >= MaxLives {
		return 0
	}
	left := anchor.Add(HeartRegenInterval).Sub(now)
	if left < 0 {
		return 0
	}
	return left
}

const dayKeyLayout = "2006-01-02"

// Streak = StreakWithFreezes tanpa Pembeku Runtunan.
func Streak(dayKeys []string, today time.Time) int {
	n, _ := StreakWithFreezes(dayKeys, today, 0)
	return n
}

// StreakWithFreezes menghitung runtunan hari beruntun.
// dayKeys berisi tanggal "YYYY-MM-DD" hari aktif (termasuk hari yang sudah
// dibekukan sebelumnya; boleh duplikat, urutan bebas).
//
// Runtunan masih hidup jika hari ini ATAU kemarin aktif. Satu hari bolong yang
// diapit hari aktif ditutup memakai satu Pembeku (maks. `freezes` buah); hari
// itu ikut dihitung. Dua hari bolong beruntun memutus runtunan.
//
// Mengembalikan runtunan dan daftar hari yang BARU dibekukan pada perhitungan
// ini. Pemanggil wajib menyimpannya dan mengurangi stok Pembeku, supaya
// perhitungan berikutnya konsisten.
func StreakWithFreezes(dayKeys []string, today time.Time, freezes int) (int, []string) {
	active := make(map[string]bool, len(dayKeys))
	for _, k := range dayKeys {
		active[k] = true
	}

	day := today
	if !active[day.Format(dayKeyLayout)] {
		day = day.AddDate(0, 0, -1)
	}

	n := 0
	var used []string
	for {
		k := day.Format(dayKeyLayout)
		if active[k] {
			n++
			day = day.AddDate(0, 0, -1)
			continue
		}
		prev := day.AddDate(0, 0, -1)
		if len(used) < freezes && active[prev.Format(dayKeyLayout)] {
			used = append(used, k)
			n++
			day = prev
			continue
		}
		break
	}
	return n, used
}

// DayStart = 00:00 pada hari yang sama dengan t (zona waktu t).
func DayStart(t time.Time) time.Time {
	y, m, d := t.Date()
	return time.Date(y, m, d, 0, 0, 0, 0, t.Location())
}

// WeekStart = Senin 00:00 pada pekan t. Pekan berjalan Senin sampai Minggu.
func WeekStart(t time.Time) time.Time {
	d := DayStart(t)
	return d.AddDate(0, 0, -((int(d.Weekday()) + 6) % 7))
}

// DaysLeftInWeek = sisa hari sampai pekan berganti (dibulatkan ke atas, minimal 1).
func DaysLeftInWeek(t time.Time) int {
	left := WeekStart(t).AddDate(0, 0, 7).Sub(t)
	days := int((left + 24*time.Hour - 1) / (24 * time.Hour))
	if days < 1 {
		days = 1
	}
	return days
}

// Attempt = catatan satu jawaban, dipakai untuk menghitung skor.
type Attempt struct {
	QuestionID uint
	Correct    bool
}

// FirstTryScore = jumlah soal yang dijawab benar pada percobaan PERTAMA.
// attempts harus urut dari yang paling lama.
func FirstTryScore(attempts []Attempt) int {
	seen := make(map[uint]bool, len(attempts))
	score := 0
	for _, a := range attempts {
		if seen[a.QuestionID] {
			continue
		}
		seen[a.QuestionID] = true
		if a.Correct {
			score++
		}
	}
	return score
}

// FormatWait mengubah durasi menjadi teks singkat berbahasa Indonesia.
func FormatWait(d time.Duration) string {
	mins := int((d + time.Minute - 1) / time.Minute) // bulatkan ke atas
	if mins < 1 {
		mins = 1
	}
	if mins >= 60 {
		h, m := mins/60, mins%60
		if m == 0 {
			return strconv.Itoa(h) + " jam"
		}
		return strconv.Itoa(h) + " jam " + strconv.Itoa(m) + " menit"
	}
	return strconv.Itoa(mins) + " menit"
}
