export interface LeaderboardEntry {
  rank: number;
  username: string;
  name: string;
  level: number;
  xp: number; // total XP seumur hidup
  weekly_xp: number; // XP minggu ini (dasar peringkat)
  status: string; // emoji status, "" bila kosong
  is_me: boolean;
}

export interface LeaderboardWeek {
  starts_at: string;
  ends_at: string;
  days_left: number;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  me: LeaderboardEntry | null; // null untuk akun admin
  week: LeaderboardWeek;
}
