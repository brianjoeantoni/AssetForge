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

export type ApiAssetStatus = "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";

export type ApiAsset = {
  id: string;
  owner_id: string;
  name: string;
  prompt: string;
  status: ApiAssetStatus | string;
  image_url: string;
  model: string;
  created_at: string;
  updated_at: string;
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

export type CreateUserInput = {
  name: string;
  email: string;
};

export type UpdateUserInput = {
  id: string;
  name: string;
  email: string;
};

export type CreateAssetInput = {
  prompt: string;
};

export type UpdateAssetInput = {
  id: string;
  name: string;
};
