import api from "./api";
import type { Stats } from "../components/StatsBar";

export interface MyStats {
  course_id: string;
  streak: number;
  hearts: number;
  max_hearts: number;
  next_heart_in_seconds: number;
  next_heart_in: string;
  xp: number;
  level: number;
  gems: number;
  streak_freezes: number;
}

export async function getMyStatsDTO(): Promise<MyStats> {
  const res = await api.get<MyStats>("/me/stats");
  return res.data;
}

// Bentuk yang dipakai komponen StatsBar.
export function toBarStats(d: MyStats): Stats {
  return {
    courseId: d.course_id,
    streak: d.streak,
    gems: d.gems,
    hearts: d.hearts,
    maxHearts: d.max_hearts,
    nextHeartIn: d.next_heart_in || undefined,
  };
}
