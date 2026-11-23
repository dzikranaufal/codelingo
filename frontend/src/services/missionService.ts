import api from "./api";
import type { MissionsResponse } from "../types/mission";

export async function getMyMissions(): Promise<MissionsResponse> {
  const res = await api.get<MissionsResponse>("/me/missions");
  return res.data;
}
