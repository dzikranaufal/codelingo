export interface Profile {
  id: number;
  username: string;
  email: string;
  created_at?: string;
  // Field di bawah belum tentu sudah disediakan backend, jadi dibuat opsional
  total_xp?: number;
  streak?: number;
  hearts?: number;
  level?: number;
}