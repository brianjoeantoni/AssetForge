import { api } from "@/lib/http";
import type { ApiUser, LoginInput, RegisterInput } from "./types";

export async function register(input: RegisterInput) {
  const { data } = await api.post<ApiUser>("/auth/register", input);
  return data;
}

export async function login(input: LoginInput) {
  const { data } = await api.post<ApiUser>("/auth/login", input);
  return data;
}

export async function getCurrentUser() {
  const { data } = await api.get<ApiUser>("/auth/me");
  return data;
}

export async function logout() {
  await api.post("/auth/logout");
}
