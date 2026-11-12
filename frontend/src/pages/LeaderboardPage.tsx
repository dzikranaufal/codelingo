// frontend/src/pages/LeaderboardPage.tsx
import { Fragment, useState } from "react";
import { useNavigate } from "react-router-dom";
import StatsBar from "../components/StatsBar";
import { LeagueShield } from "../components/ProfileIcons";
import { ME_USERNAME, leaderboard, myStats } from "../data/mockData";
import "./pageShell.css";
import "./LeaderboardPage.css";

// Pilihan emoji untuk status
const EMOJIS = ["😎", "🎉", "💪", "👀", "🍿", "💻", "🤓", "💯", "🏆", "🔥", "🚀", "🐛"];
const AVATAR_COLORS = ["#ffa826", "#ff4b4b", "#ce82ff", "#1cb0f6", "#58cc02", "#ff86d0"];
const PROMOTION_SLOTS = 12; // 12 teratas maju ke liga berikutnya

const rows = [...leaderboard].sort((a, b) => b.xp - a.xp);

export default function LeaderboardPage() {
  const navigate = useNavigate();
  // Status emoji milik pengguna. null = kosong.
  // SEMENTARA: belum disimpan ke backend, jadi hilang saat halaman dimuat ulang.
  const [status, setStatus] = useState<string | null>(null);

  const me = rows.find((r) => r.username === ME_USERNAME);

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

        <ol className="lb__list">
          {rows.map((r, i) => {
            const rank = i + 1;
            const isMe = r.username === ME_USERNAME;
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
      </div>

      <aside className="shell__side">
        <StatsBar stats={myStats} />

        <section className="panel status">
          <h3>Pasang statusmu</h3>

          <div className="status__me">
            {me ? me.name.charAt(0).toUpperCase() : "A"}
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