import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import StatsBar from "../components/StatsBar";
import { BoltIcon } from "../components/ProfileIcons";
import { ClockIcon, CodeTileBlueIcon, CoinIcon, QuestChestIcon, TargetIcon } from "../components/ShopIcons";
import logo from "../assets/logo.png";
import { useMyStats } from "../hooks/useMyStats";
import { getMyMissions } from "../services/missionService";
import type { MissionItem } from "../types/mission";
import "./pageShell.css";
import "./QuestPage.css";

const icons: Record<string, ReactNode> = {
  xp: <BoltIcon />,
  lesson: <TargetIcon />,
  practice: <CodeTileBlueIcon />,
};

export default function QuestsPage() {
  const navigate = useNavigate();
  const myStats = useMyStats();
  const [missions, setMissions] = useState<MissionItem[]>([]);
  const [resetAt, setResetAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  async function loadMissions() {
    try {
      setError(null);
      const data = await getMyMissions();
      setMissions(data.missions);
      setResetAt(data.reset_at);
    } catch {
      setError("Misi belum dapat dimuat. Periksa koneksi lalu coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadMissions(); }, []);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const done = missions.filter((mission) => mission.completed).length;
  const remainingMs = resetAt ? Math.max(0, new Date(resetAt).getTime() - now) : 0;
  const hoursLeft = Math.floor(remainingMs / 3_600_000);
  const minutesLeft = Math.floor((remainingMs % 3_600_000) / 60_000);

  return (
    <div className="shell">
      <div className="shell__main quests">
        <section className="quests__banner">
          <div className="quests__banner-text">
            <h1>Taklukkan misi, dapat hadiah!</h1>
            <p>Kamu telah menaklukkan <b>{done} dari {missions.length}</b> misi hari ini.</p>
          </div>
          <span className="quests__arch" aria-hidden="true" />
          <img src={logo} alt="" className="quests__logo" />
        </section>

        <div className="quests__head">
          <h2>Misi Harian</h2>
          <span className="quests__timer"><ClockIcon /> {resetAt ? `${hoursLeft} jam ${minutesLeft} menit` : "--"}</span>
        </div>

        {loading && <p role="status">Memuat progres misi...</p>}
        {error && <div role="alert"><p>{error}</p><button type="button" onClick={() => { setLoading(true); void loadMissions(); }}>Coba lagi</button></div>}
        {!loading && !error && (
          <>
            <p role="note">Progres dihitung dari aktivitas belajar yang tersimpan di database. Reset harian menggunakan zona waktu UTC.</p>
            <section className="panel quests__list">
              {missions.map((mission) => {
                const pct = Math.min(100, (mission.current / mission.target) * 100);
                return (
                  <article key={mission.id} className="quest">
                    <span className="quest__icon">{icons[mission.id] ?? <TargetIcon />}</span>
                    <div className="quest__body">
                      <h3>{mission.title}</h3>
                      <div className="quest__row">
                        <div className="quest__bar" role="progressbar" aria-valuemin={0} aria-valuemax={mission.target} aria-valuenow={mission.current}>
                          <span className="quest__fill" style={{ width: `${pct}%` }} />
                          <span className="quest__label">{mission.current} / {mission.target}</span>
                        </div>
                        <span className="quest__chest"><QuestChestIcon /></span>
                      </div>
                      {mission.completed && <small>Target tercapai</small>}
                    </div>
                  </article>
                );
              })}
            </section>
          </>
        )}
      </div>

      <aside className="shell__side">
        {myStats && <StatsBar stats={myStats} />}
        <section className="panel monthly">
          <span className="monthly__coin" aria-hidden="true"><CoinIcon /></span>
          <h3>Tantangan bulanan akan segera terbuka!</h3>
          <p>Selesaikan tantangan setiap bulan untuk mendapatkan lencana eksklusif</p>
          <button type="button" className="monthly__btn" onClick={() => navigate("/pelajaran/mulai")}>Mulai pelajaran</button>
        </section>
      </aside>
    </div>
  );
}
