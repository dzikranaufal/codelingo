// frontend/src/pages/ShopPage.tsx
import { Link, useNavigate } from "react-router-dom";
import StatsBar from "../components/StatsBar";
import { FreezeIcon, HeartBigIcon, InfinityHeartIcon, LockIcon } from "../components/ShopIcons";
import logo from "../assets/logo.png";
import { useMyStats } from "../hooks/useMyStats";
import "./pageShell.css";
import "./ShopPage.css";

export default function ShopPage() {
  const navigate = useNavigate();
  const myStats = useMyStats();

  const heartsFull = !!myStats && myStats.hearts >= myStats.maxHearts;

  return (
    <div className="shell">
      <div className="shell__main shop">
        {/* Banner paket keluarga */}
        <section className="promo-banner">
          <div className="promo-banner__text">
            <h2>Paket Sharing!</h2>
            <p>
              Lebih hemat belajar dengan <b>CodeLingo Plus</b> bersama teman-teman
            </p>
            <button type="button" className="promo-banner__btn" disabled>
              Segera hadir
            </button>
          </div>
          <div className="promo-banner__art">
            <img src={logo} alt="" />
          </div>
        </section>

        {/* Hati */}
        <h2 className="shop__title">Hati</h2>
        <ul className="shop__list">
          <li className="shop-item">
            <span className="shop-item__icon">
              <HeartBigIcon />
            </span>
            <div className="shop-item__body">
              <h3>Isi Ulang Hati</h3>
              <p>Dapatkan hati penuh agar kamu tidak takut membuat kesalahan dalam pelajaran.</p>
            </div>
            <button type="button" className="shop-btn shop-btn--off" disabled>
              {heartsFull ? "Penuh" : "Belum tersedia"}
            </button>
          </li>

          <li className="shop-item">
            <span className="shop-item__icon">
              <InfinityHeartIcon />
            </span>
            <div className="shop-item__body">
              <h3>Hati Tak Terbatas</h3>
              <p>Takkan lagi kehabisan hati bersama CodeLingo Plus!</p>
            </div>
            <button type="button" className="shop-btn shop-btn--plus" disabled>
              Belum tersedia
            </button>
          </li>
        </ul>

        {/* Power-up */}
        <h2 className="shop__title shop__title--spaced">Power-up</h2>
        <ul className="shop__list">
          <li className="shop-item">
            <span className="shop-item__icon">
              <FreezeIcon />
            </span>
            <div className="shop-item__body">
              <h3>
                Pembeku Runtunan
                <span className="shop-tag">
                  Belum tersedia
                </span>
              </h3>
              <p>Pembeku Runtunan mencegah runtunanmu hilang meskipun tidak beraktivitas selama sehari penuh.</p>
            </div>
            <button type="button" className="shop-btn shop-btn--off" disabled>
              Belum tersedia
            </button>
          </li>
        </ul>
      </div>

      <aside className="shell__side">
        {myStats && <StatsBar stats={myStats} />}

        {/* Kartu liga */}
        <section className="panel side-card">
          <header className="side-card__head">
            <h3>Liga Emas</h3>
            <Link to="/papan-skor">Lihat liga</Link>
          </header>
          <div className="league-note">
            <img src={logo} alt="" />
            <p>Selesaikan satu pelajaran untuk bersaing dengan para pelajar lain di papan skor minggu ini</p>
          </div>
        </section>

        {/* Kartu misi harian */}
        <section className="panel side-card">
          <header className="side-card__head">
            <h3>Misi Harian</h3>
            <Link to="/misi">Lihat semua</Link>
          </header>

          <p className="side-card__quest">Dapatkan 10 XP</p>
          <div className="friends-streak">
            <img src={logo} alt="" />
            <div>
              <b>0 Runtunan Teman aktif</b>
              {/* Belum ada halaman daftar teman */}
              <button type="button" disabled>Lihat daftar</button>
            </div>
          </div>

          <div className="sultan">
            <span className="sultan__icon">
              <LockIcon />
            </span>
            <div>
              <b>Sultan Runtunan</b>
              <p>Capai 7 hari beruntun untuk jadi Sultan Runtunan dan dapatkan berbagai hadiah eksklusif.</p>
            </div>
          </div>

          <button type="button" className="side-btn" onClick={() => navigate("/misi")}>
            Lihat selengkapnya
          </button>
        </section>
      </aside>
    </div>
  );
}