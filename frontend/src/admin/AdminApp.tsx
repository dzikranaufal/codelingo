import { Navigate, Route, Routes } from "react-router-dom";
import AccountsPage from "./AccountsPage";
import AdminLayout from "./AdminLayout";
import AdminLoginPage from "./AdminLoginPage";
import AdminProfilePage from "./AdminProfilePage";
import DashboardPage from "./DashboardPage";
import LessonDetailPage from "./LessonDetailPage";
import PathLessonsPage from "./PathLessonsPage";
import PathsPage from "./PathsPage";
import "./admin.css";
import "./admin-more.css";

// Pasang di router utama: <Route path="/admin/*" element={<AdminApp />} />
export default function AdminApp() {
  return (
    <div className="adm-root">
      <Routes>
        <Route path="login" element={<AdminLoginPage />} />
        <Route element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="materi" element={<PathsPage />} />
          <Route path="paths/:pathId" element={<PathLessonsPage />} />
          <Route path="lessons/:lessonId" element={<LessonDetailPage />} />
          <Route path="akun" element={<AccountsPage />} />
          <Route path="profil" element={<AdminProfilePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </div>
  );
}