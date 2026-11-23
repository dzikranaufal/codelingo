export interface LeaderboardEntry {
  rank: number;
  username: string;
  name: string;
  level: number;
  xp: number;
  is_me: boolean;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  me: LeaderboardEntry | null; // null untuk akun admin
}
