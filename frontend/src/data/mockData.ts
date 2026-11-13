// frontend/src/data/mockData.ts
// DATA SEMENTARA (contoh). Nanti diganti data dari backend (Tahap 6 dan 8).
// XP, peringkat, liga, pencapaian, dan status HARUS dihitung dan divalidasi backend,
// bukan dikirim dari frontend.
import type { Stats } from "../components/StatsBar";
import type { AchievementIcon, BadgeColor } from "../components/AchievementBadge";
import type { ShieldTone } from "../components/ProfileIcons";

// Username akun yang sedang login (sementara ditulis langsung)
export const ME_USERNAME = "alvina";

// Singkatan hari seperti di contoh: Rabu, Kamis, Jumat, Sabtu, Minggu, Senin, Selasa
export const WEEK_DAYS = ["Rb", "Km", "Jm", "Sb", "Mn", "Sn", "Sl"];

export type LeaderboardEntry = {
  username: string;
  name: string;
  xp: number; // XP minggu ini
};

export const leaderboard: LeaderboardEntry[] = [
  { username: "rina_pratama", name: "Rina Pratama", xp: 275 },
  { username: "dimas_w", name: "Dimas Wirawan", xp: 192 },
  { username: "salsa_kirana", name: "Salsa Kirana", xp: 104 },
  { username: "thn452", name: "thn452", xp: 100 },
  { username: "fajar_n", name: "Fajar Nugroho", xp: 92 },
  { username: "maya_lestari", name: "Maya Lestari", xp: 78 },
  { username: "bagas_s", name: "Bagas Saputra", xp: 60 },
  { username: "putri_anjani", name: "Putri Anjani", xp: 50 },
  { username: "rizky_r", name: "Rizky Ramadhan", xp: 50 },
  { username: "nadia_safitri", name: "Nadia Safitri", xp: 20 },
  { username: "hana_permata", name: "Hana Permata", xp: 14 },
  { username: "yoga_p", name: "Yoga Prasetyo", xp: 10 },
  { username: "tegar_m", name: "Tegar Mahendra", xp: 10 },
  { username: "citra_m", name: "Citra Maharani", xp: 10 },
  { username: "alvina", name: "Alvina Nuraeni", xp: 5 },
];

export type Achievement = {
  id: string;
  name: string;
  icon: AchievementIcon;
  color: BadgeColor;
  level: number;
  goal?: string; // target level berikutnya
  progress?: { current: number; target: number };
  doneText?: string; // untuk pencapaian tanpa progres
};

export type UserProfile = {
  username: string;
  displayName: string;
  joined: string;
  following: number;
  followers: number;
  streak: number;
  totalXp: number;
  league: string;
  leagueTone: ShieldTone;
  leagueWeek: number;
  top3: number;
  languages: { id: string; xp: number }[]; // id mengacu ke languages di LanguageIcons.tsx
  weeklyXp: number[]; // 7 nilai, sesuai WEEK_DAYS
  achievements: Achievement[];
};

// Data untuk bar statistik di panel kanan
export const myStats: Stats = {
  courseId: "c",
  streak: 0,
  gems: 500,
  hearts: 4,
  maxHearts: 5,
  nextHeartIn: "4 jam",
};

function spread(x: number): number[] {
  return [0, 0, Math.round(x * 0.1), Math.round(x * 0.3), Math.round(x * 0.5), Math.round(x * 0.75), x];
}

function buildAchievements(username: string): Achievement[] {
  return [
    { id: "membara", name: "Membara", icon: "flame", color: "red", level: 2, goal: "Capai runtunan 7 hari", progress: { current: 5, target: 7 } },
    { id: "orang-bijak", name: "Orang Bijak", icon: "wizard", color: "green", level: 5, goal: "Dapatkan 2000 XP", progress: { current: 1082, target: 2000 } },
    { id: "juara", name: "Juara", icon: "feather", color: "purple", level: 3, goal: "Maju ke Liga Emas", progress: { current: 2, target: 3 } },
    { id: "penembak-jitu", name: "Penembak Jitu", icon: "bow", color: "green", level: 3, goal: "Selesaikan 20 pelajaran tanpa kesalahan", progress: { current: 6, target: 20 } },
    { id: "pemenang", name: "Pemenang", icon: "trophy", color: "purple", level: 1, goal: "Raih peringkat #1 di papan skor", progress: { current: 0, target: 1 } },
    { id: "supel", name: "Supel", icon: "friends", color: "purple", level: 1, goal: "Ikuti 3 teman", progress: { current: 0, target: 3 } },
    { id: "kesatria", name: "Kesatria Akhir Minggu", icon: "helmet", color: "gold", level: 1, doneText: `${username} telah menyelesaikan satu pelajaran di hari Sabtu dan Minggu` },
    { id: "fotogenik", name: "Fotogenik", icon: "photo", color: "gold", level: 1, doneText: `${username} telah menambahkan foto profil` },
  ];
}

export function getProfile(username: string): UserProfile | undefined {
  const entry = leaderboard.find((e) => e.username === username);
  if (!entry) return undefined;

  const isExample = username === "thn452";
  const isMe = username === ME_USERNAME;

  return {
    username,
    displayName: entry.name,
    joined: "Bergabung Mei 2024",
    following: 0,
    followers: 0,
    streak: isExample ? 1 : 0,
    totalXp: isExample ? 1082 : isMe ? 192 : entry.xp * 8,
    league: "Emas",
    leagueTone: "gold",
    leagueWeek: 1,
    top3: 0,
    languages: isExample
      ? [
          { id: "c", xp: 540 },
          { id: "cpp", xp: 400 },
          { id: "python", xp: 132 },
          { id: "html", xp: 15 },
          { id: "css", xp: 14 },
        ]
      : [{ id: "c", xp: entry.xp * 5 }],
    weeklyXp: spread(entry.xp),
    achievements: buildAchievements(username),
  };
}