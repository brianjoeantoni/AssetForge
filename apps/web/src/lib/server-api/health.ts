import { api } from "@/lib/http";
import type { ApiHealth } from "./types";

export async function getApiHealth() {
  const { data } = await api.get<ApiHealth>("/health");
  return data;
}
