// frontend/src/pages/ShopPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import StatsBar from "../components/StatsBar";
import { FreezeIcon, GemIcon, HeartBigIcon, InfinityHeartIcon, LockIcon } from "../components/ShopIcons";
import logo from "../assets/logo.png";
import { useMyStats } from "../hooks/useMyStats";
import { getMyRank } from "../services/leaderboardService";
import { getQuests } from "../services/questService";
import { apiErrorMessage } from "../services/errors";
import { getShop, purchase } from "../services/shopService";
import type { QuestItem } from "../types/quest";
import type { ShopItem, ShopResponse } from "../types/shop";
import "./pageShell.css";
import "./ShopPage.css";

// Harga, stok, dan validasi pembelian ditentukan backend (GET /shop).
export default function ShopPage() {
  const navigate = useNavigate();
  const baseStats = useMyStats();
  const [shop, setShop] = useState<ShopResponse | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [rank, setRank] = useState<number | null>(null);
  const [quest, setQuest] = useState<QuestItem | null>(null);

  useEffect(() => {
    let cancelled = false;
    getShop()
      .then((d) => !cancelled && setShop(d))
      .catch((e) => !cancelled && setError(apiErrorMessage(e, "Gagal memuat toko.")));
    // Kartu samping hanya pelengkap: kalau gagal, cukup tidak tampil.
    getMyRank()
      .then((r) => !cancelled && setRank(r))
      .catch(() => {});
    getQuests()
      .then((d) => !cancelled && setQuest(d.quests.find((q) => !q.completed) ?? d.quests[0] ?? null))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const item = (id: ShopItem["id"]) => shop?.items.find((i) => i.id === id);
  const refill = item("heart_refill");
  const freeze = item("streak_freeze");

  // Bar statistik ikut angka terbaru dari toko setelah pembelian.
  const barStats = useMemo(
    () => (baseStats && shop ? { ...baseStats, gems: shop.gems, hearts: shop.hearts } : baseStats),
    [baseStats, shop],
  );

  const buy = async (id: ShopItem["id"]) => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      setShop(await purchase(id));
    } catch (e) {
      setError(apiErrorMessage(e, "Pembelian gagal. Coba lagi."));
      // Sinkronkan ulang bila server menolak karena data sudah berubah.
      getShop().then(setShop).catch(() => {});
    } finally {
      setBusy(false);
    }
  };

  const canBuy = (i?: ShopItem) => !!i && i.state === "ok" && !busy;

  return (
    <div className="shell">
      <div className="shell__main shop">
        {/* Banner paket keluarga: fitur CodeLingo Plus belum tersedia */}
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

        {error && (
          <p role="alert" className="shop__title">
            {error}
          </p>
        )}
        {!shop && !error && <p>Memuat…</p>}

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
            <button
              type="button"
              className={`shop-btn${canBuy(refill) ? "" : " shop-btn--off"}`}
              disabled={!canBuy(refill)}
              onClick={() => buy("heart_refill")}
            >
              {refill?.state === "full" ? (
                "Penuh"
              ) : (
                <>
                  Tukar: <span className="shop-btn__gem"><GemIcon /></span> {refill?.cost ?? "–"}
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
            <button type="button" className="shop-btn shop-btn--off" disabled>
              Segera hadir
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
                  {freeze?.owned ?? 0} / {freeze?.max ?? 0} dimiliki
                </span>
              </h3>
              <p>Pembeku Runtunan mencegah runtunanmu hilang meskipun tidak beraktivitas selama sehari penuh.</p>
            </div>
            <button
              type="button"
              className={`shop-btn${canBuy(freeze) ? "" : " shop-btn--off"}`}
              disabled={!canBuy(freeze)}
              onClick={() => buy("streak_freeze")}
            >
              {freeze?.state === "max_owned" ? (
                "Maksimal"
              ) : (
                <>
                  Tukar: <span className="shop-btn__gem"><GemIcon /></span> {freeze?.cost ?? "–"}
                </>
              )}
            </button>
          </li>
        </ul>
      </div>

      <aside className="shell__side">
        {barStats && <StatsBar stats={barStats} />}

        {/* Kartu papan skor */}
        <section className="panel side-card">
          <header className="side-card__head">
            <h3>Papan Skor</h3>
            <Link to="/papan-skor">Lihat papan skor</Link>
          </header>
          <div className="league-note">
            <img src={logo} alt="" />
            <p>
              {rank
                ? `Kamu di peringkat #${rank} minggu ini. Kumpulkan XP untuk naik peringkat.`
                : "Selesaikan satu pelajaran untuk bersaing dengan para pelajar lain di papan skor minggu ini"}
            </p>
          </div>
        </section>

        {/* Kartu misi harian */}
        <section className="panel side-card">
          <header className="side-card__head">
            <h3>Misi Harian</h3>
            <Link to="/misi">Lihat semua</Link>
          </header>

          {quest && (
            <p className="side-card__quest">
              {quest.title} ({quest.progress}/{quest.target})
            </p>
          )}

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
