import api from "./api";
import type { LearningPath } from "../types/path";

// language (slug) opsional. Kosong = bahasa terakhir yang dipakai user.
export async function getLearningPath(language?: string): Promise<LearningPath> {
  const res = await api.get<LearningPath>("/learning-path", {
    params: language ? { language } : undefined,
  });
  return res.data;
}
