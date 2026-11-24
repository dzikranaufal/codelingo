// Package quest berisi misi harian. Progres dihitung dari xp_events hari ini
// (bukan dari angka kiriman frontend), hadiah permata diklaim sekali per misi
// per hari lewat tabel quest_claims.
package quest

// Definition: satu misi harian. Metric "xp" = total XP hari ini,
// "lessons" = jumlah pelajaran yang selesai hari ini.
type Definition struct {
	ID     string
	Title  string
	Metric string
	Target int
}

const (
	MetricXP      = "xp"
	MetricLessons = "lessons"
)

// Daily = daftar misi harian (urutan = urutan tampil).
var Daily = []Definition{
	{ID: "daily_lesson", Title: "Selesaikan 1 pelajaran", Metric: MetricLessons, Target: 1},
	{ID: "daily_xp_20", Title: "Dapatkan 20 XP", Metric: MetricXP, Target: 20},
	{ID: "daily_xp_50", Title: "Dapatkan 50 XP", Metric: MetricXP, Target: 50},
}

// Find mencari definisi misi berdasarkan id.
func Find(id string) (Definition, bool) {
	for _, d := range Daily {
		if d.ID == id {
			return d, true
		}
	}
	return Definition{}, false
}

// Progress membatasi progres di target (tidak pernah melebihi 100%).
func Progress(d Definition, xp, lessons int) int {
	v := xp
	if d.Metric == MetricLessons {
		v = lessons
	}
	if v < 0 {
		v = 0
	}
	if v > d.Target {
		return d.Target
	}
	return v
}

// Completed: target tercapai.
func Completed(d Definition, xp, lessons int) bool {
	return Progress(d, xp, lessons) >= d.Target
}
