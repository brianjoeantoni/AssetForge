export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type User = {
  id: string;
  name: string;
  email: string;
};

export type GenerationStatus = "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";

export type Generation = {
  id: string;
  userId: string;
  assetId: string | null;
  prompt: string;
  status: GenerationStatus;
  model: string;
  error: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};

export type Asset = {
  id: string;
  ownerId: string;
  generationId: string | null;
  name: string;
  prompt: string;
  status: GenerationStatus;
  imageUrl: string;
  model: string;
  createdAt: string;
  updatedAt: string;
};

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init.headers
    }
  });

  if (!response.ok) {
    let message = `Request failed with ${response.status}`;
    try {
      const body = (await response.json()) as { error?: string };
      message = body.error ?? message;
    } catch {
      // Keep the status-based message when the response is not JSON.
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function assetImageUrl(imageUrl: string) {
  return imageUrl.startsWith("http") ? imageUrl : `${API_URL}${imageUrl}`;
}
