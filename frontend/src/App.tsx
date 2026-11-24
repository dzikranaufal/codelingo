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
import LessonSessionPage from "./pages/LessonSessionPage";
import CharacterPage from "./pages/CharacterPage";
import QuestPage from "./pages/QuestPage";
import ShopPage from "./pages/ShopPage";

import Sidebar from "./components/Sidebar";
import AdminApp from "./admin/AdminApp";

import "./App.css";

// Halaman yang membutuhkan login
function RequireAuth({ children }: { children: ReactNode }) {
  if (!localStorage.getItem("token")) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Layout halaman dengan sidebar
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

        {/* Admin */}
        <Route path="/admin/*" element={<AdminApp />} />

        <Route
          path="/belajar"
          element={
            <RequireAuth>
              <SidebarLayout>
                <LearnPage />
              </SidebarLayout>
            </RequireAuth>
          }
        />

        {/* Sesi kuis: layar penuh, tanpa sidebar */}
        <Route
          path="/belajar/pelajaran/:lessonId"
          element={
            <RequireAuth>
              <LessonSessionPage />
            </RequireAuth>
          }
        />

        <Route
          path="/kursus"
          element={
            <RequireAuth>
              <SidebarLayout>
                <CoursesPage />
              </SidebarLayout>
            </RequireAuth>
          }
        />

        <Route
          path="/papan-skor"
          element={
            <RequireAuth>
              <SidebarLayout defaultActive="Papan Skor">
                <LeaderboardPage />
              </SidebarLayout>
            </RequireAuth>
          }
        />

        <Route
          path="/pengguna/:username"
          element={
            <RequireAuth>
              <SidebarLayout defaultActive="Papan Skor">
                <UserProfilePage />
              </SidebarLayout>
            </RequireAuth>
          }
        />

        <Route
          path="/pengguna/:username/pencapaian"
          element={
            <RequireAuth>
              <SidebarLayout defaultActive="Papan Skor">
                <AchievementsPage />
              </SidebarLayout>
            </RequireAuth>
          }
        />

        <Route
          path="/profile"
          element={
            <RequireAuth>
              <SidebarLayout defaultActive="Profil">
                <ProfilePage />
              </SidebarLayout>
            </RequireAuth>
          }
        />

        <Route
          path="/karakter"
          element={
            <RequireAuth>
              <SidebarLayout defaultActive="Karakter">
                <CharacterPage />
              </SidebarLayout>
            </RequireAuth>
          }
        />

        <Route
          path="/misi"
          element={
            <RequireAuth>
              <SidebarLayout defaultActive="Misi">
                <QuestPage />
              </SidebarLayout>
            </RequireAuth>
          }
        />

        <Route
          path="/toko"
          element={
            <RequireAuth>
              <SidebarLayout defaultActive="Toko">
                <ShopPage />
              </SidebarLayout>
            </RequireAuth>
          }
        />

        {/* Alamat yang tidak dikenal kembali ke landing page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
