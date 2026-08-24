import { api } from "@/lib/http";

export type ApiHealth = {
  ok: boolean;
  service: string;
};

export type ApiUser = {
  id: string;
  name: string;
  email: string;
  created_at: string;
};

export type ApiAsset = {
  id: string;
  owner_id: string;
  name: string;
  prompt: string;
  status: string;
  image_url: string;
  model: string;
  created_at: string;
  updated_at: string;
};

export type CreateUserInput = {
  name: string;
  email: string;
};

export type CreateAssetInput = {
  prompt: string;
};

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type UpdateUserInput = {
  id: string;
  name: string;
  email: string;
};

export async function getApiHealth() {
  const { data } = await api.get<ApiHealth>("/health");
  return data;
}

export async function getUsers() {
  const { data } = await api.get<ApiUser[]>("/users");
  return data;
}

export async function createUser(input: CreateUserInput) {
  const { data } = await api.post<ApiUser>("/users", input);
  return data;
}

export async function getAssets() {
  const { data } = await api.get<ApiAsset[]>("/assets");
  return data;
}

export async function getAsset(id: string) {
  const { data } = await api.get<ApiAsset>(`/assets/${id}`);
  return data;
}

export async function createAsset(input: CreateAssetInput) {
  const { data } = await api.post<ApiAsset>("/assets", input);
  return data;
}

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

export async function updateUser(input: UpdateUserInput) {
  const { data } = await api.patch<ApiUser>(`/users/${input.id}`, {
    name: input.name,
    email: input.email,
  });
  return data;
}

export async function deleteUser(id: string) {
  await api.delete(`/users/${id}`);
}
