import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api/v1",
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Token kedaluwarsa/tidak valid di endpoint terproteksi: hapus token lalu ke login.
// Endpoint /auth/* dikecualikan karena 401 di sana artinya email/password salah.
api.interceptors.response.use(
  (res) => res,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const url = error.config?.url ?? "";
      if (!url.startsWith("/auth/") && !url.startsWith("/admin/auth/")) {
        localStorage.removeItem("token");
        if (window.location.pathname !== "/login") {
          window.location.assign("/login");
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;