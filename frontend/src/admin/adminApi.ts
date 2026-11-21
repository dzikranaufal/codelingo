import axios from "axios";
import type { AxiosInstance } from "axios";

const API_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8080";
const TOKEN_KEY = "codelingo_admin_token";

// ---------- tipe data (sesuai kontrak API backend) ----------

export interface AdminUser {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
}

// Dibagikan layout ke halaman admin lewat <Outlet context={...} />.
export interface AdminContext {
  admin: AdminUser;
  reload: () => void;
}

export interface PathSummary {
  id: number;
  name: string;
  description: string;
  language_id: number | null;
  language_name: string;
  language_available: boolean;
  order_index: number;
  lesson_count: number;
}

export interface LanguageView {
  id: number;
  name: string;
  slug: string;
  is_available: boolean;
  path_count: number;
}

export interface PathInfo {
  id: number;
  name: string;
  description: string;
  language_id: number | null;
  order_index: number;
}

export interface PathInput {
  language_id?: number;
  name?: string;
  description?: string;
  order_index?: number;
}

export interface LessonRow {
  id: number;
  title: string;
  description: string;
  level: number;
  learning_path_id: number;
  order_index: number;
  question_count: number;
}

export interface LessonList {
  learning_path: PathInfo;
  lessons: LessonRow[];
}

export interface AdminOption {
  id: number;
  text: string;
  is_correct: boolean;
}

export interface AdminQuestion {
  id: number;
  text: string;
  type: string;
  xp_reward: number;
  explanation: string;
  options: AdminOption[];
}

export interface LessonDetail extends LessonRow {
  questions: AdminQuestion[];
}

export interface QuestionInput {
  text?: string;
  xp_reward?: number;
  explanation?: string;
  options?: { text: string; is_correct: boolean }[];
}

export interface LessonInput {
  title: string;
  description: string;
  level: number;
  order_index?: number;
}

export interface UserRow {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
  xp: number;
  level: number;
  lives: number;
  created_at: string;
}

export interface UserList {
  users: UserRow[];
  total: number;
  limit: number;
  offset: number;
}

export interface Stats {
  students: number;
  admins: number;
  available_languages: number;
  paths: number;
  lessons: number;
  questions: number;
  attempts: number;
  total_xp: number;
  recent_users: UserRow[];
}

export interface AdminProfile {
  id: number;
  username: string;
  name: string;
  email: string;
  age: number;
  role: string;
  xp: number;
  level: number;
  lives: number;
  created_at?: string;
}

// ---------- penyimpanan token ----------
// Token admin disimpan terpisah dari token pelajar agar tidak saling menimpa.

export function getAdminToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAdminToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // penyimpanan tidak tersedia; sesi hanya bertahan sampai halaman dimuat ulang
  }
}

export function clearAdminToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // abaikan
  }
}

// ---------- klien HTTP ----------

function createClient(baseURL: string): AxiosInstance {
  const client = axios.create({ baseURL, timeout: 10000 });

  client.interceptors.request.use((config) => {
    const token = getAdminToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Hanya 401 (token tidak ada/kedaluwarsa) yang mengeluarkan admin.
  // 403 bisa berarti "bahasa belum dibuka", jadi cukup ditampilkan sebagai pesan.
  client.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      if (
        axios.isAxiosError(error) &&
        error.response?.status === 401 &&
        !error.config?.url?.includes("/auth/login")
      ) {
        clearAdminToken();
        if (window.location.pathname !== "/admin/login") {
          window.location.assign("/admin/login");
        }
      }
      return Promise.reject(error);
    },
  );

  return client;
}

// api = endpoint khusus admin (/api/v1/admin), rootApi = endpoint umum seperti /profile.
const api = createClient(`${API_URL}/api/v1/admin`);
const rootApi = createClient(`${API_URL}/api/v1`);

export function httpStatus(err: unknown): number | null {
  return axios.isAxiosError(err) ? (err.response?.status ?? null) : null;
}

export function errorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: string } | undefined;
    if (data?.error) return data.error;
    if (!err.response) {
      return "Tidak dapat terhubung ke server. Pastikan backend sudah menyala.";
    }
    return `Permintaan gagal (kode ${err.response.status}).`;
  }
  return "Terjadi kesalahan tak terduga.";
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

// ---------- masuk dan sesi ----------

export async function adminLogin(
  identifier: string,
  password: string,
): Promise<{ token: string; user: AdminUser }> {
  const { data } = await api.post<{ token: string; user: AdminUser }>("/auth/login", {
    identifier,
    password,
  });
  return data;
}

export async function getMe(): Promise<AdminUser> {
  const { data } = await api.get<AdminUser>("/me");
  return data;
}

// ---------- ringkasan ----------

export async function getStats(): Promise<Stats> {
  const { data } = await api.get<Stats>("/stats");
  return data;
}

// ---------- bahasa dan path ----------

export async function listLanguages(): Promise<LanguageView[]> {
  const { data } = await api.get<{ languages: LanguageView[] }>("/languages");
  return data.languages;
}

export async function listPaths(): Promise<PathSummary[]> {
  const { data } = await api.get<{ learning_paths: PathSummary[] }>("/learning-paths");
  return data.learning_paths;
}

export async function createPath(input: PathInput): Promise<PathSummary> {
  const { data } = await api.post<PathSummary>("/learning-paths", input);
  return data;
}

export async function updatePath(pathId: number, input: PathInput): Promise<PathSummary> {
  const { data } = await api.patch<PathSummary>(`/learning-paths/${pathId}`, input);
  return data;
}

export async function deletePath(pathId: number): Promise<void> {
  await api.delete(`/learning-paths/${pathId}`);
}

// ---------- lesson ----------

export async function listLessons(pathId: number): Promise<LessonList> {
  const { data } = await api.get<LessonList>(`/learning-paths/${pathId}/lessons`);
  return data;
}

export async function getLesson(lessonId: number): Promise<LessonDetail> {
  const { data } = await api.get<LessonDetail>(`/lessons/${lessonId}`);
  return data;
}

export async function createLesson(pathId: number, input: LessonInput): Promise<LessonRow> {
  const { data } = await api.post<LessonRow>(`/learning-paths/${pathId}/lessons`, input);
  return data;
}

export async function updateLesson(lessonId: number, input: LessonInput): Promise<LessonRow> {
  const { data } = await api.patch<LessonRow>(`/lessons/${lessonId}`, input);
  return data;
}

export async function deleteLesson(lessonId: number): Promise<void> {
  await api.delete(`/lessons/${lessonId}`);
}

// ---------- soal ----------

export async function createQuestion(lessonId: number, input: QuestionInput): Promise<AdminQuestion> {
  const { data } = await api.post<AdminQuestion>(`/lessons/${lessonId}/questions`, input);
  return data;
}

export async function updateQuestion(questionId: number, input: QuestionInput): Promise<AdminQuestion> {
  const { data } = await api.patch<AdminQuestion>(`/questions/${questionId}`, input);
  return data;
}

export async function deleteQuestion(questionId: number): Promise<void> {
  await api.delete(`/questions/${questionId}`);
}

// ---------- akun ----------

export async function listUsers(params: {
  search: string;
  limit: number;
  offset: number;
}): Promise<UserList> {
  const { data } = await api.get<UserList>("/users", { params });
  return data;
}

export async function updateUserRole(userId: number, role: "user" | "admin"): Promise<UserRow> {
  const { data } = await api.patch<UserRow>(`/users/${userId}`, { role });
  return data;
}

export async function deleteUser(userId: number): Promise<void> {
  await api.delete(`/users/${userId}`);
}

// ---------- profil admin (endpoint umum /profile) ----------

export async function getProfile(): Promise<AdminProfile> {
  const { data } = await rootApi.get<AdminProfile>("/profile");
  return data;
}

export async function updateProfileName(name: string): Promise<AdminProfile> {
  const { data } = await rootApi.patch<AdminProfile>("/profile", { name });
  return data;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await rootApi.put("/profile/password", {
    current_password: currentPassword,
    new_password: newPassword,
  });
}