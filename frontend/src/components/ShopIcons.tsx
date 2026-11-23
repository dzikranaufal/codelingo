// Ikon untuk halaman Toko dan Misi (SVG).

export function HeartBigIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 21.5C5 16 2.5 12.5 2.5 8.8A5 5 0 0 1 12 6.4a5 5 0 0 1 9.5 2.4c0 3.7-2.5 7.2-9.5 12.7z"
        fill="#ff4b4b"
        stroke="#ffc9c9"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <ellipse cx="7.5" cy="9" rx="2" ry="1.3" fill="#fff" opacity="0.6" transform="rotate(-30 7.5 9)" />
    </svg>
  );
}

export function InfinityHeartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id="inf-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2fd493" />
          <stop offset="0.5" stopColor="#1cb0f6" />
          <stop offset="1" stopColor="#ce82ff" />
        </linearGradient>
      </defs>
      <path
        d="M12 21.5C5 16 2.5 12.5 2.5 8.8A5 5 0 0 1 12 6.4a5 5 0 0 1 9.5 2.4c0 3.7-2.5 7.2-9.5 12.7z"
        fill="url(#inf-grad)"
      />
      <path
        d="M8 11.5c0-1.4 1.1-2.4 2.4-2.4 2.8 0 3.2 4.800 6 4.800 1.300 0 2.400-1 2.400-2.400S17.700 9.100 16.400 9.100c-2.800 0-3.200 4.800-6 4.800C9.100 13.900 8 12.900 8 11.500z"
        fill="none"
        stroke="#fff"
        strokeWidth="1.800"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function FreezeIcon() {
  return (
    <svg viewBox="0 0 48 56" aria-hidden="true">
      <polygon points="24,2 40,14 44,34 32,52 16,52 4,34 8,14" fill="#84d8ff" />
      <polygon points="24,10 34,18 36,32 28,44 20,44 12,32 14,18" fill="#1cb0f6" />
      <polygon points="24,10 14,18 12,32 22,24" fill="#c9eeff" />
    </svg>
  );
}

export function GemIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <polygon points="12,2 21,7.5 21,16.5 12,22 3,16.5 3,7.5" fill="#1cb0f6" />
      <polygon points="12,2 21,7.5 12,12 3,7.5" fill="#84d8ff" />
    </svg>
  );
}

export function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="10" width="16" height="12" rx="3" fill="#8e9aa3" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="#8e9aa3" strokeWidth="3" />
      <circle cx="12" cy="16" r="1.8" fill="#fff" />
    </svg>
  );
}

export function TargetIcon() {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="22" r="15" fill="#58cc02" />
      <circle cx="20" cy="22" r="10.5" fill="#fff" />
      <circle cx="20" cy="22" r="6.5" fill="#58cc02" />
      <circle cx="20" cy="22" r="2.5" fill="#fff" />
      <path d="M21 21L34 8M34 8l-6 0M34 8l0 6" fill="none" stroke="#2b8a00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CodeTileBlueIcon() {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <rect x="3" y="3" width="34" height="34" rx="10" fill="#1cb0f6" />
      <path
        d="M16 14l-6 6 6 6M24 14l6 6-6 6M21.500 12l-3 16"
        fill="none"
        stroke="#fff"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Peti hadiah kecil (ujung bar misi)
export function QuestChestIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <rect x="4" y="13" width="24" height="14" rx="2.5" fill="#d98a4b" stroke="#a8620f" strokeWidth="2" />
      <path d="M4 15V12a6 6 0 0 1 6-6h12a6 6 0 0 1 6 6v3z" fill="#e9a35d" stroke="#a8620f" strokeWidth="2" strokeLinejoin="round" />
      <rect x="14" y="15" width="4" height="6" rx="1" fill="#7a4a2a" />
    </svg>
  );
}

// Koin emas dengan petir (kartu tantangan bulanan)
export function CoinIcon() {
  return (
    <svg viewBox="0 0 96 96" aria-hidden="true">
      <circle cx="70" cy="30" r="26" fill="#78c800" />
      <circle cx="42" cy="54" r="38" fill="#ffc800" />
      <circle cx="42" cy="54" r="30" fill="#ffd84d" />
      <path d="M48 32L32 58h12l-4 18 18-28H46z" fill="#ff9600" />
    </svg>
  );
}

export function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <path d="M12 7v5l3 2" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}