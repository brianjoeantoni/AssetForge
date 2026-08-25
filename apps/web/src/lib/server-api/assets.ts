import { api } from "@/lib/http";
import type { ApiAsset, CreateAssetInput, UpdateAssetInput } from "./types";

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

export async function updateAsset(input: UpdateAssetInput) {
  await api.patch(`/assets/${input.id}`, {
    name: input.name,
  });
}

export async function deleteAsset(id: string) {
  await api.delete(`/assets/${id}`);
}
