// frontend/src/pages/LoginPage.tsx
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import googleIcon from "../assets/google.png";
import fbIcon from "../assets/fb.png";
import appleIcon from "../assets/apple.png";
import "./LoginPage.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const [identity, setIdentity] = useState(""); // email atau nama pengguna
  const [password, setPassword] = useState("");

  // Pesan error per kolom. Kosong ("") = tidak ada error.
  const [identityError, setIdentityError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    // Cek tiap kolom. Spasi saja pada nama/email dianggap kosong.
    const identityMsg = identity.trim() === "" ? "Masukkan email atau nama pengguna" : "";
    const passwordMsg = password === "" ? "Masukkan kata sandi" : "";

    setIdentityError(identityMsg);
    setPasswordError(passwordMsg);

    // Kalau ada yang kosong, berhenti di sini (tidak pindah halaman)
    if (identityMsg || passwordMsg) return;

    // SEMENTARA: belum ada pengecekan akun ke backend (menunggu endpoint login dari Dzikra).
    // Untuk sekarang, kalau kedua kolom terisi langsung masuk ke halaman bersidebar.
    navigate("/belajar");
  };

  return (
    <div className="login">
      {/* Tombol tutup: kembali ke landing page */}
      <Link to="/" className="login__close" aria-label="Tutup">
        ✕
      </Link>

      {/* Tombol daftar: membuka halaman register */}
      <Link to="/register" className="login__signup">
        Daftar
      </Link>

      {/* noValidate: pesan error memakai gaya sendiri, bukan balon bawaan browser */}
      <form className="login__box" onSubmit={handleSubmit} noValidate>
        <h1>Masuk</h1>

        {/* Kolom email / nama pengguna */}
        <div>
          <input
            type="text"
            className={`login__input${identityError ? " login__input--error" : ""}`}
            placeholder="Email atau nama pengguna"
            autoComplete="username"
            aria-invalid={identityError ? true : undefined}
            aria-describedby={identityError ? "identity-error" : undefined}
            value={identity}
            onChange={(e) => {
              setIdentity(e.target.value);
              if (identityError) setIdentityError(""); // pesan hilang saat mulai mengetik
            }}
          />
          {identityError && (
            <p id="identity-error" className="login__error" role="alert">
              {identityError}
            </p>
          )}
        </div>

        {/* Kolom kata sandi */}
        <div>
          <div className="login__field">
            <input
              type="password"
              className={`login__input${passwordError ? " login__input--error" : ""}`}
              placeholder="Kata sandi"
              autoComplete="current-password"
              aria-invalid={passwordError ? true : undefined}
              aria-describedby={passwordError ? "password-error" : undefined}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError(""); // pesan hilang saat mulai mengetik
              }}
            />
            <button type="button" className="login__forgot">
              Lupa?
            </button>
          </div>
          {passwordError && (
            <p id="password-error" className="login__error" role="alert">
              {passwordError}
            </p>
          )}
        </div>

        <button type="submit" className="login__submit">
          Masuk
        </button>

        <div className="login__divider">
          <span>Atau</span>
        </div>

        {/* Tombol sosial hanya tampilan (OAuth tidak ada di tech stack proyek) */}
        <button type="button" className="login__social login__social--google">
          <img src={googleIcon} alt="" className="login__icon" />
          Masuk dengan Google
        </button>
        <button type="button" className="login__social login__social--facebook">
          <img src={fbIcon} alt="" className="login__icon" />
          Masuk dengan Facebook
        </button>
        <button type="button" className="login__social login__social--apple">
          <img src={appleIcon} alt="" className="login__icon" />
          Masuk dengan Apple
        </button>

        <p className="login__terms">
          Dengan masuk ke CodeLingo, kamu menyetujui <strong>Ketentuan</strong> dan{" "}
          <strong>Kebijakan Privasi</strong> kami.
        </p>
      </form>
    </div>
  );
}