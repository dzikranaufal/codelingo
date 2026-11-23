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
import LessonSessionPage from "./pages/LessonSessionPage";
import Sidebar from "./components/Sidebar";
import AdminApp from "./admin/AdminApp";
import "./App.css";

// Halaman yang butuh login: tanpa token, arahkan ke /login.
// (Token yang kedaluwarsa ditangani interceptor 401 di services/api.ts.)
function RequireAuth({ children }: { children: ReactNode }) {
  if (!localStorage.getItem("token")) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

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

        <Route path="/admin/*" element={<AdminApp />} />

        {/* Alamat yang tidak dikenal kembali ke landing page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}