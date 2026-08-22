import { createHash } from "node:crypto";

export type FakeImageResult = {
  svg: string;
  seed: string;
  palette: string[];
  title: string;
};

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function titleFromPrompt(prompt: string) {
  const words = prompt
    .replace(/[^\w\s-]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 5);

  if (words.length === 0) {
    return "Generated Asset";
  }

  return words.map((word) => word[0]?.toUpperCase() + word.slice(1)).join(" ");
}

function colorFromHash(hash: string, offset: number) {
  return `#${hash.slice(offset, offset + 6)}`;
}

export async function generateFakeImage(prompt: string): Promise<FakeImageResult> {
  const seed = createHash("sha256").update(prompt).digest("hex");
  const palette = [colorFromHash(seed, 0), colorFromHash(seed, 6), colorFromHash(seed, 12)];
  const title = titleFromPrompt(prompt);
  const escapedTitle = escapeXml(title);
  const escapedPrompt = escapeXml(prompt);

  const circles = Array.from({ length: 9 }, (_, index) => {
    const x = Number.parseInt(seed.slice(index * 2, index * 2 + 2), 16) % 960;
    const y = Number.parseInt(seed.slice(index * 2 + 18, index * 2 + 20), 16) % 540;
    const r = 36 + (Number.parseInt(seed.slice(index * 2 + 36, index * 2 + 38), 16) % 110);
    const color = palette[index % palette.length];
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" opacity="0.32" />`;
  }).join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540" role="img" aria-label="${escapedTitle}">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="${palette[0]}" />
      <stop offset="55%" stop-color="#111827" />
      <stop offset="100%" stop-color="${palette[1]}" />
    </linearGradient>
    <filter id="soft">
      <feGaussianBlur stdDeviation="18" />
    </filter>
  </defs>
  <rect width="960" height="540" fill="url(#bg)" />
  <g filter="url(#soft)">${circles}</g>
  <path d="M0 420 C190 360 320 500 520 430 C720 360 820 410 960 350 L960 540 L0 540 Z" fill="${palette[2]}" opacity="0.45" />
  <rect x="64" y="70" width="832" height="400" rx="22" fill="#020617" opacity="0.34" />
  <text x="96" y="170" fill="#F8FAFC" font-family="Inter, Arial, sans-serif" font-size="46" font-weight="700">${escapedTitle}</text>
  <foreignObject x="96" y="210" width="768" height="160">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Inter, Arial, sans-serif; color: #E5E7EB; font-size: 24px; line-height: 1.35;">
      ${escapedPrompt}
    </div>
  </foreignObject>
  <text x="96" y="420" fill="#CBD5E1" font-family="Inter, Arial, sans-serif" font-size="18">FakeImageGen-v1 • seed ${seed.slice(0, 10)}</text>
</svg>`;

  return { svg, seed, palette, title };
}
