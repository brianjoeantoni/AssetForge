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

export type CreateUserInput = {
  name: string;
  email: string;
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
