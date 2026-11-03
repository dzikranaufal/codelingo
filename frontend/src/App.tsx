import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import Sidebar from "./components/Sidebar";
import "./App.css";

function SidebarLayout({
  children,
  defaultActive = "Belajar",
}: {
  children: ReactNode;
  defaultActive?: string;
}) {
  return (
    <div className="app-layout">
      <Sidebar defaultActive={defaultActive} />
      <main className="app-layout__content">{children}</main>
    </div>
  );
}

function SidebarPreview() {
  return <SidebarLayout />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/belajar" element={<SidebarPreview />} />
        <Route
          path="/profile"
          element={
            <SidebarLayout defaultActive="Profil">
              <ProfilePage />
            </SidebarLayout>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}