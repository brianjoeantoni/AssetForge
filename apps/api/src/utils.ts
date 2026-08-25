export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export function titleFromPrompt(prompt: string) {
  const title = prompt
    .replace(/[^\w\s-]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 5)
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");

  return title || "Generated Asset";
}

export function fakeImageUrl(title: string) {
  return `https://placehold.co/960x540?text=${encodeURIComponent(title)}`;
}
