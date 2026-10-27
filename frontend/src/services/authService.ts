import api from "./api";
import type { LoginRequest, LoginResponse, RegisterRequest } from "../types/auth";

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const res = await api.post<LoginResponse>("/auth/login", payload);
  return res.data;
}

export async function register(payload: RegisterRequest): Promise<LoginResponse> {
  const res = await api.post<LoginResponse>("/auth/register", payload);
  return res.data;
}