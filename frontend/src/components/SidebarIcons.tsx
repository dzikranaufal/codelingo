// frontend/src/components/SidebarIcons.tsx
// Ikon sidebar berupa SVG, jadi tajam di semua ukuran dan tidak butuh file gambar.

const RED = "#ff4b4b";

// Titik merah notifikasi (dipakai di Latihan dan Misi)
function Dot() {
  return <circle cx="26" cy="7" r="4.5" fill={RED} stroke="#fff" strokeWidth="1.5" />;
}

// Belajar: rumah beratap merah
export function HomeIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <rect x="7" y="14" width="18" height="13" rx="2" fill="#ffc800" />
      <polygon
        points="3,15 16,3 29,15"
        fill={RED}
        stroke={RED}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="20" r="3" fill="#7a4a2a" />
    </svg>
  );
}

// Karakter: kotak oranye miring dengan simbol kode </>
export function CodeTileIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <g transform="rotate(8 16 16)">
        <rect x="3" y="3" width="26" height="26" rx="8" fill="#ff9600" />
        <path
          d="M12.5 11.5L8 16l4.5 4.5M19.5 11.5L24 16l-4.5 4.5M17.5 10l-3 12"
          fill="none"
          stroke="#fff"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

// Latihan: barbel biru dengan titik merah
export function DumbbellIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <g transform="rotate(-45 16 16)">
        <rect x="8" y="14" width="16" height="4" rx="2" fill="#84d8ff" />
        <rect x="3" y="9" width="6" height="14" rx="3" fill="#1cb0f6" />
        <rect x="23" y="9" width="6" height="14" rx="3" fill="#1cb0f6" />
        <rect x="8" y="11" width="3" height="10" rx="1.5" fill="#1899d6" />
        <rect x="21" y="11" width="3" height="10" rx="1.5" fill="#1899d6" />
      </g>
      <Dot />
    </svg>
  );
}

// Papan Skor: perisai kuning
export function ShieldIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path
        d="M6 5h20a1 1 0 0 1 1 1v9c0 6-4.5 10-11 13C9.5 25 5 21 5 15V6a1 1 0 0 1 1-1z"
        fill="#ffc800"
      />
      <polygon points="5,11 13,5 18,5 5,15" fill="#ffe680" />
    </svg>
  );
}

// Misi: peti harta dengan titik merah
export function ChestIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <rect x="4" y="13" width="24" height="14" rx="2.5" fill="#f2a516" stroke="#a8620f" strokeWidth="2" />
      <path
        d="M4 15V12a6 6 0 0 1 6-6h12a6 6 0 0 1 6 6v3z"
        fill="#ffc800"
        stroke="#a8620f"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <rect x="14" y="15" width="4" height="6" rx="1" fill="#7a4a2a" />
      <Dot />
    </svg>
  );
}

// Toko: bangunan dengan tenda merah putih
export function StoreIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <rect x="6" y="13" width="20" height="14" rx="1.5" fill="#b0643a" />
      <rect x="9" y="17" width="7" height="6" rx="1" fill="#9fdcf5" />
      <rect x="18.5" y="17" width="5" height="10" rx="1" fill="#fff" />
      <path d="M4 7a2 2 0 0 1 2-2h20a2 2 0 0 1 2 2v7H4z" fill={RED} />
      <rect x="10" y="5" width="4" height="9" fill="#fff" />
      <rect x="18" y="5" width="4" height="9" fill="#fff" />
    </svg>
  );
}

// Lainnya: lingkaran ungu dengan tiga titik putih
export function MoreIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="14" fill="#ce82ff" />
      <circle cx="10.5" cy="16" r="1.8" fill="#fff" />
      <circle cx="16" cy="16" r="1.8" fill="#fff" />
      <circle cx="21.5" cy="16" r="1.8" fill="#fff" />
    </svg>
  );
}

// Logo bahasa C: segi enam biru dengan huruf C putih (kartu promo dan daftar kursus)
export function CLangIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <polygon points="24,3 42.2,13.5 42.2,34.5 24,45 5.8,34.5 5.8,13.5" fill="#00599c" />
      <polygon points="24,3 5.8,13.5 5.8,34.5 24,45" fill="#659ad2" />
      <path
        d="M30.7 19 A10 10 0 1 0 30.7 29"
        fill="none"
        stroke="#fff"
        strokeWidth="5.5"
      />
    </svg>
  );
}