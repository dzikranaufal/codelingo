import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";
import { register } from "../services/authService";
import "./LoginPage.css"; // dipakai ulang untuk gaya tombol, input, dll
import "./RegisterPage.css";

const MIN_AGE = 5;
const MAX_AGE = 120;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2>(1);
  const [age, setAge] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ---------- Langkah 1: umur ----------
  const handleAgeSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    const ageNumber = Number(age);
    if (!age || !Number.isInteger(ageNumber)) {
      setError("Masukkan umur kamu dalam angka.");
      return;
    }
    if (ageNumber < MIN_AGE || ageNumber > MAX_AGE) {
      setError(`Umur harus antara ${MIN_AGE} dan ${MAX_AGE} tahun.`);
      return;
    }
    setStep(2);
  };

  // ---------- Langkah 2: akun ----------
  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !email.trim() || !password) {
      setError("Semua kolom wajib diisi.");
      return;
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      setError("Format email tidak valid.");
      return;
    }
    if (password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }

    setLoading(true);
    try {
      const data = await register({
        age: Number(age),
        username: username.trim(),
        email: email.trim(),
        password,
      });
      localStorage.setItem("token", data.token);
      navigate("/"); // sementara; ganti ke /dashboard saat halamannya ada
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (!err.response) {
          setError("Tidak dapat terhubung ke server. Coba lagi nanti.");
        } else if (err.response.status === 409) {
          setError("Email atau username sudah terdaftar.");
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

  const handleBack = () => {
    setError("");
    if (step === 2) setStep(1);
    else navigate("/");
  };

  return (
    <div className="login-page">
      <button
        className="login-close"
        aria-label={step === 2 ? "Kembali" : "Tutup"}
        onClick={handleBack}
      >
        {step === 2 ? "←" : "✕"}
      </button>
      <button className="btn btn-outline login-signup" onClick={() => navigate("/login")}>
        LOGIN
      </button>

      <main className="login-container">
        {step === 1 ? (
          <>
            <h1 className="login-title">How old are you?</h1>

            <form onSubmit={handleAgeSubmit} noValidate>
              <div className="input-wrapper">
                <input
                  className="login-input"
                  type="number"
                  inputMode="numeric"
                  placeholder="Age"
                  value={age}
                  autoFocus
                  onChange={(e) => setAge(e.target.value)}
                />
                {age && (
                  <button
                    type="button"
                    className="clear-btn"
                    aria-label="Hapus"
                    onClick={() => setAge("")}
                  >
                    ✕
                  </button>
                )}
              </div>

              <p className="login-hint">
                Providing your age ensures you get the right CodeLingo experience.
              </p>

              {error && <p className="login-error" role="alert">{error}</p>}

              <button type="submit" className="btn btn-primary">NEXT</button>
            </form>

            <div className="divider"><span>OR</span></div>

            {/* Belum ada backend OAuth, jadi sementara disabled */}
            <div className="social-row">
              <button type="button" className="btn btn-outline btn-google" disabled>
                <FcGoogle size={22} /> GOOGLE
              </button>
              <button type="button" className="btn btn-outline btn-apple" disabled>
                <FaApple size={22} /> APPLE
              </button>
            </div>
          </>
        ) : (
          <>
            <h1 className="login-title">Create your profile</h1>

            <form onSubmit={handleRegisterSubmit} noValidate>
              <input
                className="login-input"
                type="text"
                placeholder="Username"
                autoComplete="username"
                value={username}
                autoFocus
                onChange={(e) => setUsername(e.target.value)}
              />
              <input
                className="login-input"
                type="email"
                placeholder="Email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                className="login-input"
                type="password"
                placeholder="Password (min. 8 karakter)"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {error && <p className="login-error" role="alert">{error}</p>}

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "LOADING..." : "CREATE ACCOUNT"}
              </button>
            </form>
          </>
        )}

        <p className="login-terms">
          By signing in to CodeLingo, you agree to our <strong>Terms</strong> and{" "}
          <strong>Privacy Policy</strong>.
        </p>
      </main>
    </div>
  );
}