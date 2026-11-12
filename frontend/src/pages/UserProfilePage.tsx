// frontend/src/pages/UserProfilePage.tsx
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import StatsBar from "../components/StatsBar";
import Modal from "../components/Modal";
import AchievementBadge from "../components/AchievementBadge";
import { languages } from "../components/LanguageIcons";
import { BoltIcon, ChevronIcon, FlameIcon, LeagueShield, MedalIcon } from "../components/ProfileIcons";
import { ME_USERNAME, WEEK_DAYS, getProfile, myStats, type Achievement } from "../data/mockData";
import profileImg from "../assets/profile.png";
import followersImg from "../assets/pengikut.png";
import "./pageShell.css";
import "./UserProfilePage.css";

type Series = { label: string; values: number[]; color: string };

// Pilihan alasan laporan. Daftar resmi nanti ditentukan backend.
const REPORT_REASONS = ["Ketelanjangan", "Spam", "Lainnya"];

// SEMENTARA: contoh daftar akun yang diikuti. Data asli datang dari backend.
const FOLLOWING_EXAMPLE: Record<string, { name: string; xp: number }[]> = {
  dimas_w: [{ name: "Bibin Mathew", xp: 8264 }],
};

/* ---------- Grafik XP minggu ini (SVG) ---------- */
function XpChart({ series }: { series: Series[] }) {
  const W = 640, H = 280, L = 44, R = 16, T = 12, B = 32;
  const top = Math.max(...series.flatMap((s) => s.values));
  const max = Math.max(80, Math.ceil(top / 20) * 20);
  const x = (i: number) => L + (i * (W - L - R)) / (WEEK_DAYS.length - 1);
  const y = (v: number) => T + (H - T - B) * (1 - v / max);
  const ticks = Array.from({ length: max / 20 + 1 }, (_, i) => i * 20);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="xp__svg" role="img" aria-label="Grafik XP minggu ini">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="#e5e5e5" strokeWidth="2" />
          <text x={L - 10} y={y(t) + 5} textAnchor="end" fontSize="15" fontWeight="700" fill="#afafaf">
            {t}
          </text>
        </g>
      ))}
      {WEEK_DAYS.map((d, i) => (
        <text key={d + i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="15" fontWeight="700" fill="#afafaf">
          {d}
        </text>
      ))}
      {series.map((s) => (
        <g key={s.label}>
          <polyline
            points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ")}
            fill="none"
            stroke={s.color}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {s.values.map((v, i) => (
            <circle key={i} cx={x(i)} cy={y(v)} r="5" fill={s.color} />
          ))}
        </g>
      ))}
    </svg>
  );
}

/* ---------- Ikon kecil ---------- */
function FlagIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 21V4M5 5h13l-3 4 3 4H5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function PersonPlusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="9" cy="8" r="4" fill="currentColor" />
      <path d="M2 21c0-4 3-7 7-7s7 3 7 7z" fill="currentColor" />
      <path d="M19 7v6M16 10h6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 9l7 7 7-7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function UserProfilePage() {
  const { username = "" } = useParams();
  const profile = getProfile(username);

  const [tab, setTab] = useState<"following" | "followers">("following");
  const [showLangs, setShowLangs] = useState(false);
  const [badge, setBadge] = useState<Achievement | null>(null);

  // Laporan: pop-up, alasan terpilih, dan akun yang baru dilaporkan
  const [showReport, setShowReport] = useState(false);
  const [reason, setReason] = useState("");
  const [reportedFor, setReportedFor] = useState("");

  if (!profile) {
    return (
      <div className="shell">
        <div className="shell__main">
          <h1>Pengguna tidak ditemukan</h1>
          <p>
            Akun <b>{username}</b> tidak ada. <Link to="/papan-skor">Kembali ke papan skor</Link>
          </p>
        </div>
      </div>
    );
  }

  const isMe = profile.username === ME_USERNAME;
  const myWeekly = getProfile(ME_USERNAME)?.weeklyXp ?? [];
  const series: Series[] = [{ label: profile.username, values: profile.weeklyXp, color: "#1cb0f6" }];
  if (!isMe) series.push({ label: "Kamu", values: myWeekly, color: "#afafaf" });

  const followingList = FOLLOWING_EXAMPLE[profile.username] ?? [];
  const shownLangs = profile.languages.slice(0, 3);
  const extraLangs = profile.languages.length - shownLangs.length;

  const closeReport = () => {
    setShowReport(false);
    setReason("");
  };

  const submitReport = () => {
    if (!reason) return;
    // TODO: kirim ke backend setelah endpoint laporan tersedia (alasan divalidasi di backend).
    setReportedFor(profile.username);
    closeReport();
  };

  return (
    <div className="shell">
      <div className="shell__main uprofile">
        <div className="uprofile__banner">
          <img src={profileImg} alt="" className="uprofile__photo" />
        </div>

        <h1 className="uprofile__name">{profile.displayName}</h1>
        <p className="uprofile__user">{profile.username}</p>
        <p className="uprofile__joined">{profile.joined}</p>

        <div className="uprofile__meta">
          <div className="uprofile__follow">
            <span>mengikuti {followingList.length}</span>
            <span>diikuti {profile.followers}</span>
          </div>

          {/* Ikon bahasa pemrograman yang dipelajari (pengganti bendera). Klik untuk melihat daftarnya. */}
          <button
            type="button"
            className="uprofile__langs"
            aria-label="Lihat bahasa yang dipelajari"
            onClick={() => setShowLangs(true)}
          >
            {shownLangs.map((l) => {
              const lang = languages.find((x) => x.id === l.id);
              return lang ? (
                <span key={l.id} className="uprofile__chip">
                  <lang.Icon />
                </span>
              ) : null;
            })}
            {extraLangs > 0 && <span className="uprofile__more">+{extraLangs}</span>}
          </button>
        </div>

        {/* Tombol Laporkan: membuka pop-up pilihan alasan. Tidak tampil di profil sendiri. */}
        {!isMe && (
          <div className="uprofile__actions">
            <button type="button" className="uprofile__btn" onClick={() => setShowReport(true)}>
              <FlagIcon /> Laporkan
            </button>
            <button type="button" className="uprofile__btn uprofile__btn--icon" aria-label="Opsi lainnya">
              •••
            </button>
          </div>
        )}
        {reportedFor === profile.username && (
          <p className="uprofile__note" role="status">
            Laporan dicatat. Catatan: belum dikirim ke server karena endpoint-nya belum tersedia.
          </p>
        )}

        <div className="uprofile__divider" />

        <div className="section-head">
          <h2>Statistik</h2>
        </div>
        <div className="uprofile__stats">
          <div className="stat-card">
            <FlameIcon on={profile.streak > 0} />
            <div>
              <b>{profile.streak}</b>
              <span>Runtunan hari</span>
            </div>
          </div>
          <div className="stat-card">
            <BoltIcon />
            <div>
              <b>{profile.totalXp}</b>
              <span>Total XP</span>
            </div>
          </div>
          <div className="stat-card">
            <LeagueShield tone={profile.leagueTone} />
            <div>
              <b>{profile.league}</b>
              <span>Liga saat ini</span>
            </div>
            <em className="stat-card__tag">Minggu ke-{profile.leagueWeek}</em>
          </div>
          <div className="stat-card">
            <MedalIcon />
            <div>
              <b>{profile.top3}</b>
              <span>Posisi 3 besar</span>
            </div>
          </div>
        </div>

        <div className="section-head">
          <h2>XP minggu ini</h2>
        </div>
        <section className="panel xp">
          <ul className="xp__legend">
            {series.map((s) => (
              <li key={s.label}>
                <span className="xp__dot" style={{ background: s.color }} />
                <span className="xp__name" style={{ color: s.color }}>
                  {s.label}
                </span>
                <b style={{ color: s.color }}>{s.values[s.values.length - 1]} XP</b>
              </li>
            ))}
          </ul>
          <XpChart series={series} />
        </section>

        <div className="section-head">
          <h2>Pencapaian</h2>
          <Link to={`/pengguna/${profile.username}/pencapaian`}>Lihat semua</Link>
        </div>
        {/* Lima pencapaian dalam satu baris */}
        <section className="panel uprofile__badges">
          {profile.achievements.slice(0, 5).map((a) => (
            <button
              key={a.id}
              type="button"
              className="uprofile__badge"
              aria-label={`Lihat pencapaian ${a.name}`}
              onClick={() => setBadge(a)}
            >
              <AchievementBadge icon={a.icon} color={a.color} level={a.level} />
            </button>
          ))}
        </section>
      </div>

      <aside className="shell__side">
        <StatsBar stats={myStats} />

        <section className="panel follow">
          <div className="follow__tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "following"}
              className="follow__tab"
              onClick={() => setTab("following")}
            >
              Mengikuti
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "followers"}
              className="follow__tab"
              onClick={() => setTab("followers")}
            >
              Pengikut
            </button>
          </div>

          {tab === "following" ? (
            followingList.length === 0 ? (
              <p className="follow__empty">Belum mengikuti siapa pun</p>
            ) : (
              <ul className="follow__list">
                {followingList.map((f) => (
                  <li key={f.name} className="follow-row">
                    <span className="follow-row__avatar">{f.name.charAt(0).toUpperCase()}</span>
                    <div>
                      <b>{f.name}</b>
                      <span>{f.xp} XP</span>
                    </div>
                  </li>
                ))}
              </ul>
            )
          ) : (
            // SEMENTARA: semua akun contoh belum punya pengikut. Daftar asli datang dari backend.
            <div className="follow__box">
              <h3>Jadilah pengikut pertamanya!</h3>
              <img src={followersImg} alt="" className="follow__photo" />
              <p>Belajar lebih seru dan efektif saat kamu terhubung dengan yang lain.</p>
              {/* Belum tersambung backend */}
              {!isMe && (
                <button type="button" className="follow__btn">
                  <PersonPlusIcon /> Ikuti
                </button>
              )}
            </div>
          )}
        </section>
      </aside>

      {/* Daftar bahasa pemrograman yang dipelajari */}
      {showLangs && (
        <Modal title={`Bahasa ${profile.displayName}`} onClose={() => setShowLangs(false)}>
          <ul className="lang-list">
            {profile.languages.map((l) => {
              const lang = languages.find((x) => x.id === l.id);
              if (!lang) return null;
              return (
                <li key={l.id} className="lang-row">
                  <span className="lang-row__icon">
                    <lang.Icon />
                  </span>
                  <b className="lang-row__name">{lang.name}</b>
                  <span className="lang-row__xp">{l.xp} XP</span>
                  <span className="lang-row__go">
                    <ChevronIcon />
                  </span>
                </li>
              );
            })}
          </ul>
        </Modal>
      )}

      {/* Detail pencapaian */}
      {badge && (
        <Modal onClose={() => setBadge(null)}>
          <div className="ach-modal">
            <AchievementBadge icon={badge.icon} color={badge.color} level={badge.level} size="lg" />
            <h2>{badge.name}</h2>
            <p>
              {badge.goal ? (
                <>
                  <b>Level Selanjutnya:</b> {badge.goal}
                </>
              ) : (
                badge.doneText
              )}
            </p>
          </div>
        </Modal>
      )}

      {/* Pop-up laporkan pengguna */}
      {showReport && (
        <Modal onClose={closeReport}>
          <div className="report">
            <h2>Laporkan {profile.username}</h2>

            <div className="report__select">
              <select
                aria-label="Pilih alasan laporan"
                className={reason ? "" : "report__select--empty"}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                <option value="">Pilih alasan laporan ini...</option>
                {REPORT_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <ChevronDownIcon />
            </div>

            <div className="report__actions">
              <button type="button" className="report__cancel" onClick={closeReport}>
                Tolak
              </button>
              <button type="button" className="report__submit" disabled={!reason} onClick={submitReport}>
                Laporkan
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}