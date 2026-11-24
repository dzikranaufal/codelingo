// Package shop berisi toko: membeli isi ulang hati dan Pembeku Runtunan dengan
// permata. Harga dan batas ada di internal/content/economy.go. Semua validasi
// (permata cukup, stok, hati penuh) dilakukan di sini, bukan di frontend.
package shop

import "codelingo/backend/internal/content"

const (
	ItemHeartRefill   = "heart_refill"
	ItemStreakFreeze  = "streak_freeze"
	StateOK           = "ok"
	StateFull         = "full"      // hati sudah penuh
	StateMaxOwned     = "max_owned" // sudah memiliki stok maksimal
	StateNotEnoughGem = "not_enough_gems"
)

// HeartRefillState: apakah isi ulang hati boleh dibeli sekarang.
func HeartRefillState(lives, gems int) string {
	switch {
	case lives >= content.MaxLives:
		return StateFull
	case gems < content.HeartRefillCost:
		return StateNotEnoughGem
	}
	return StateOK
}

// StreakFreezeState: apakah Pembeku Runtunan boleh dibeli sekarang.
func StreakFreezeState(owned, gems int) string {
	switch {
	case owned >= content.MaxStreakFreezes:
		return StateMaxOwned
	case gems < content.StreakFreezeCost:
		return StateNotEnoughGem
	}
	return StateOK
}

// Message = alasan yang aman ditampilkan ke user untuk state selain "ok".
func Message(state string) string {
	switch state {
	case StateFull:
		return "hati kamu sudah penuh"
	case StateMaxOwned:
		return "kamu sudah memiliki Pembeku Runtunan maksimal"
	case StateNotEnoughGem:
		return "permata kamu belum cukup"
	}
	return ""
}
