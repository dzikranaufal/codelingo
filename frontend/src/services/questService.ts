import api from "./api";
import type { QuestResponse } from "../types/quest";

export async function getQuests(): Promise<QuestResponse> {
  const res = await api.get<QuestResponse>("/quests");
  return res.data;
}

export async function claimQuest(id: string): Promise<QuestResponse> {
  const res = await api.post<QuestResponse>(`/quests/${encodeURIComponent(id)}/claim`);
  return res.data;
}
