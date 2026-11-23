
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getMyProfile } from "../services/profileService";
import { getMyStatsDTO, type MyStats } from "../services/statsService";
import type { Profile } from "../types/profile";
import mascot from "../assets/logo.png";
import "./ProfilePage.css";

const show = (value?: number) => (value === undefined ? "—" : value);

export default function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<MyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login", { replace: true });
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        // Streak dan nyawa terkini ada di /me/stats; kalau gagal, profil tetap tampil.
        const [data, statsData] = await Promise.all([
          getMyProfile(),
          getMyStatsDTO().catch(() => null),
        ]);
        if (!cancelled) {
          setProfile(data);
          setStats(statsData);
        }
      } catch (err) {
        if (cancelled) return;

        if (axios.isAxiosError(err)) {
          if (err.response?.status === 401) {
            localStorage.removeItem("token");
            navigate("/login", { replace: true });
            return;
          }

          setError(
            err.response
              ? err.response.data?.error ?? "Gagal memuat profil."
              : "Tidak dapat terhubung ke server. Coba lagi nanti."
          );
        } else {
          setError("Terjadi kesalahan yang tidak diketahui.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  };

  if (loading) {
    return <div className="profile-state">Loading profile...</div>;
  }

  if (error || !profile) {
    return (
      <div className="profile-state">
        <p className="profile-error" role="alert">
          {error || "Profil tidak ditemukan."}
        </p>
        <button
          className="profile-btn"
          onClick={() => window.location.reload()}
        >
          TRY AGAIN
        </button>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Kolom utama */}
      <section className="profile-main">
        <div className="profile-banner">
          <img
            src={mascot}
            alt="Avatar CodeLingo"
            className="profile-avatar"
          />
        </div>

        <div className="profile-info">
          <h1 className="profile-name">{profile.name}</h1>
          <p className="profile-email">
            @{profile.username} · {profile.email}
          </p>
        </div>

        <hr className="profile-divider" />

        <h2 className="profile-heading">Statistics</h2>

        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-icon">🔥</span>
            <div>
              <p className="stat-value">{show(stats?.streak)}</p>
              <p className="stat-label">Day streak</p>
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-icon">⚡</span>
            <div>
              <p className="stat-value">{show(profile.xp)}</p>
              <p className="stat-label">Total XP</p>
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-icon">🏅</span>
            <div>
              <p className="stat-value">{show(profile.level)}</p>
              <p className="stat-label">Level</p>
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-icon">❤️</span>
            <div>
              <p className="stat-value">{show(stats?.hearts ?? profile.lives)}</p>
              <p className="stat-label">Hearts</p>
            </div>
          </div>
        </div>

        <h2 className="profile-heading">Achievements</h2>

        <div className="empty-card">
          <p>No achievements yet. Keep learning to unlock them!</p>
        </div>
      </section>

      {/* Kolom kanan */}
      <aside className="profile-side">
        <div className="topbar-stats">
          <span>🔥 {show(stats?.streak)}</span>
          <span>⚡ {show(profile.xp)}</span>
          <span>❤️ {show(stats?.hearts ?? profile.lives)}</span>
        </div>

        <div className="side-card">
          <h3>Account</h3>
          <p className="side-text">{profile.email}</p>

          <button
            className="profile-btn profile-btn-outline"
            onClick={handleLogout}
          >
            LOG OUT
          </button>
        </div>
      </aside>
    </div>
  );
}
