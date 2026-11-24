export interface QuestItem {
  id: string;
  title: string;
  progress: number;
  target: number;
  reward_gems: number;
  completed: boolean;
  claimed: boolean;
}

export interface QuestResponse {
  quests: QuestItem[];
  gems: number;
  resets_at: string;
}
