// frontend/src/components/StatsBar.tsx
import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router-dom";
import { languages } from "./LanguageIcons";
import "./StatsBar.css";

export type Stats = {
  courseId: string; // id bahasa yang sedang dipelajari (lihat LanguageIcons.tsx)
  streak: number; // jumlah hari beruntun
  gems: number; // jumlah permata
  hearts: number; // sisa hati
  maxHearts: number; // hati maksimal
  nextHeartIn?: string; // contoh "4 jam" (dari backend)
};

// Urutan hari sesuai Date.getDay(): Minggu, Senin, Selasa, Rabu, Kamis, Jumat, Sabtu
const WEEK = ["M", "S", "S", "R", "K", "J", "S"];
const REFILL_COST = 350;

/* ---------- Ikon ---------- */
function FlameIcon({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 28" aria-hidden="true">
      <path d="M12 2c1 5 8 8 8 15a8 8 0 0 1-16 0c0-3 1.500-5 3-6.500C7 14 9 15 10 14c0-4 0-8 2-12z" fill={on ? "#ff9600" : "#c4c4c4"} />
      <path d="M12 14c3 2.500 4.500 4 4.500 6.500a4.500 4.500 0 0 1-9 0c0-2 1.500-3.500 4.500-6.500z" fill={on ? "#ffc800" : "#dedede"} />
    </svg>
  );
}
function GemIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <polygon points="12,2 21,7.500 21,16.500 12,22 3,16.500 3,7.500" fill="#1cb0f6" />
      <polygon points="12,2 21,7.500 12,12 3,7.500" fill="#84d8ff" />
    </svg>
  );
}
function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 21.500C5 16 2.500 12.500 2.500 8.800A5 5 0 0 1 12 6.400a5 5 0 0 1 9.500 2.400c0 3.700-2.500 7.200-9.500 12.700z" fill={filled ? "#ff4b4b" : "#ffd9d9"} />
      {filled && <ellipse cx="7.500" cy="9" rx="2" ry="1.300" fill="#fff" opacity="0.6" transform="rotate(-30 7.500 9)" />}
    </svg>
  );
}
function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="10" width="16" height="12" rx="3" fill="#8e9aa3" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="#8e9aa3" strokeWidth="3" />
      <circle cx="12" cy="16" r="1.800" fill="#fff" />
    </svg>
  );
}

/* ---------- Satu ikon + popover-nya ---------- */
// cx = posisi panah popover (persen dari lebar bar), supaya menunjuk ke ikon yang benar
function Stat({
  label,
  cx,
  trigger,
  children,
}: {
  label: string;
  cx: string;
  trigger: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="stat" style={{ "--cx": cx } as CSSProperties}>
      <button type="button" className="stat__btn" aria-label={label}>
        {trigger}
      </button>
      <div className="pop">
        <div className="pop__box">{children}</div>
      </div>
    </div>
  );
}

export default function StatsBar({ stats }: { stats: Stats }) {
  const course = languages.find((l) => l.id === stats.courseId) ?? languages[0];
  const today = new Date().getDay();
  const hasStreak = stats.streak > 0;
  const heartsFull = stats.hearts >= stats.maxHearts;

  return (
    <div className="stats">
      {/* 1. Bahasa yang sedang dipelajari */}
      <Stat
        label="Kursusku"
        cx="12.5%"
        trigger={
          <span className="stat__lang">
            <course.Icon />
          </span>
        }
      >
        <p className="pop__label">Kursusku</p>
        <div className="pop__row pop__row--active">
          <span className="pop__lang">
            <course.Icon />
          </span>
          <b>{course.name}</b>
        </div>
        <Link to="/kursus" className="pop__row">
          <span className="pop__lang pop__lang--add">+</span>
          <b>Tambahkan kursus baru</b>
        </Link>
      </Stat>

      {/* 2. Runtunan hari (streak) */}
      <Stat
        label="Runtunan hari"
        cx="37.5%"
        trigger={
          <>
            <FlameIcon on={hasStreak} />
            <span className={`stat__num ${hasStreak ? "stat__num--hot" : "stat__num--muted"}`}>{stats.streak}</span>
          </>
        }
      >
        <div className="pop__head">
          <div>
            <h3 className={`pop__title${hasStreak ? "" : " pop__title--muted"}`}>{stats.streak} hari beruntun</h3>
            <p className="pop__text">
              {hasStreak
                ? "Pertahankan runtunanmu dengan belajar setiap hari!"
                : "Selesaikan satu pelajaran hari ini untuk memulai runtunan baru!"}
            </p>
          </div>
          <div className="pop__flame">
            <FlameIcon on={hasStreak} />
          </div>
        </div>
        <div className="week">
          {WEEK.map((d, i) => (
            <div key={i} className="week__day">
              <span className={`week__label${i === today ? " week__label--today" : ""}`}>{d}</span>
              <span className="week__dot" />
            </div>
          ))}
        </div>
        <div className="pop__card">
          <LockIcon />
          <div>
            <h4>Sultan Runtunan</h4>
            <p>Capai 7 hari beruntun untuk jadi Sultan Runtunan dan dapatkan berbagai hadiah eksklusif.</p>
          </div>
        </div>
        <button type="button" className="pop__btn">
          Lihat selengkapnya
        </button>
      </Stat>

      {/* 3. Permata */}
      <Stat
        label="Permata"
        cx="62.5%"
        trigger={
          <>
            <GemIcon />
            <span className="stat__num stat__num--gem">{stats.gems}</span>
          </>
        }
      >
        <div className="pop__gem">
          <GemIcon />
          <div>
            <h3 className="pop__title">Permata</h3>
            <p className="pop__text">Kamu punya {stats.gems} permata</p>
            <button type="button" className="pop__link">
              Ke toko
            </button>
          </div>
        </div>
      </Stat>

      {/* 4. Hati */}
      <Stat
        label="Hati"
        cx="87.5%"
        trigger={
          <>
            <HeartIcon filled />
            <span className="stat__num stat__num--heart">{stats.hearts}</span>
          </>
        }
      >
        <h3 className="pop__title pop__title--center">Hati</h3>
        <div className="pop__hearts">
          {Array.from({ length: stats.maxHearts }, (_, i) => (
            <HeartIcon key={i} filled={i < stats.hearts} />
          ))}
        </div>
        <p className="pop__sub">
          {heartsFull ? (
            "Hatimu penuh!"
          ) : (
            <>
              Hati berikutnya dalam <span className="pop__red">{stats.nextHeartIn ?? "beberapa jam"}</span>
            </>
          )}
        </p>
        <p className="pop__text pop__text--center">
          {stats.hearts > 0
            ? "Kamu masih punya beberapa hati lagi! Terus belajar"
            : "Hatimu habis. Isi ulang untuk lanjut belajar."}
        </p>
        <button type="button" className="pop__option">
          <HeartIcon filled />
          <span className="pop__option-text">Hati tak terbatas</span>
          <span className="pop__plus">Dapatkan Plus</span>
        </button>
        <button type="button" className="pop__option" disabled={heartsFull}>
          <HeartIcon filled />
          <span className="pop__option-text">Isi ulang hati</span>
          <span className="pop__cost">
            <GemIcon /> {REFILL_COST}
          </span>
        </button>
      </Stat>
    </div>
  );
}