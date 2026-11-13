export interface InfoStep {
  type: "info";
  id: string;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  code?: string;
  footer?: string;
}

export interface DragFillStep {
  type: "dragfill";
  id: string;
  prompt: string;
  template: string; // {{}} = slot kosong
  bank: string[];
}

export interface PlaygroundStep {
  type: "playground";
  id: string;
  title?: string;
  prompt: string;
  initialCode: string;
  editable: boolean;
}

export interface ChoiceStep {
  type: "choice";
  id: string;
  prompt: string;
  options: string[];
}

export interface TakeawayStep {
  type: "takeaway";
  id: string;
  title: string;
  points: string[];
  next: string;
}

export type LessonStep =
  | InfoStep
  | DragFillStep
  | PlaygroundStep
  | ChoiceStep
  | TakeawayStep;

export interface Lesson {
  id: string;
  title: string;
  xpReward: number;
  steps: LessonStep[];
}

// Jawaban yang dikirim ke backend
export type AnswerValue = string[] | number;

export interface AnswerResult {
  correct: boolean;
  correctAnswer: string;
  hearts: number;
}

export interface CompleteResult {
  xpGained: number;
  totalXp?: number;
  level?: number;
}