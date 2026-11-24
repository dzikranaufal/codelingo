package quest

import "testing"

func TestProgressAndCompleted(t *testing.T) {
	xp20, _ := Find("daily_xp_20")
	les, _ := Find("daily_lesson")

	if got := Progress(xp20, 35, 0); got != 20 {
		t.Errorf("progres harus dibatasi target, dapat %d", got)
	}
	if Completed(xp20, 19, 5) {
		t.Error("19 XP belum cukup untuk target 20")
	}
	if !Completed(xp20, 20, 0) {
		t.Error("20 XP harus selesai")
	}
	if Completed(les, 100, 0) {
		t.Error("misi pelajaran tidak boleh selesai karena XP")
	}
	if !Completed(les, 0, 1) {
		t.Error("1 pelajaran harus selesai")
	}
	if Progress(xp20, -5, 0) != 0 {
		t.Error("progres negatif harus 0")
	}
}

func TestFindAndUniqueIDs(t *testing.T) {
	if _, ok := Find("tidak_ada"); ok {
		t.Error("id tak dikenal harus false")
	}
	seen := map[string]bool{}
	for _, d := range Daily {
		if seen[d.ID] || d.Target <= 0 || len(d.ID) > 30 {
			t.Errorf("definisi tidak valid: %+v", d)
		}
		seen[d.ID] = true
	}
}
