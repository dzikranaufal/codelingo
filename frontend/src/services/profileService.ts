import api from "./api";
import type { Profile } from "../types/profile";

export async function getMyProfile(): Promise<Profile> {
  const res = await api.get<Profile>("/users/me");
  return res.data;
}