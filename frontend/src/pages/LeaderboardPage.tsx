// frontend/src/pages/LeaderboardPage.tsx
import { Fragment, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StatsBar from "../components/StatsBar";
import { LeagueShield } from "../components/ProfileIcons";
import { getLeaderboard } from "../services/leaderboardService";
import type { LeaderboardEntry } from "../types/leaderboard";
import { useMyStats } from "../hooks/useMyStats";
import "./pageShell.css";
import "./LeaderboardPage.css";

// Pilihan emoji untuk status
const EMOJIS = ["😎", "🎉", "💪", "👀", "🍿", "💻", "🤓", "💯", "🏆", "🔥", "🚀", "🐛"];
const AVATAR_COLORS = ["#ffa826", "#ff4b4b", "#ce82ff", "#1cb0f6", "#58cc02", "#ff86d0"];
const PROMOTION_SLOTS = 12; // 12 teratas maju ke liga berikutnya


export default function LeaderboardPage() {
  const navigate = useNavigate();
  const myStats = useMyStats();
  const [status, setStatus] = useState<string | null>(null);
  const [rows, setRows] = useState<LeaderboardEntry[]>([]);
  const [me, setMe] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLeaderboard = useCallback(() => {
    setLoading(true);
    setError("");
    getLeaderboard(100)
      .then((data) => {
        setRows(data.entries ?? []);
        setMe(data.me ?? null);
      })
      .catch(() => setError("Papan skor gagal dimuat. Periksa koneksi lalu coba lagi."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const visibleRows = rows.some((r) => r.is_me) || !me || me.rank <= rows.length
    ? rows
    : [...rows, me];

  return (
    <div className="shell">
      <div className="shell__main lb">
        {/* Perisai liga: tiga terbuka, tiga terkunci */}
        <div className="lb__leagues" aria-hidden="true">
          <LeagueShield tone="bronze" />
          <LeagueShield tone="silver" />
          <span className="lb__active">
            <LeagueShield tone="gold" />
          </span>
          <LeagueShield tone="locked" />
          <LeagueShield tone="locked" />
          <LeagueShield tone="locked" />
        </div>
        <h1 className="lb__title">Liga Emas</h1>
        <p className="lb__sub">{PROMOTION_SLOTS} teratas akan maju ke liga berikutnya</p>
        <p className="lb__days">4 hari</p>

        {loading ? (
          <p role="status">Memuat papan skor...</p>
        ) : error ? (
          <div role="alert">
            <p>{error}</p>
            <button type="button" onClick={loadLeaderboard}>Coba lagi</button>
          </div>
        ) : visibleRows.length === 0 ? (
          <p>Belum ada pengguna di papan skor.</p>
        ) : (
        <ol className="lb__list">
          {visibleRows.map((r) => {
            const rank = r.rank;
            const isMe = r.is_me;
            return (
              <Fragment key={r.username}>
                <li>
                  <button
                    type="button"
                    className={`lb__row${isMe ? " lb__row--me" : ""}`}
                    onClick={() => navigate(`/pengguna/${r.username}`)}
                  >
                    <span className={`lb__rank ${rank <= PROMOTION_SLOTS ? "lb__rank--up" : "lb__rank--down"}`}>
                      {rank <= 3 ? <span className={`lb__medal lb__medal--${rank}`}>{rank}</span> : rank}
                    </span>
                    <span className="lb__avatar" style={{ background: AVATAR_COLORS[r.name.length % AVATAR_COLORS.length] }}>
                      {r.name.charAt(0).toUpperCase()}
                      {isMe && status && <span className="lb__bubble">{status}</span>}
                    </span>
                    <span className="lb__name">{r.name}</span>
                    <span className="lb__xp">{r.xp} XP</span>
                  </button>
                </li>

                {/* Garis pemisah zona setelah peringkat ke-12 */}
                {rank === PROMOTION_SLOTS && (
                  <>
                    <li className="lb__zone lb__zone--up">▲ Zona kenaikan ▲</li>
                    <li className="lb__zone lb__zone--down">▼ Zona penurunan ▼</li>
                  </>
                )}
              </Fragment>
            );
          })}
        </ol>
        )}
      </div>

      <aside className="shell__side">
        {myStats && <StatsBar stats={myStats} />}

        <section className="panel status">
          <h3>Pasang statusmu</h3>

          <div className="status__me">
            {me ? me.name.charAt(0).toUpperCase() : "?"}
            {/* key ikut berubah supaya animasi muncul tiap status berganti */}
            <span key={status ?? "kosong"} className={`status__bubble${status ? "" : " status__bubble--empty"}`}>
              {status ?? "🙂"}
            </span>
          </div>

          <div className="status__grid">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className="status__emoji"
                aria-pressed={status === emoji}
                aria-label={`Pasang status ${emoji}`}
                onClick={() => setStatus(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>

          <button type="button" className="status__clear" disabled={!status} onClick={() => setStatus(null)}>
            Hapus
          </button>
        </section>
      </aside>
    </div>
  );
}