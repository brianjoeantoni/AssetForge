import { api } from "@/lib/http";
import type { ApiUser, CreateUserInput, UpdateUserInput } from "./types";

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
