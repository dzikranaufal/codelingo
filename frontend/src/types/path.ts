export type LessonStatus = "completed" | "current" | "locked";

export interface PathLesson {
  id: number;
  title: string;
  description: string;
  order_index: number;
  question_count: number;
  status: LessonStatus;
  score: number;
}

export interface LearningPath {
  language: { id: number; slug: string; name: string; is_available: boolean };
  path: { id: number; name: string; description: string } | null;
  lessons: PathLesson[];
}
