export interface LoginRequest {
  identifier: string; // email atau username
  password: string;
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface RegisterRequest {
  age: number;
  username: string;
  email: string;
  password: string;
}