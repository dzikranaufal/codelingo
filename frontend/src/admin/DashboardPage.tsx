import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { errorMessage, formatDate, getStats } from "./adminApi";
import type { Stats } from "./adminApi";

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getStats()
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(errorMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <p className="adm-banner adm-banner-error" role="alert">
        {error}
      </p>
    );
  }
  if (!stats) return <p className="adm-muted">Memuat ringkasan…</p>;

  const items: { label: string; value: number }[] = [
    { label: "Pelajar", value: stats.students },
    { label: "Admin", value: stats.admins },
    { label: "Bahasa dibuka", value: stats.available_languages },
    { label: "Path", value: stats.paths },
    { label: "Lesson", value: stats.lessons },
    { label: "Soal", value: stats.questions },
    { label: "Jawaban masuk", value: stats.attempts },
    { label: "Total XP pelajar", value: stats.total_xp },
  ];

  return (
    <>
      <h1 className="adm-title">Ringkasan</h1>
      <p className="adm-muted">Gambaran singkat isi dan penggunaan CodeLingo.</p>

      <dl className="adm-stats">
        {items.map((item) => (
          <div className="adm-stat" key={item.label}>
            <dt>{item.label}</dt>
            <dd>{item.value.toLocaleString("id-ID")}</dd>
          </div>
        ))}
      </dl>

      <div className="adm-actions adm-section-gap">
        <Link className="adm-btn adm-btn-primary" to="/admin/materi">
          Kelola materi
        </Link>
        <Link className="adm-btn adm-btn-ghost" to="/admin/akun">
          Kelola akun
        </Link>
      </div>

      <h2 className="adm-subtitle adm-section-gap">Akun terbaru</h2>
      {stats.recent_users.length === 0 ? (
        <p className="adm-muted">Belum ada akun.</p>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Bergabung</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent_users.map((u) => (
                <tr key={u.id}>
                  <td>{u.username}</td>
                  <td>{u.email}</td>
                  <td>{u.role === "admin" ? "Admin" : "Pelajar"}</td>
                  <td>{formatDate(u.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}