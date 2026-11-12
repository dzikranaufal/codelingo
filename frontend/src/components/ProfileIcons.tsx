// frontend/src/components/ProfileIcons.tsx
// Ikon kecil untuk papan skor dan profil (SVG).

export type ShieldTone = "bronze" | "silver" | "gold" | "locked";

const SHIELD: Record<ShieldTone, { main: string; light: string }> = {
  bronze: { main: "#d9996a", light: "#eebd96" },
  silver: { main: "#c3cfda", light: "#e4ebf2" },
  gold: { main: "#ffc800", light: "#ffe680" },
  locked: { main: "#8e9aa3", light: "#a9b4bc" },
};

// Perisai liga. "locked" = liga yang belum terbuka (ada lubang kunci)
export function LeagueShield({ tone }: { tone: ShieldTone }) {
  const c = SHIELD[tone];
  return (
    <svg viewBox="0 0 48 56" aria-hidden="true">
      <path d="M6 6a2 2 0 0 1 2-2h32a2 2 0 0 1 2 2v22c0 12-9 20-18 24C15 48 6 40 6 28z" fill={c.main} />
      <path d="M11 9h26v19c0 8-6 14-13 17-7-3-13-9-13-17z" fill={c.light} />
      {tone === "gold" && <path d="M32 15c-9 1-15 8-16 18 3-1 5-3 6-5 3 0 9-2 10-13z" fill="#ff9600" />}
      {tone === "locked" && (
        <>
          <circle cx="24" cy="25" r="5" fill={c.main} />
          <rect x="22" y="27" width="4" height="9" rx="2" fill={c.main} />
        </>
      )}
    </svg>
  );
}

export function BoltIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M13 2L4 14h6l-1 8 9-12h-6z" fill="#ffc800" />
    </svg>
  );
}

export function MedalIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 15l-2 7 6-3 6 3-2-7z" fill="#aab4bd" />
      <circle cx="12" cy="10" r="7" fill="#c9d1d8" />
      <circle cx="12" cy="10" r="3.5" fill="#e6ebef" />
    </svg>
  );
}

export function FlameIcon({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 28" aria-hidden="true">
      <path d="M12 2c1 5 8 8 8 15a8 8 0 0 1-16 0c0-3 1.5-5 3-6.5C7 14 9 15 10 14c0-4 0-8 2-12z" fill={on ? "#ff9600" : "#c4c4c4"} />
      <path d="M12 14c3 2.5 4.5 4 4.5 6.5a4.5 4.5 0 0 1-9 0c0-2 1.5-3.500 4.500-6.500z" fill={on ? "#ffc800" : "#dedede"} />
    </svg>
  );
}

export function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}