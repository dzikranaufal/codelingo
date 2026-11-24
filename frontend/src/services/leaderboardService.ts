import api from "./api";
import type { LeaderboardResponse } from "../types/leaderboard";

export async function getLeaderboard(limit = 20): Promise<LeaderboardResponse> {
  const res = await api.get<LeaderboardResponse>("/leaderboard", { params: { limit } });
  return res.data;
}

export async function getMyRank(): Promise<number | null> {
  const data = await getLeaderboard(1);
  return data.me?.rank ?? null;
}

// Simpan status emoji. Kirim "" untuk menghapus. Mengembalikan status yang tersimpan.
export async function setMyStatus(status: string): Promise<string> {
  const res = await api.put<{ status: string }>("/leaderboard/status", { status });
  return res.data.status;
}
