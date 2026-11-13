// frontend/src/pages/LearnPage.tsx
import { useNavigate } from "react-router-dom";
import LessonPath, { type PathNode, type PathUnit } from "../components/LessonPath";
import StatsBar, { type Stats } from "../components/StatsBar";
import Maskot2 from "../assets/maskot2.png";
import "./LearnPage.css";

// DATA SEMENTARA (contoh). Nanti diganti data dari backend (Tahap 5 dan 6).
// Status pelajaran, hati, permata, runtunan harus ditentukan backend, bukan frontend.
//
// PENTING: id node bertipe "lesson" harus sama dengan id lesson di database.
// Ganti "1", "2", "3" di bawah dengan id lesson asli dari tabel lesson (phpMyAdmin).
const units: PathUnit[] = [
  {
    id: "unit-1",
    section: "Bagian 1, Unit 1",
    title: "Halo, Dunia!",
    color: "green",
    nodes: [
      { id: "1", type: "lesson", status: "current" },
      { id: "2", type: "lesson", status: "done" },
      { id: "1-3", type: "chest", status: "done", mascot: true },
      { id: "3", type: "lesson", status: "done" },
      { id: "1-5", type: "trophy", status: "locked" },
    ],
  },
  {
    id: "unit-2",
    section: "Bagian 1, Unit 2",
    title: "Variabel dan tipe data",
    color: "blue",
    nodes: [
      { id: "2-1", type: "lesson", status: "locked" },
      { id: "2-2", type: "lesson", status: "locked" },
      { id: "2-3", type: "lesson", status: "locked" },
      { id: "2-4", type: "chest", status: "locked" },
      { id: "2-5", type: "lesson", status: "locked" },
      { id: "2-6", type: "trophy", status: "locked" },
    ],
  },
  {
    id: "unit-3",
    section: "Bagian 1, Unit 3",
    title: "Percabangan if-else",
    color: "purple",
    nodes: [
      { id: "3-1", type: "lesson", status: "locked" },
      { id: "3-2", type: "lesson", status: "locked" },
      { id: "3-3", type: "lesson", status: "locked" },
      { id: "3-4", type: "lesson", status: "locked" },
      { id: "3-5", type: "trophy", status: "locked" },
    ],
  },
];

// DATA SEMENTARA untuk bar atas
const stats: Stats = {
  courseId: "c", // bahasa yang sedang dipelajari
  streak: 0,
  gems: 500,
  hearts: 4,
  maxHearts: 5,
  nextHeartIn: "4 jam",
};

// DATA SEMENTARA untuk kartu papan skor
const leaderboard = { rank: 11, league: "Perak" };

function ShieldBadge() {
  return (
    <svg viewBox="0 0 48 56" className="board__badge" aria-hidden="true">
      <path d="M6 6a2 2 0 0 1 2-2h32a2 2 0 0 1 2 2v22c0 12-9 20-18 24C15 48 6 40 6 28z" fill="#c7d3de" />
      <path d="M11 9h26v19c0 8-6 14-13 17-7-3-13-9-13-17z" fill="#dfe8f0" />
    </svg>
  );
}

export default function LearnPage() {
  const navigate = useNavigate();

  const handleSelectNode = (node: PathNode) => {
    if (node.status === "locked") return; // node terkunci tidak bisa dibuka
    if (node.type !== "lesson") return; // peti dan ujian belum punya sesi
    navigate(`/belajar/pelajaran/${node.id}`);
  };

  return (
    <div className="learn-page">
      <div className="learn-page__main">
        <LessonPath units={units} onSelectNode={handleSelectNode} />
      </div>

      {/* Panel kanan: statistik + 2 kartu (Plus dan Papan Skor) */}
      <aside className="learn-page__side">
        <StatsBar stats={stats} />

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

        <section className="card board">
          <p className="card__eyebrow">Papan skor</p>
          <div className="board__row">
            <div>
              <h3>Selamat!</h3>
              <p>
                Kamu meraih peringkat #{leaderboard.rank} dan maju ke Liga {leaderboard.league}
              </p>
            </div>
            <ShieldBadge />
          </div>
          <button type="button" className="btn btn--outline">
            Ke papan skor
          </button>
        </section>
      </aside>
    </div>
  );
}