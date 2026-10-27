import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook, FaApple } from "react-icons/fa";
import { login } from "../services/authService";
import "./LoginPage.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!identifier.trim() || !password) {
      setError("Email/username dan password wajib diisi.");
      return;
    }

    setLoading(true);
    try {
      const data = await login({ identifier: identifier.trim(), password });
      localStorage.setItem("token", data.token);
      navigate("/"); // sementara; ganti ke /dashboard saat halamannya ada
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (!err.response) {
          setError("Tidak dapat terhubung ke server. Coba lagi nanti.");
        } else if (err.response.status === 401) {
          setError("Email/username atau password salah.");
        } else {
          setError(err.response.data?.message ?? "Terjadi kesalahan. Coba lagi.");
        }
      } else {
        setError("Terjadi kesalahan yang tidak diketahui.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <button className="login-close" aria-label="Tutup" onClick={() => navigate("/")}>
        ✕
      </button>
      <button className="btn btn-outline login-signup" onClick={() => navigate("/register")}>
        SIGN UP
      </button>

      <main className="login-container">
        <h1 className="login-title">Log in</h1>

        <form onSubmit={handleSubmit} noValidate>
          <input
            className="login-input"
            type="text"
            placeholder="Email or username"
            autoComplete="username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />

          <div className="password-wrapper">
            <input
              className="login-input"
              type="password"
              placeholder="Password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="button" className="forgot-btn" onClick={() => navigate("/forgot-password")}>
              FORGOT?
            </button>
          </div>

          {error && <p className="login-error" role="alert">{error}</p>}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "LOADING..." : "LOG IN"}
          </button>
        </form>

        <div className="divider"><span>OR</span></div>

        {/* Social login belum ada endpoint backend, jadi sementara disabled */}
        <button type="button" className="btn btn-outline btn-google" disabled>
          <FcGoogle size={22} /> SIGN IN WITH GOOGLE
        </button>
        <button type="button" className="btn btn-outline btn-facebook" disabled>
          <FaFacebook size={22} /> SIGN IN WITH FACEBOOK
        </button>
        <button type="button" className="btn btn-outline btn-apple" disabled>
          <FaApple size={22} /> SIGN IN WITH APPLE
        </button>

        <p className="login-terms">
          By signing in to CodeLingo, you agree to our <strong>Terms</strong> and{" "}
          <strong>Privacy Policy</strong>.
        </p>
      </main>
    </div>
  );
}