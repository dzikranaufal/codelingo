import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { clearAdminToken, errorMessage, getAdminToken, getMe, httpStatus } from "./adminApi";
import type { AdminContext, AdminUser } from "./adminApi";

const links = [
  { key: "ringkasan", to: "/admin", label: "Ringkasan" },
  { key: "materi", to: "/admin/materi", label: "Materi" },
  { key: "akun", to: "/admin/akun", label: "Akun" },
  { key: "profil", to: "/admin/profil", label: "Profil" },
];

function sectionOf(pathname: string): string {
  if (pathname.startsWith("/admin/akun")) return "akun";
  if (pathname.startsWith("/admin/profil")) return "profil";
  if (/^\/admin\/(materi|paths|lessons)/.test(pathname)) return "materi";
  return "ringkasan";
}

// Penjaga halaman admin: memeriksa token ke backend (GET /admin/me) sebelum
// menampilkan apa pun. Tanpa token valid, admin diarahkan ke halaman login.
export default function AdminLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!getAdminToken()) {
      navigate("/admin/login", { replace: true });
      return;
    }

    let cancelled = false;
    getMe()
      .then((user) => {
        if (cancelled) return;
        setAdmin(user);
        setError("");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const status = httpStatus(err);
        if (status === 401 || status === 403) {
          clearAdminToken();
          navigate("/admin/login", { replace: true });
          return;
        }
        setError(errorMessage(err));
      });

    return () => {
      cancelled = true;
    };
  }, [navigate, attempt]);

  function logout() {
    clearAdminToken();
    navigate("/admin/login", { replace: true });
  }

  if (error) {
    return (
      <div className="adm-container">
        <p className="adm-banner adm-banner-error" role="alert">
          {error}
        </p>
        <button className="adm-btn adm-btn-primary" onClick={() => setAttempt((n) => n + 1)}>
          Coba lagi
        </button>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="adm-container">
        <p className="adm-muted">Memeriksa sesi…</p>
      </div>
    );
  }

  const section = sectionOf(pathname);
  const context: AdminContext = { admin, reload: () => setAttempt((n) => n + 1) };

  return (
    <>
      <header className="adm-topbar">
        <Link to="/admin" className="adm-brand">
          CodeLingo Admin
        </Link>
        <nav className="adm-nav" aria-label="Menu admin">
          {links.map((l) => (
            <Link
              key={l.key}
              to={l.to}
              className={section === l.key ? "adm-nav-link adm-nav-active" : "adm-nav-link"}
              aria-current={section === l.key ? "page" : undefined}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="adm-topbar-right">
          <span className="adm-user">{admin.name}</span>
          <button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={logout}>
            Keluar
          </button>
        </div>
      </header>
      <main className="adm-container">
        <Outlet context={context} />
      </main>
    </>
  );
}