// frontend/src/pages/CharacterPage.tsx
// Halaman "Karakter": rangkuman mini kode C yang sering muncul, sebagai dasar sebelum latihan utama.
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import StatsBar from "../components/StatsBar";
import Modal from "../components/Modal";
import { C_CATEGORIES, C_ENTRIES, type CCategory, type CEntry } from "../data/cSyntax";
import { useMyStats } from "../hooks/useMyStats";
import "./pageShell.css";
import "./CharacterPage.css";

// true = tampilkan label "Tambahan" pada kartu yang ditambahkan asisten (added: true)
const SHOW_ADDED_TAG = true;

/* ---------- Isi pop-up satu rangkuman ---------- */
type DetailProps = {
  entry: CEntry;
  position: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
};

function EntryDetail({ entry, position, total, onPrev, onNext }: DetailProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(entry.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="kr-detail">
      <div className="kr-detail__top">
        <code className="kr-symbol kr-symbol--lg">{entry.symbol}</code>
        {SHOW_ADDED_TAG && entry.added && <span className="kr-tag">Tambahan</span>}
      </div>
      <h2 className="kr-detail__name">{entry.name}</h2>

      <p className="kr-detail__label">Artinya</p>
      <p className="kr-detail__meaning">{entry.meaning}</p>

      <div className="kr-detail__labelrow">
        <span>Contoh kode</span>
        <button type="button" className="kr-detail__copy" onClick={copy}>
          {copied ? "Tersalin!" : "Salin kode"}
        </button>
      </div>
      <pre className="kr-code">
        <code>{entry.code}</code>
      </pre>

      <p className="kr-detail__label">Hasilnya</p>
      <pre className="kr-out">{entry.output}</pre>
      {entry.outputNote && <p className="kr-detail__note">{entry.outputNote}</p>}
      {entry.tip && <p className="kr-detail__tip">💡 {entry.tip}</p>}

      <div className="kr-detail__nav">
        <button type="button" onClick={onPrev} disabled={total < 2}>
          ← Sebelumnya
        </button>
        <span>
          {position} / {total}
        </span>
        <button type="button" onClick={onNext} disabled={total < 2}>
          Berikutnya →
        </button>
      </div>
    </div>
  );
}

/* ---------- Halaman ---------- */
export default function CharacterPage() {
  const navigate = useNavigate();
  const myStats = useMyStats();
  const [cat, setCat] = useState<CCategory | "semua">("semua");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return C_ENTRIES.filter((e) => {
      const inCat = cat === "semua" || e.category === cat;
      const inText = !q || `${e.symbol} ${e.name} ${e.meaning}`.toLowerCase().includes(q);
      return inCat && inText;
    });
  }, [cat, query]);

  const openIndex = list.findIndex((e) => e.id === openId);
  const open = openIndex >= 0 ? list[openIndex] : null;

  const go = (step: number) => {
    if (openIndex < 0 || list.length === 0) return;
    setOpenId(list[(openIndex + step + list.length) % list.length].id);
  };

  return (
    <div className="shell">
      <div className="shell__main kr">
        <h1 className="kr__title">Karakter</h1>
        <p className="kr__sub">
          Rangkuman mini kode-kode bahasa C yang sering muncul. Baca dulu sebagai dasar sebelum masuk ke latihan utama.
        </p>

        <input
          type="search"
          className="kr__search"
          placeholder="Cari kode, misalnya printf atau int"
          aria-label="Cari kode"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="kr__filters" role="group" aria-label="Kategori">
          {C_CATEGORIES.map((c) => {
            const count = c.id === "semua" ? C_ENTRIES.length : C_ENTRIES.filter((e) => e.category === c.id).length;
            return (
              <button
                key={c.id}
                type="button"
                className="kr-filter"
                aria-pressed={cat === c.id}
                onClick={() => setCat(c.id)}
              >
                {c.label} <span>{count}</span>
              </button>
            );
          })}
        </div>

        {list.length === 0 ? (
          <p className="kr__empty">Tidak ada kode yang cocok. Coba kata kunci atau kategori lain.</p>
        ) : (
          <div className="kr__grid">
            {list.map((e) => (
              <button key={e.id} type="button" className="kr-card" onClick={() => setOpenId(e.id)}>
                <code className="kr-symbol">{e.symbol}</code>
                <b className="kr-card__name">{e.name}</b>
                <span className="kr-card__meaning">{e.meaning}</span>
                {SHOW_ADDED_TAG && e.added && <span className="kr-tag">Tambahan</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      <aside className="shell__side">
        {myStats && <StatsBar stats={myStats} />}

        <section className="panel kr-ready">
          <h3>Siap berlatih?</h3>
          <p>Sudah baca rangkumannya? Lanjutkan ke latihan utama di jalur belajar.</p>
          <button type="button" className="kr-ready__btn" onClick={() => navigate("/belajar")}>
            Ke jalur belajar
          </button>
        </section>
      </aside>

      {open && (
        <Modal onClose={() => setOpenId(null)}>
          <EntryDetail
            key={open.id}
            entry={open}
            position={openIndex + 1}
            total={list.length}
            onPrev={() => go(-1)}
            onNext={() => go(1)}
          />
        </Modal>
      )}
    </div>
  );
}