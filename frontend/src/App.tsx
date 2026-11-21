// frontend/src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import LearnPage from "./pages/LearnPage";
import CoursesPage from "./pages/CoursesPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import UserProfilePage from "./pages/UserProfilePage";
import AchievementsPage from "./pages/AchievementsPage";
import Sidebar from "./components/Sidebar";
import "./App.css";

// Layout halaman dengan sidebar di kiri dan konten di kanan
function SidebarLayout({
  children,
  defaultActive = "Belajar",
}: {
  children?: ReactNode;
  defaultActive?: string;
}) {
  return (
    <div className="app-layout">
      <Sidebar defaultActive={defaultActive} />
      <main className="app-layout__content">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          path="/belajar"
          element={
            <SidebarLayout>
              <LearnPage />
            </SidebarLayout>
          }
        />

        {/* Sesi kuis: layar penuh, tanpa sidebar */}

        <Route
          path="/kursus"
          element={
            <SidebarLayout>
              <CoursesPage />
            </SidebarLayout>
          }
        />
        <Route
          path="/papan-skor"
          element={
            <SidebarLayout defaultActive="Papan Skor">
              <LeaderboardPage />
            </SidebarLayout>
          }
        />
        <Route
          path="/pengguna/:username"
          element={
            <SidebarLayout defaultActive="Papan Skor">
              <UserProfilePage />
            </SidebarLayout>
          }
        />
        <Route
          path="/pengguna/:username/pencapaian"
          element={
            <SidebarLayout defaultActive="Papan Skor">
              <AchievementsPage />
            </SidebarLayout>
          }
        />
        <Route
          path="/profile"
          element={
            <SidebarLayout defaultActive="Profil">
              <ProfilePage />
            </SidebarLayout>
          }
        />

        {/* Alamat yang tidak dikenal kembali ke landing page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}