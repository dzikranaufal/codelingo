// frontend/src/pages/ShopPage.tsx
import { Link, useNavigate } from "react-router-dom";
import StatsBar from "../components/StatsBar";
import { FreezeIcon, GemIcon, HeartBigIcon, InfinityHeartIcon, LockIcon } from "../components/ShopIcons";
import logo from "../assets/logo.png";
import { myStats } from "../data/mockData";
import "./pageShell.css";
import "./ShopPage.css";

// DATA SEMENTARA. Harga, stok power-up, dan hasil pembelian harus ditentukan
// dan divalidasi backend (Tahap 6), bukan dihitung di frontend.
const HEART_REFILL_COST = 350;
const FREEZE_COST = 600;
const FREEZE_ACTIVE = 0;
const FREEZE_MAX = 2;

export default function ShopPage() {
  const navigate = useNavigate();

  const heartsFull = myStats.hearts >= myStats.maxHearts;
  const canRefill = !heartsFull && myStats.gems >= HEART_REFILL_COST;
  const canBuyFreeze = FREEZE_ACTIVE < FREEZE_MAX && myStats.gems >= FREEZE_COST;

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
            <button type="button" className="promo-banner__btn">
              Lebih lanjut
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
            {/* Belum tersambung backend */}
            <button type="button" className={`shop-btn${canRefill ? "" : " shop-btn--off"}`} disabled={!canRefill}>
              {heartsFull ? (
                "Penuh"
              ) : (
                <>
                  Tukar: <span className="shop-btn__gem"><GemIcon /></span> {HEART_REFILL_COST}
                </>
              )}
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
            <button type="button" className="shop-btn shop-btn--plus">
              Coba gratis
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
                  {FREEZE_ACTIVE} / {FREEZE_MAX} aktif
                </span>
              </h3>
              <p>Pembeku Runtunan mencegah runtunanmu hilang meskipun tidak beraktivitas selama sehari penuh.</p>
            </div>
            <button type="button" className={`shop-btn${canBuyFreeze ? "" : " shop-btn--off"}`} disabled={!canBuyFreeze}>
              Tukar: <span className="shop-btn__gem"><GemIcon /></span> {FREEZE_COST}
            </button>
          </li>
        </ul>
      </div>

      <aside className="shell__side">
        <StatsBar stats={myStats} />

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
              <button type="button">Lihat daftar</button>
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