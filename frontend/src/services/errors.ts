import axios from "axios";

// Ambil pesan error dari respons backend ({"error": "..."}), atau pesan cadangan.
export function apiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const msg = err.response?.data?.error;
    if (typeof msg === "string" && msg) return msg;
    if (!err.response) return "Tidak dapat terhubung ke server.";
  }
  return fallback;
}
