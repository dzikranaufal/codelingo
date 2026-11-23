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

// Streak menghitung jumlah hari beruntun yang punya aktivitas.
// dayKeys berisi tanggal "YYYY-MM-DD" (boleh duplikat, urutan bebas).
// Streak masih hidup jika hari ini ATAU kemarin ada aktivitas.
func Streak(dayKeys []string, today time.Time) int {
	active := make(map[string]bool, len(dayKeys))
	for _, k := range dayKeys {
		active[k] = true
	}

	day := today
	if !active[day.Format(dayKeyLayout)] {
		day = day.AddDate(0, 0, -1)
		if !active[day.Format(dayKeyLayout)] {
			return 0
		}
	}

	n := 0
	for active[day.Format(dayKeyLayout)] {
		n++
		day = day.AddDate(0, 0, -1)
	}
	return n
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
