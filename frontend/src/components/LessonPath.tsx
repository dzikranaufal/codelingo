// frontend/src/components/LessonPath.tsx
import { type MouseEvent } from "react";
import logo from "../assets/logo.png";
import "./LessonPath.css";

export type NodeType = "lesson" | "chest" | "trophy";
export type NodeStatus = "done" | "current" | "locked";

export type PathNode = {
  id: string;
  type: NodeType;
  status: NodeStatus;
  mascot?: boolean; // true = logo CodeLingo tampil di samping node ini
};

export type PathUnit = {
  id: string;
  section: string; // contoh: "Bagian 1, Unit 1"
  title: string;
  color: "green" | "blue" | "purple";
  nodes: PathNode[];
};

type LessonPathProps = {
  units: PathUnit[];
  onSelectNode?: (node: PathNode, unit: PathUnit) => void;
};

// Posisi geser kiri-kanan tiap node (px), diulang supaya jalurnya berkelok
const OFFSETS = [0, -48, -72, -48, 0, 48, 72, 48];

const TYPE_LABEL: Record<NodeType, string> = {
  lesson: "Pelajaran",
  chest: "Peti hadiah",
  trophy: "Ujian unit",
};
const STATUS_LABEL: Record<NodeStatus, string> = {
  done: "selesai",
  current: "sedang dikerjakan",
  locked: "terkunci",
};

/* ---------- Ikon (SVG, warna mengikuti currentColor) ---------- */
function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 12.5l4.5 4.5L19 7.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function TrophyIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 4h10v5a5 5 0 0 1-10 0z" fill="currentColor" />
      <path
        d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <rect x="11" y="14" width="2" height="4" fill="currentColor" />
      <rect x="8" y="18" width="8" height="2.5" rx="1" fill="currentColor" />
    </svg>
  );
}
function ChestIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <rect x="4" y="13" width="24" height="14" rx="2.5" fill="#f2a516" stroke="#a8620f" strokeWidth="2" />
      <path
        d="M4 15V12a6 6 0 0 1 6-6h12a6 6 0 0 1 6 6v3z"
        fill="#ffc800"
        stroke="#a8620f"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <rect x="14" y="15" width="4" height="6" rx="1" fill="#7a4a2a" />
    </svg>
  );
}

// Selesai = centang. Belum selesai atau sedang dikerjakan = bintang.
function NodeIcon({ node }: { node: PathNode }) {
  if (node.type === "chest") return <ChestIcon />;
  if (node.type === "trophy") return <TrophyIcon />;
  return node.status === "done" ? <CheckIcon /> : <StarIcon />;
}

export default function LessonPath({ units, onSelectNode }: LessonPathProps) {
  // Efek tekan: kelas "is-pressed" dipasang sesaat, animasi CSS menekan
  // ke bawah lalu memantul balik sendiri, kelas dilepas saat animasi selesai.
  const handleClick = (e: MouseEvent<HTMLButtonElement>, node: PathNode, unit: PathUnit) => {
    const el = e.currentTarget;
    el.classList.remove("is-pressed");
    void el.offsetWidth; // paksa browser memulai ulang animasi kalau diklik berulang
    el.classList.add("is-pressed");
    onSelectNode?.(node, unit);
  };

  return (
    <div className="learn">
      <div className="learn__inner">
        {units.map((unit) => (
          <section key={unit.id} className={`unit unit--${unit.color}`}>
            {/* Banner unit: menempel di atas saat di-scroll */}
            <header className="unit__banner">
              <div>
                <p className="unit__section">{unit.section}</p>
                <h2 className="unit__title">{unit.title}</h2>
              </div>
              <button type="button" className="unit__guide">
                Buku panduan
              </button>
            </header>

            <ol className="path">
              {unit.nodes.map((node, i) => (
                <li
                  key={node.id}
                  className={`path__row${node.status === "current" ? " path__row--current" : ""}`}
                  style={{ transform: `translateX(${OFFSETS[i % OFFSETS.length]}px)` }}
                >
                  {node.status === "current" && <span className="path__bubble">Mulai</span>}

                  <button
                    type="button"
                    className={`path-node path-node--${node.type} path-node--${node.status}`}
                    aria-label={`${TYPE_LABEL[node.type]}, ${STATUS_LABEL[node.status]}`}
                    aria-disabled={node.status === "locked" ? true : undefined}
                    onClick={(e) => handleClick(e, node, unit)}
                    onAnimationEnd={(e) => e.currentTarget.classList.remove("is-pressed")}
                  >
                    <NodeIcon node={node} />
                  </button>

                  {node.mascot && <img src={logo} alt="" className="path__mascot" />}
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}