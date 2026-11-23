// frontend/src/pages/QuestsPage.tsx
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import StatsBar from "../components/StatsBar";
import { BoltIcon } from "../components/ProfileIcons";
import { ClockIcon, CodeTileBlueIcon, CoinIcon, QuestChestIcon, TargetIcon } from "../components/ShopIcons";
import logo from "../assets/logo.png";
import { myStats } from "../data/mockData";
import "./pageShell.css";
import "./QuestsPage.css";

type Quest = { id: string; title: string; icon: ReactNode; current: number; target: number };

// DATA SEMENTARA. Progres misi, reset harian, dan hadiah harus dihitung backend.
const quests: Quest[] = [
  { id: "xp", title: "Dapatkan 10 XP", icon: <BoltIcon />, current: 0, target: 10 },
  { id: "skor", title: "Raih skor 90% atau lebih dalam 1 pelajaran", icon: <TargetIcon />, current: 0, target: 1 },
  { id: "latihan", title: "Selesaikan 7 latihan kode", icon: <CodeTileBlueIcon />, current: 0, target: 7 },
];

export default function QuestsPage() {
  const navigate = useNavigate();

  const done = quests.filter((q) => q.current >= q.target).length;
  // Perkiraan sisa waktu sampai tengah malam (tampilan saja)
  const hoursLeft = Math.max(1, 24 - new Date().getHours());

  return (
    <div className="shell">
      <div className="shell__main quests">
        {/* Banner utama */}
        <section className="quests__banner">
          <div className="quests__banner-text">
            <h1>Taklukkan misi, dapat hadiah!</h1>
            <p>
              Kamu telah menaklukkan <b>{done} dari {quests.length}</b> misi hari ini.
            </p>
          </div>
          <span className="quests__arch" aria-hidden="true" />
          <img src={logo} alt="" className="quests__logo" />
        </section>

        <div className="quests__head">
          <h2>Misi Harian</h2>
          <span className="quests__timer">
            <ClockIcon /> {hoursLeft} jam
          </span>
        </div>

        <section className="panel quests__list">
          {quests.map((q) => {
            const pct = Math.min(100, (q.current / q.target) * 100);
            return (
              <article key={q.id} className="quest">
                <span className="quest__icon">{q.icon}</span>
                <div className="quest__body">
                  <h3>{q.title}</h3>
                  <div className="quest__row">
                    <div className="quest__bar" role="progressbar" aria-valuemin={0} aria-valuemax={q.target} aria-valuenow={q.current}>
                      <span className="quest__fill" style={{ width: `${pct}%` }} />
                      <span className="quest__label">
                        {q.current} / {q.target}
                      </span>
                    </div>
                    <span className="quest__chest">
                      <QuestChestIcon />
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </div>

      <aside className="shell__side">
        <StatsBar stats={myStats} />

        <section className="panel monthly">
          <span className="monthly__coin" aria-hidden="true">
            <CoinIcon />
          </span>
          <h3>Tantangan bulanan akan segera terbuka!</h3>
          <p>Selesaikan tantangan setiap bulan untuk mendapatkan lencana eksklusif</p>
          {/* Membuka halaman pelajaran (soal belum dibuat) */}
          <button type="button" className="monthly__btn" onClick={() => navigate("/pelajaran/mulai")}>
            Mulai pelajaran
          </button>
        </section>
      </aside>
    </div>
  );
}