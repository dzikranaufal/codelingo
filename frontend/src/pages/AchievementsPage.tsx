// frontend/src/pages/AchievementsPage.tsx
import { Link, useParams } from "react-router-dom";
import AchievementBadge from "../components/AchievementBadge";
import { getProfile } from "../data/mockData";
import "./pageShell.css";
import "./AchievementsPage.css";

export default function AchievementsPage() {
  const { username = "" } = useParams();
  const profile = getProfile(username);

  if (!profile) {
    return (
      <div className="shell">
        <div className="shell__main">
          <h1>Pengguna tidak ditemukan</h1>
          <Link to="/papan-skor">Kembali ke papan skor</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="shell">
      <div className="shell__main achievements">
        <Link to={`/pengguna/${profile.username}`} className="achievements__back">
          ← Kembali ke profil
        </Link>
        <h1>Pencapaian {profile.username}</h1>

        <section className="panel achievements__list">
          {profile.achievements.map((a) => {
            const pct = a.progress ? Math.min(100, (a.progress.current / a.progress.target) * 100) : 0;
            return (
              <article key={a.id} className="ach-item">
                <AchievementBadge icon={a.icon} color={a.color} level={a.level} size="sm" />
                <div className="ach-item__body">
                  <div className="ach-item__top">
                    <h3>{a.name}</h3>
                    {a.progress && (
                      <span>
                        {a.progress.current}/{a.progress.target}
                      </span>
                    )}
                  </div>
                  {a.progress && (
                    <div
                      className="ach-item__bar"
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={a.progress.target}
                      aria-valuenow={a.progress.current}
                    >
                      <span style={{ width: `${pct}%` }} />
                    </div>
                  )}
                  <p>{a.progress ? a.goal : a.doneText}</p>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </div>
  );
}