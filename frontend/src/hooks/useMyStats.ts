import { useEffect, useState } from "react";
import type { Stats } from "../components/StatsBar";
import { getMyStatsDTO, toBarStats } from "../services/statsService";

// Statistik bar (streak, nyawa, bahasa aktif) dari backend.
// null = belum dimuat atau gagal dimuat; pemanggil cukup tidak menampilkan bar-nya.
export function useMyStats(): Stats | null {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMyStatsDTO()
      .then((d) => {
        if (!cancelled) setStats(toBarStats(d));
      })
      .catch(() => {
        /* statistik bersifat pelengkap; halaman tetap jalan tanpa bar */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return stats;
}
