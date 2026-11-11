// frontend/src/components/Sidebar.tsx
import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import {
  HomeIcon,
  CodeTileIcon,
  DumbbellIcon,
  ShieldIcon,
  ChestIcon,
  StoreIcon,
  MoreIcon,
  CLangIcon,
} from "./SidebarIcons";
import "./Sidebar.css";

type MenuItem = {
  label: string;
  icon: ReactNode; // teks atau komponen SVG dari SidebarIcons.tsx
  path?: string; // tujuan halaman. Kalau kosong, menu hanya berubah warna
  // round = lingkaran putus-putus (avatar profil)
  variant?: "round";
};

// Props: semua opsional, jadi <Sidebar /> tetap bisa dipakai tanpa argumen
type SidebarProps = {
  defaultActive?: string; // menu yang aktif saat pertama tampil
  onSelect?: (label: string) => void; // dipanggil setiap menu diklik
};

// Tambah atau hapus menu cukup lewat array ini.
// Isi "path" kalau halaman tujuannya sudah ada di App.tsx.
const menuItems: MenuItem[] = [
  { label: "Belajar", icon: <HomeIcon />, path: "/belajar" },
  { label: "Karakter", icon: <CodeTileIcon /> },
  { label: "Latihan", icon: <DumbbellIcon /> },
  { label: "Papan Skor", icon: <ShieldIcon />, path: "/papan-skor" },
  { label: "Misi", icon: <ChestIcon /> },
  { label: "Toko", icon: <StoreIcon /> },
  { label: "Profil", icon: "A", path: "/profile", variant: "round" },
  { label: "Lainnya", icon: <MoreIcon /> },
];

export default function Sidebar({ defaultActive = "Belajar", onSelect }: SidebarProps) {
  const navigate = useNavigate();

  // Menyimpan menu yang sedang aktif
  const [active, setActive] = useState<string>(defaultActive);

  const handleClick = (item: MenuItem) => {
    setActive(item.label);
    onSelect?.(item.label); // beri tahu komponen induk (kalau ada)
    if (item.path) navigate(item.path); // pindah halaman kalau menu punya tujuan
  };

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <img src={logo} alt="" className="sidebar__logo" />
        codelingo
      </div>

      <nav aria-label="Menu utama">
        <ul className="sidebar__list">
          {menuItems.map((item) => {
            const isActive = active === item.label;
            return (
              <li key={item.label}>
                <button
                  type="button"
                  className={`sidebar__item${isActive ? " sidebar__item--active" : ""}`}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => handleClick(item)}
                >
                  <span
                    className={`sidebar__icon${item.variant ? ` sidebar__icon--${item.variant}` : ""}`}
                    aria-hidden="true"
                  >
                    {item.icon}
                  </span>
                  <span className="sidebar__label">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Kartu promo di bawah menu */}
      <div className="sidebar__promo">
        <div className="sidebar__promo-icon" aria-hidden="true">
          <CLangIcon />
        </div>
        <h3>Mau belajar bahasa C?</h3>
        <p>Jadi mudah dengan CodeLingo!</p>
        <button type="button" className="sidebar__promo-btn">
          Coba bahasa C
        </button>
      </div>
    </aside>
  );
}