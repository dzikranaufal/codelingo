export interface MissionItem {
  id: string;
  title: string;
  current: number;
  target: number;
  completed: boolean;
}
export interface MissionsResponse {
  missions: MissionItem[];
  reset_at: string;
  timezone: string;
}
