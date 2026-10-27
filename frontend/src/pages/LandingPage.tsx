// frontend/src/pages/LandingPage.tsx
import { Link } from "react-router-dom";
import "./LandingPage.css";
import logo from "../assets/logo.png";

const languages = [
  { name: "HTML", icon: "🌐" },
  { name: "CSS", icon: "🎨" },
  { name: "JavaScript", icon: "⚡" },
  { name: "Python", icon: "🐍" },
  { name: "Go", icon: "🐹" },
  { name: "SQL", icon: "🗄️" },
];

const features = [
  {
    title: "gratis. seru. efektif.",
    text: "Belajar bersama CodeLingo itu seru dan terbukti efektif. Dengan pelajaran kecil dan cepat, kamu akan mendapat poin dan membuka level-level baru sekaligus memperkuat kemampuan coding sehari-hari.",
    art: "🏆",
    tone: "green",
  },
  {
    title: "didukung ilmu pengetahuan",
    text: "Kami memadukan metode pengajaran yang didukung penelitian dengan konten yang menarik untuk menciptakan kursus-kursus yang mengajarkan keahlian membaca, menulis, dan memecahkan masalah dengan kode.",
    art: "🧪",
    tone: "blue",
    reverse: true,
  },
  {
    title: "tetap termotivasi",
    text: "Kami mempermudah pembentukan kebiasaan belajar dengan fitur-fitur game, tantangan seru, dan pengingat dari maskot ramah kami agar kamu terus belajar.",
    art: "🔥",
    tone: "orange",
  },
  {
    title: "pembelajaran yang dipersonalisasi",
    text: "Pelajaran disesuaikan untuk membantumu belajar di level dan kecepatan yang paling nyaman untukmu.",
    art: "🧭",
    tone: "purple",
    reverse: true,
  },
];

const footerColumns = [
  { title: "Tentang kami", links: ["Kursus", "Misi", "Pendekatan", "Tim"] },
  { title: "Produk", links: ["CodeLingo", "Kuis Harian", "Papan Peringkat"] },
  { title: "Aplikasi", links: ["CodeLingo untuk Android", "CodeLingo untuk iOS"] },
  { title: "Bantuan dan ketentuan", links: ["T&C CodeLingo", "T&C Sekolah", "Privasi"] },
  { title: "Media sosial", links: ["Blog", "Instagram", "YouTube", "LinkedIn"] },
];

function Art({ icon, tone }: { icon: string; tone: string }) {
  return (
    <div className={`art art--${tone}`} aria-hidden="true">
      <span>{icon}</span>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="landing">
      {/* Header */}
      <header className="topbar">
        <Link to="/" className="logo" aria-label="CodeLingo beranda">
          <span className="logo__mark">{"</>"}</span>
          codelingo
        </Link>
        <button type="button" className="locale">
          Bahasa situs: Bahasa Indonesia <span aria-hidden="true">▾</span>
        </button>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="hero__art" aria-hidden="true">
          {/* PERUBAHAN 1: emoji burung hantu diganti logo */}
          <div className="hero__blob">
            <img src={logo} alt="" className="hero__logo" />
          </div>
          <span className="chip chip--a">{"{ }"}</span>
          <span className="chip chip--b">{"</>"}</span>
          <span className="chip chip--c">★</span>
        </div>
        <div className="hero__copy">
          <h1>Cara paling seru untuk belajar coding, logika, dan lainnya!</h1>
          <Link to="/register" className="btn btn--primary">
            Mulai
          </Link>
          <Link to="/login" className="btn btn--ghost">
            Aku sudah punya akun
          </Link>
        </div>
      </section>

      {/* Strip bahasa pemrograman */}
      <nav className="strip" aria-label="Kursus tersedia">
        <button type="button" className="strip__arrow" aria-label="Sebelumnya">
          ‹
        </button>
        <ul>
          {languages.map((l) => (
            <li key={l.name}>
              <span aria-hidden="true">{l.icon}</span> {l.name}
            </li>
          ))}
        </ul>
        <button type="button" className="strip__arrow" aria-label="Berikutnya">
          ›
        </button>
      </nav>

      {/* Fitur */}
      {features.map((f) => (
        <section key={f.title} className={`feature${f.reverse ? " feature--reverse" : ""}`}>
          <div className="feature__copy">
            <h2>{f.title}</h2>
            <p>{f.text}</p>
          </div>
          <Art icon={f.art} tone={f.tone} />
        </section>
      ))}

      {/* Belajar kapan pun */}
      <section className="anywhere">
        <h2>
          belajar kapan pun,
          <br />
          di mana pun
        </h2>
        <div className="stores">
          <a href="#app-store" className="store">
            <small>Unduh di</small>
            App Store
          </a>
          <a href="#google-play" className="store">
            <small>Dapatkan di</small>
            Google Play
          </a>
        </div>
        <div className="phones" aria-hidden="true">
          <div className="phone phone--l" />
          <div className="phone phone--m" />
          <div className="phone phone--r" />
          <span className="float float--1">🔥</span>
          <span className="float float--2">👑</span>
          <span className="float float--3">{"</>"}</span>
        </div>
      </section>

      {/* Promo gelap */}
      <section className="promo">
        {/* PERUBAHAN 2: emoji burung hantu diganti logo */}
        <div className="promo__art" aria-hidden="true">
          <img src={logo} alt="" className="promo__logo" />
        </div>
        <div className="promo__copy">
          <h2>naik level lebih cepat</h2>
          <Link to="/register" className="btn btn--light">
            Coba tantangan
          </Link>
        </div>
      </section>

      {/* Uji kemampuan */}
      <section className="feature feature--test">
        <div className="feature__copy">
          <h2>uji kemampuan coding</h2>
          <p>
            Kuis singkat kami membantumu mengetahui seberapa jauh kemampuan codingmu, lalu
            menyarankan level yang tepat untuk memulai.
          </p>
          <Link to="/register" className="btn btn--outline">
            Mulai kuis
          </Link>
        </div>
        {/* PERUBAHAN 3: emoji 📝 diganti logo */}
        <div className="art art--green" aria-hidden="true">
          <img src={logo} alt="" className="art__logo" />
        </div>
      </section>

      {/* CTA akhir */}
      <section className="final">
        <h2>belajar coding dengan codelingo</h2>
        <Link to="/register" className="btn btn--primary btn--inline">
          Mulai
        </Link>
        <div className="final__field" aria-hidden="true">
          <span>🪙</span>
          <span>💎</span>
          <span>🔥</span>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer__cols">
          {footerColumns.map((c) => (
            <div key={c.title}>
              <h3>{c.title}</h3>
              <ul>
                {c.links.map((l) => (
                  <li key={l}>
                    <a href="#!">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="footer__langs">
          Kursus: {languages.map((l) => l.name).join(" · ")}
        </p>
      </footer>
    </div>
  );
}