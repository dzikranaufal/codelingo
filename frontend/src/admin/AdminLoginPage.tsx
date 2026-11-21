import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { adminLogin, errorMessage, getAdminToken, setAdminToken } from "./adminApi";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (getAdminToken()) {
    return <Navigate to="/admin" replace />;
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const { token, user } = await adminLogin(identifier.trim(), password);
      if (user.role !== "admin") {
        setError("Akun ini bukan admin.");
        return;
      }
      setAdminToken(token);
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="adm-login">
      <form className="adm-login-form" onSubmit={onSubmit}>
        <h1 className="adm-login-title">Masuk sebagai admin</h1>
        <p className="adm-muted">Khusus pengelola materi CodeLingo.</p>

        <label className="adm-field">
          <span className="adm-label">Username atau email</span>
          <input
            className="adm-input"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            autoComplete="username"
            required
          />
        </label>

        <label className="adm-field">
          <span className="adm-label">Password</span>
          <input
            className="adm-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        {error && (
          <p className="adm-banner adm-banner-error" role="alert">
            {error}
          </p>
        )}

        <button className="adm-btn adm-btn-primary adm-btn-block" type="submit" disabled={loading}>
          {loading ? "Memeriksa…" : "Masuk"}
        </button>
      </form>
    </main>
  );
}
