// frontend/src/pages/LearnPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import LessonPath, { type PathNode, type PathUnit } from "../components/LessonPath";
import StatsBar, { type Stats } from "../components/StatsBar";
import { getLearningPath } from "../services/pathService";
import { getMyStatsDTO, toBarStats } from "../services/statsService";
import { getMyRank } from "../services/leaderboardService";
import type { LearningPath, LessonStatus } from "../types/path";
import Maskot2 from "../assets/maskot2.png";
import "./LearnPage.css";

const NODE_STATUS: Record<LessonStatus, PathNode["status"]> = {
  completed: "done",
  current: "current",
  locked: "locked",
};

// Jalur belajar dari backend (tabel learning_paths + lessons + progress).
// Status tiap pelajaran dihitung backend; frontend hanya menampilkannya.
function toUnits(data: LearningPath): PathUnit[] {
  if (!data.path || data.lessons.length === 0) return [];
  return [
    {
      id: `path-${data.path.id}`,
      section: `Jalur ${data.language.name}`,
      title: data.path.name,
      color: "green",
      nodes: data.lessons.map((l) => ({
        id: String(l.id),
        type: "lesson" as const,
        status: NODE_STATUS[l.status],
        title: l.title,
        mascot: false,
      })),
    },
  ];
}

function errorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) return "Tidak dapat terhubung ke server. Coba lagi nanti.";
    return err.response.data?.error ?? "Gagal memuat jalur belajar.";
  }
  return "Terjadi kesalahan yang tidak diketahui.";
}

function ShieldBadge() {
  return (
    <svg viewBox="0 0 48 56" className="board__badge" aria-hidden="true">
      <path d="M6 6a2 2 0 0 1 2-2h32a2 2 0 0 1 2 2v22c0 12-9 20-18 24C15 48 6 40 6 28z" fill="#c7d3de" />
      <path d="M11 9h26v19c0 8-6 14-13 17-7-3-13-9-13-17z" fill="#dfe8f0" />
    </svg>
  );
}

const stateStyle = { padding: 24, textAlign: "center" as const };

export default function LearnPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<LearningPath | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [rank, setRank] = useState<number | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    getLearningPath()
      .then((d) => {
        if (cancelled) return;
        setData(d);
        setError("");
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    // Statistik dan peringkat hanya pelengkap: kalau gagal, kartunya disembunyikan.
    getMyStatsDTO()
      .then((d) => {
        if (!cancelled) setStats(toBarStats(d));
      })
      .catch(() => {
        /* abaikan */
      });
    getMyRank()
      .then((r) => {
        if (!cancelled) setRank(r);
      })
      .catch(() => {
        /* abaikan */
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const handleSelectNode = (node: PathNode) => {
    if (node.status === "locked") return; // node terkunci tidak bisa dibuka
    if (node.type !== "lesson") return;
    navigate(`/belajar/pelajaran/${node.id}`);
  };

  const retry = () => {
    setLoading(true);
    setReloadKey((k) => k + 1);
  };

  const units = data ? toUnits(data) : [];

  return (
    <div className="learn-page">
      <div className="learn-page__main">
        {loading && <p style={stateStyle}>Memuat jalur belajar...</p>}

        {!loading && error && (
          <div style={stateStyle}>
            <p role="alert">{error}</p>
            <button type="button" className="btn btn--outline" onClick={retry}>
              Coba lagi
            </button>
          </div>
        )}

        {!loading && !error && data && !data.language.is_available && (
          <p style={stateStyle}>Materi bahasa {data.language.name} segera hadir.</p>
        )}

        {!loading && !error && data?.language.is_available && units.length === 0 && (
          <p style={stateStyle}>Belum ada pelajaran di jalur ini.</p>
        )}

        {units.length > 0 && <LessonPath units={units} onSelectNode={handleSelectNode} />}
      </div>

      {/* Panel kanan: statistik + 2 kartu (Plus dan Papan Skor) */}
      <aside className="learn-page__side">
        {stats && <StatsBar stats={stats} />}

        <section className="card plus">
          <div className="plus__text">
            <span className="plus__tag">PLUS</span>
            <h3>Coba Plus gratis</h3>
            <p>Bebas iklan, latihan yang dipersonalisasi, dan hati tak terbatas!</p>
          </div>
          <img src={Maskot2} alt="" className="plus__img" />
          <button type="button" className="btn btn--blue">
            Coba 1 minggu gratis
          </button>
        </section>

        {rank !== null && (
          <section className="card board">
            <p className="card__eyebrow">Papan skor</p>
            <div className="board__row">
              <div>
                <h3>Peringkat #{rank}</h3>
                <p>Kumpulkan XP dari pelajaran untuk naik peringkat.</p>
              </div>
              <ShieldBadge />
            </div>
            <button type="button" className="btn btn--outline" onClick={() => navigate("/papan-skor")}>
              Ke papan skor
            </button>
          </section>
        )}
      </aside>
    </div>
  );
}
