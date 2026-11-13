import api from "./api";
import type {
  AnswerResult,
  AnswerValue,
  CompleteResult,
  Lesson,
  LessonStep,
} from "../types/lesson";

/* eslint-disable @typescript-eslint/no-explicit-any */

// ADAPTER: kalau JSON backend berbeda (nama field, nama tipe soal),
// cukup ubah fungsi-fungsi di bawah ini. File lain tidak perlu disentuh.
function normalizeStep(raw: any): LessonStep {
  const id = String(raw.id);
  switch (raw.type) {
    case "info":
      return {
        type: "info", id,
        title: raw.title ?? "",
        paragraphs: raw.paragraphs,
        bullets: raw.bullets,
        code: raw.code,
        footer: raw.footer,
      };
    case "dragfill":
      return {
        type: "dragfill", id,
        prompt: raw.prompt,
        template: raw.template,
        bank: raw.bank,
      };
    case "playground":
      return {
        type: "playground", id,
        title: raw.title,
        prompt: raw.prompt,
        initialCode: raw.initial_code ?? raw.initialCode ?? "",
        editable: Boolean(raw.editable),
      };
    case "choice":
      return { type: "choice", id, prompt: raw.prompt, options: raw.options };
    case "takeaway":
      return {
        type: "takeaway", id,
        title: raw.title ?? "Lesson Takeaways",
        points: raw.points ?? [],
        next: raw.next ?? "",
      };
    default:
      throw new Error(`Tipe soal tidak dikenal: ${String(raw.type)}`);
  }
}

export async function getLesson(lessonId: string): Promise<Lesson> {
  const res = await api.get(`/lessons/${lessonId}`);
  const d = res.data?.data ?? res.data; // jaga-jaga kalau dibungkus { data }
  return {
    id: String(d.id),
    title: d.title ?? "",
    xpReward: d.xp_reward ?? d.xpReward ?? 0,
    steps: (d.steps ?? []).map(normalizeStep),
  };
}

export async function submitAnswer(
  lessonId: string,
  stepId: string,
  answer: AnswerValue
): Promise<AnswerResult> {
  const res = await api.post(`/lessons/${lessonId}/answers`, {
    step_id: stepId,
    answer,
  });
  const d = res.data?.data ?? res.data;
  return {
    correct: Boolean(d.correct),
    correctAnswer: String(d.correct_answer ?? d.correctAnswer ?? ""),
    hearts: Number(d.hearts ?? 0),
  };
}

export async function completeLesson(lessonId: string): Promise<CompleteResult> {
  const res = await api.post(`/lessons/${lessonId}/complete`);
  const d = res.data?.data ?? res.data;
  return {
    xpGained: Number(d.xp_gained ?? d.xpGained ?? 0),
    totalXp: d.total_xp ?? d.totalXp,
    level: d.level,
  };
}