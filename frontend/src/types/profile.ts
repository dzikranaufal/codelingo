export interface Profile {
  id: number;
  username: string;
  name: string;
  email: string;
  age: number;
  role: string;
  xp: number;
  level: number;
  lives: number;
  streak?: number;
}
