// frontend/src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Sidebar from "./components/Sidebar";

// SEMENTARA: halaman untuk memamerkan component Sidebar.
// Sidebar di kiri, area konten di kanan masih kosong (dikerjakan nanti).
function SidebarPreview() {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar defaultActive="Belajar" />
      <main style={{ flex: 1 }} />
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
        <Route path="/belajar" element={<SidebarPreview />} />
      </Routes>
    </BrowserRouter>
  );
}