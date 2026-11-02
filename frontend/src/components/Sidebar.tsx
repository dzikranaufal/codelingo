// frontend/src/components/Sidebar.tsx
import { useState } from "react";
import logo from "../assets/logo.png";
import "./Sidebar.css";

type MenuItem = {
  label: string;
  icon: string;
  // round  = lingkaran putus-putus (avatar profil)
  // kana   = huruf besar berwarna biru (menu Karakter)
  // purple = lingkaran ungu (menu Lainnya)
  variant?: "round" | "kana" | "purple";
};

// Props: semua opsional, jadi <Sidebar /> tetap bisa dipakai tanpa argumen
type SidebarProps = {
  defaultActive?: string; // menu yang aktif saat pertama tampil
  onSelect?: (label: string) => void; // dipanggil setiap menu diklik
};

// Tambah atau hapus menu cukup lewat array ini
const menuItems: MenuItem[] = [
  { label: "Belajar", icon: "🏠" },
  { label: "Karakter", icon: "あ", variant: "kana" },
  { label: "Latihan", icon: "🏋️" },
  { label: "Papan Skor", icon: "🛡️" },
  { label: "Misi", icon: "🎁" },
  { label: "Toko", icon: "🏪" },
  { label: "Profil", icon: "A", variant: "round" },
  { label: "Lainnya", icon: "···", variant: "purple" },
];

export default function Sidebar({ defaultActive = "Belajar", onSelect }: SidebarProps) {
  // Menyimpan menu yang sedang aktif
  const [active, setActive] = useState<string>(defaultActive);

  const handleClick = (label: string) => {
    setActive(label);
    onSelect?.(label); // beri tahu komponen induk (kalau ada)
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
                  onClick={() => handleClick(item.label)}
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
          🐍
        </div>
        <h3>Mau belajar Python?</h3>
        <p>Jadi mudah dengan CodeLingo!</p>
        <button type="button" className="sidebar__promo-btn">
          Coba Python
        </button>
      </div>
    </aside>
  );
}