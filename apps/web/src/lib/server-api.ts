import { api } from "@/lib/http";

export async function getApiHealth() {
  const { data } = await api.get<{ ok: boolean; service: string }>("/health");
  return data;
}