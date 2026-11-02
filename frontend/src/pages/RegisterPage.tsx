// frontend/src/pages/RegisterPage.tsx
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import googleIcon from "../assets/google.png";
import fbIcon from "../assets/fb.png";
import "./RegisterPage.css";

type Step = 1 | 2; // 1 = usia, 2 = pilih cara daftar

export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [age, setAge] = useState("");

  // Usia valid: angka 1 sampai 120
  const ageNumber = Number(age);
  const isAgeValid = age !== "" && ageNumber >= 1 && ageNumber <= 120;

  const handleAgeSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isAgeValid) setStep(2);
  };

  // SEMENTARA: belum ada endpoint register (menunggu Dzikra).
  // Untuk sekarang langsung masuk ke halaman yang ada sidebar-nya.
  const handleContinue = () => navigate("/belajar");

  return (
    <div className="register">
      {/* Pojok kiri atas: X (langkah 1) atau panah kembali (langkah 2) */}
      {step === 1 ? (
        <Link to="/" className="register__corner" aria-label="Tutup">
          ✕
        </Link>
      ) : (
        <button
          type="button"
          className="register__corner"
          aria-label="Kembali"
          onClick={() => setStep(1)}
        >
          ←
        </button>
      )}

      {/* Pojok kanan atas: tombol Masuk (hanya di langkah 1) */}
      {step === 1 && (
        <Link to="/login" className="register__switch">
          Masuk
        </Link>
      )}

      {/* ---------- LANGKAH 1: Berapa usiamu? ---------- */}
      {step === 1 && (
        <form key="step-age" className="register__box register__slide" onSubmit={handleAgeSubmit}>
          <h1>Berapa usiamu?</h1>

          <div className="register__field">
            <input
              type="text"
              inputMode="numeric"
              maxLength={3}
              className="register__input"
              placeholder="Usia"
              value={age}
              // Hanya angka yang boleh masuk
              onChange={(e) => setAge(e.target.value.replace(/\D/g, ""))}
            />
            {age !== "" && (
              <button
                type="button"
                className="register__clear"
                aria-label="Hapus"
                onClick={() => setAge("")}
              >
                ✕
              </button>
            )}
          </div>

          <p className="register__hint">
            Dengan mengisi umur, kamu akan mendapatkan pengalaman CodeLingo yang sesuai. Untuk
            informasi lebih lanjut, bacalah <a href="#!">Kebijakan Privasi</a> kami.
          </p>

          <button type="submit" className="register__next" disabled={!isAgeValid}>
            Berikutnya
          </button>

          <div className="register__divider">
            <span>Atau</span>
          </div>

          {/* Logo Google & Facebook memakai gambar asli dari assets */}
          <div className="register__row">
            <button type="button" className="register__social register__social--google">
              <img src={googleIcon} alt="" className="register__icon" />
              Google
            </button>
            <button type="button" className="register__social register__social--facebook">
              <img src={fbIcon} alt="" className="register__icon" />
              Facebook
            </button>
          </div>

          <p className="register__terms">
            Dengan masuk ke CodeLingo, kamu menyetujui <strong>Ketentuan</strong> dan{" "}
            <strong>Kebijakan Privasi</strong> kami.
          </p>
        </form>
      )}

      {/* ---------- LANGKAH 2: Pilih cara mendaftar ---------- */}
      {step === 2 && (
        <div key="step-method" className="register__box register__box--center register__slide">
          <h1>Pilih cara mendaftar untuk melanjutkan!</h1>

          {/* Logo CodeLingo di atas gambar HP */}
          <div className="register__art" aria-hidden="true">
            <img src={logo} alt="" className="register__logo" />
            <svg viewBox="0 0 330 240" className="register__phone">
              {/* bayangan */}
              <polygon points="40,150 155,228 300,150 285,125 155,195 40,120" fill="#e5e5e5" />
              {/* sisi tebal HP */}
              <polygon points="40,120 155,195 155,215 40,140" fill="#46a302" />
              <polygon points="155,195 285,125 285,145 155,215" fill="#58a700" />
              {/* permukaan atas HP */}
              <polygon
                points="40,120 170,50 285,125 155,195"
                fill="#fff"
                stroke="#58cc02"
                strokeWidth="10"
                strokeLinejoin="round"
              />
              <line x1="85" y1="105" x2="135" y2="78" stroke="#58cc02" strokeWidth="8" strokeLinecap="round" />
              <line x1="150" y1="165" x2="215" y2="128" stroke="#89e219" strokeWidth="20" strokeLinecap="round" />
            </svg>
          </div>

          {/* Logo Google & Facebook memakai gambar asli dari assets */}
          <button type="button" className="register__method" onClick={handleContinue}>
            <img src={googleIcon} alt="" className="register__icon" />
            Lanjutkan dengan Google
          </button>
          <button type="button" className="register__method" onClick={handleContinue}>
            <img src={fbIcon} alt="" className="register__icon" />
            Lanjutkan dengan Facebook
          </button>
          <button type="button" className="register__method" onClick={handleContinue}>
            <span className="register__method-icon register__method-icon--email">✉</span>
            Lanjutkan dengan Email
          </button>
        </div>
      )}
    </div>
  );
}