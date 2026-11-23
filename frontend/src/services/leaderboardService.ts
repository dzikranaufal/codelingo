import api from "./api";
import type { LeaderboardResponse } from "../types/leaderboard";

export async function getLeaderboard(limit = 10): Promise<LeaderboardResponse> {
  const res = await api.get<LeaderboardResponse>("/leaderboard", { params: { limit } });
  return res.data;
}

export async function getMyRank(): Promise<number | null> {
  const data = await getLeaderboard(1);
  return data.me?.rank ?? null;
}
