// frontend/src/pages/QuestPage.tsx
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import StatsBar from "../components/StatsBar";
import { BoltIcon } from "../components/ProfileIcons";
import { ClockIcon, CodeTileBlueIcon, CoinIcon, QuestChestIcon } from "../components/ShopIcons";
import logo from "../assets/logo.png";
import { useMyStats } from "../hooks/useMyStats";
import { apiErrorMessage } from "../services/errors";
import { claimQuest, getQuests } from "../services/questService";
import type { QuestResponse } from "../types/quest";
import "./pageShell.css";
import "./QuestPage.css";

// Ikon hanya tampilan; judul, progres, dan hadiah semuanya dari backend.
const ICONS: Record<string, ReactNode> = {
  daily_lesson: <CodeTileBlueIcon />,
  daily_xp_20: <BoltIcon />,
  daily_xp_50: <BoltIcon />,
};

function hoursUntil(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(1, Math.ceil(ms / 3_600_000));
}

export default function QuestPage() {
  const navigate = useNavigate();
  const baseStats = useMyStats();
  const [data, setData] = useState<QuestResponse | null>(null);
  const [error, setError] = useState("");
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getQuests()
      .then((d) => !cancelled && setData(d))
      .catch((e) => !cancelled && setError(apiErrorMessage(e, "Gagal memuat misi.")));
    return () => {
      cancelled = true;
    };
  }, []);

  const barStats = useMemo(
    () => (baseStats && data ? { ...baseStats, gems: data.gems } : baseStats),
    [baseStats, data],
  );

  const claim = async (id: string) => {
    if (claiming) return;
    setClaiming(id);
    setError("");
    try {
      setData(await claimQuest(id));
    } catch (e) {
      setError(apiErrorMessage(e, "Hadiah gagal diklaim."));
      getQuests().then(setData).catch(() => {});
    } finally {
      setClaiming(null);
    }
  };

  const quests = data?.quests ?? [];
  const done = quests.filter((q) => q.completed).length;

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
          {data && (
            <span className="quests__timer">
              <ClockIcon /> {hoursUntil(data.resets_at)} jam
            </span>
          )}
        </div>

        {error && <p role="alert">{error}</p>}
        {!data && !error && <p>Memuat…</p>}

        <section className="panel quests__list">
          {quests.map((q) => {
            const pct = Math.min(100, (q.progress / q.target) * 100);
            const canClaim = q.completed && !q.claimed;
            return (
              <article key={q.id} className="quest">
                <span className="quest__icon">{ICONS[q.id] ?? <BoltIcon />}</span>
                <div className="quest__body">
                  <h3>{q.title}</h3>
                  <div className="quest__row">
                    <div className="quest__bar" role="progressbar" aria-valuemin={0} aria-valuemax={q.target} aria-valuenow={q.progress}>
                      <span className="quest__fill" style={{ width: `${pct}%` }} />
                      <span className="quest__label">
                        {q.progress} / {q.target}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="quest__chest"
                      style={{
                        background: "none",
                        border: 0,
                        padding: 0,
                        cursor: canClaim ? "pointer" : "default",
                        opacity: q.claimed || !q.completed ? 0.45 : 1,
                      }}
                      disabled={!canClaim || claiming !== null}
                      onClick={() => claim(q.id)}
                      aria-label={
                        q.claimed
                          ? "Hadiah sudah diklaim"
                          : canClaim
                            ? `Klaim ${q.reward_gems} permata`
                            : "Selesaikan misi untuk membuka hadiah"
                      }
                      title={q.claimed ? "Sudah diklaim" : `Hadiah: ${q.reward_gems} permata`}
                    >
                      <QuestChestIcon />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </div>

      <aside className="shell__side">
        {barStats && <StatsBar stats={barStats} />}

        <section className="panel monthly">
          <span className="monthly__coin" aria-hidden="true">
            <CoinIcon />
          </span>
          <h3>Tantangan bulanan akan segera terbuka!</h3>
          <p>Selesaikan tantangan setiap bulan untuk mendapatkan lencana eksklusif</p>
          <button type="button" className="monthly__btn" onClick={() => navigate("/belajar")}>
            Mulai pelajaran
          </button>
        </section>
      </aside>
    </div>
  );
}
