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

type LocalStore = {
  currentUser: User | null;
  users: User[];
  generations: Generation[];
  assets: Asset[];
};

const storeKey = "assetforge.frontend-only";
const model = "FrontendMock-v1";

function emptyStore(): LocalStore {
  return {
    currentUser: null,
    users: [],
    generations: [],
    assets: []
  };
}

function readStore(): LocalStore {
  if (typeof window === "undefined") return emptyStore();

  const raw = window.localStorage.getItem(storeKey);
  if (!raw) return emptyStore();

  try {
    return JSON.parse(raw) as LocalStore;
  } catch {
    return emptyStore();
  }
}

function writeStore(store: LocalStore) {
  window.localStorage.setItem(storeKey, JSON.stringify(store));
}

function id(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function titleFromPrompt(prompt: string) {
  const words = prompt
    .replace(/[^\w\s-]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 5);

  return words.length ? words.map((word) => word[0]?.toUpperCase() + word.slice(1)).join(" ") : "Generated Asset";
}

function fakeImage(prompt: string) {
  const title = titleFromPrompt(prompt);
  const hue = Array.from(prompt).reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
  <rect width="960" height="540" fill="hsl(${hue}, 70%, 35%)" />
  <circle cx="190" cy="130" r="140" fill="hsl(${(hue + 80) % 360}, 75%, 58%)" opacity="0.7" />
  <circle cx="760" cy="420" r="190" fill="hsl(${(hue + 170) % 360}, 70%, 60%)" opacity="0.55" />
  <rect x="80" y="90" width="800" height="360" rx="24" fill="#020617" opacity="0.48" />
  <text x="120" y="220" fill="#f8fafc" font-family="Arial" font-size="48" font-weight="700">${title}</text>
  <text x="120" y="300" fill="#e2e8f0" font-family="Arial" font-size="24">${prompt}</text>
  <text x="120" y="390" fill="#cbd5e1" font-family="Arial" font-size="18">${model}</text>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function getCurrentUser() {
  return readStore().currentUser;
}

export function registerLocalUser(input: { name: string; email: string }) {
  const store = readStore();
  const existing = store.users.find((user) => user.email.toLowerCase() === input.email.toLowerCase());

  if (existing) {
    store.currentUser = existing;
    writeStore(store);
    return existing;
  }

  const user: User = {
    id: id("user"),
    name: input.name,
    email: input.email
  };

  store.users.push(user);
  store.currentUser = user;
  writeStore(store);
  return user;
}

export function loginLocalUser(input: { email: string }) {
  const store = readStore();
  const user =
    store.users.find((candidate) => candidate.email.toLowerCase() === input.email.toLowerCase()) ??
    registerLocalUser({ name: input.email.split("@")[0] || "Demo User", email: input.email });

  store.currentUser = user;
  writeStore(store);
  return user;
}

export function logoutLocalUser() {
  const store = readStore();
  store.currentUser = null;
  writeStore(store);
}

export function listLocalGenerations(userId: string) {
  return readStore().generations.filter((generation) => generation.userId === userId);
}

export function listLocalAssets(userId: string) {
  return readStore().assets.filter((asset) => asset.ownerId === userId);
}

export function createLocalGeneration(userId: string, prompt: string) {
  const store = readStore();
  const now = new Date().toISOString();
  const generationId = id("generation");
  const assetId = id("asset");

  const generation: Generation = {
    id: generationId,
    userId,
    assetId,
    prompt,
    status: "COMPLETED",
    model,
    error: null,
    createdAt: now,
    updatedAt: now,
    completedAt: now
  };

  const asset: Asset = {
    id: assetId,
    ownerId: userId,
    generationId,
    name: titleFromPrompt(prompt),
    prompt,
    status: "COMPLETED",
    imageUrl: fakeImage(prompt),
    model,
    createdAt: now,
    updatedAt: now
  };

  store.generations.unshift(generation);
  store.assets.unshift(asset);
  writeStore(store);

  return { generation, asset };
}

export function getLocalAsset(userId: string, assetId: string) {
  return readStore().assets.find((asset) => asset.id === assetId && asset.ownerId === userId) ?? null;
}

export function renameLocalAsset(userId: string, assetId: string, name: string) {
  const store = readStore();
  const asset = store.assets.find((candidate) => candidate.id === assetId && candidate.ownerId === userId);

  if (!asset) return null;

  asset.name = name;
  asset.updatedAt = new Date().toISOString();
  writeStore(store);
  return asset;
}

export function deleteLocalAsset(userId: string, assetId: string) {
  const store = readStore();
  store.assets = store.assets.filter((asset) => !(asset.id === assetId && asset.ownerId === userId));
  store.generations = store.generations.map((generation) =>
    generation.userId === userId && generation.assetId === assetId ? { ...generation, assetId: null } : generation
  );
  writeStore(store);
}

export function assetImageUrl(imageUrl: string) {
  return imageUrl;
}
