// frontend/src/pages/LeaderboardPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StatsBar from "../components/StatsBar";
import { getLeaderboard, setMyStatus } from "../services/leaderboardService";
import { useMyStats } from "../hooks/useMyStats";
import type { LeaderboardEntry, LeaderboardResponse } from "../types/leaderboard";
import "./pageShell.css";
import "./LeaderboardPage.css";

// Harus sama dengan daftar putih di backend (internal/leaderboard/status.go).
const EMOJIS = ["😎", "🎉", "💪", "👀", "🍿", "💻", "🤓", "💯", "🏆", "🔥", "🚀", "🐛"];
const AVATAR_COLORS = ["#ffa826", "#ff4b4b", "#ce82ff", "#1cb0f6", "#58cc02", "#ff86d0"];
const LIMIT = 20;

function Row({ entry, onOpenMe }: { entry: LeaderboardEntry; onOpenMe: () => void }) {
  const cls = `lb__row${entry.is_me ? " lb__row--me" : ""}`;
  const body = (
    <>
      <span className="lb__rank">
        {entry.rank <= 3 ? <span className={`lb__medal lb__medal--${entry.rank}`}>{entry.rank}</span> : entry.rank}
      </span>
      <span className="lb__avatar" style={{ background: AVATAR_COLORS[entry.name.length % AVATAR_COLORS.length] }}>
        {entry.name.charAt(0).toUpperCase()}
        {entry.status && <span className="lb__bubble">{entry.status}</span>}
      </span>
      <span className="lb__name">{entry.name}</span>
      <span className="lb__xp">{entry.weekly_xp} XP</span>
    </>
  );
  // Hanya baris sendiri yang bisa dibuka: belum ada endpoint profil publik.
  return entry.is_me ? (
    <button type="button" className={cls} onClick={onOpenMe}>
      {body}
    </button>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const myStats = useMyStats();
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getLeaderboard(LIMIT)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setError("Gagal memuat papan skor. Coba muat ulang halaman.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const me = data?.me ?? null;
  const status = me?.status || null;
  const meInList = !!me && !!data?.entries.some((e) => e.is_me);

  // Terapkan status baru ke state lokal (baris sendiri + kartu status).
  const applyStatus = (value: string) =>
    setData((d) =>
      d
        ? {
            ...d,
            me: d.me ? { ...d.me, status: value } : d.me,
            entries: d.entries.map((e) => (e.is_me ? { ...e, status: value } : e)),
          }
        : d,
    );

  const changeStatus = async (next: string) => {
    if (saving || !me) return;
    const prev = me.status;
    setSaving(true);
    setError("");
    applyStatus(next); // tampilkan dulu, batalkan bila server menolak
    try {
      applyStatus(await setMyStatus(next));
    } catch {
      applyStatus(prev);
      setError("Status gagal disimpan. Coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="shell">
      <div className="shell__main lb">
        <h1 className="lb__title">Papan Skor</h1>
        <p className="lb__sub">Peringkat berdasarkan XP yang kamu kumpulkan minggu ini</p>
        {data && <p className="lb__days">{data.week.days_left} hari lagi</p>}
        {error && (
          <p className="lb__sub" role="alert">
            {error}
          </p>
        )}
        {!data && !error && <p className="lb__sub">Memuat…</p>}

        {data && (
          <ol className="lb__list">
            {data.entries.map((e) => (
              <li key={e.username}>
                <Row entry={e} onOpenMe={() => navigate("/profile")} />
              </li>
            ))}
            {/* Peringkat kamu di luar daftar teratas */}
            {me && !meInList && (
              <>
                <li className="lb__zone">• • •</li>
                <li>
                  <Row entry={me} onOpenMe={() => navigate("/profile")} />
                </li>
              </>
            )}
          </ol>
        )}
      </div>

      <aside className="shell__side">
        {myStats && <StatsBar stats={myStats} />}

        {me && (
          <section className="panel status">
            <h3>Pasang statusmu</h3>

            <div className="status__me">
              {me.name.charAt(0).toUpperCase()}
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
                  disabled={saving}
                  onClick={() => changeStatus(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>

            <button type="button" className="status__clear" disabled={!status || saving} onClick={() => changeStatus("")}>
              Hapus
            </button>
          </section>
        )}
      </aside>
    </div>
  );
}
