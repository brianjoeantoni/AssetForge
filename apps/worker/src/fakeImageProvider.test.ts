import { describe, expect, it } from "vitest";
import { generateFakeImage } from "./fakeImageProvider.js";

describe("generateFakeImage", () => {
  it("generates deterministic SVG output for the same prompt", async () => {
    const first = await generateFakeImage("A futuristic sports car driving through Tokyo at night");
    const second = await generateFakeImage("A futuristic sports car driving through Tokyo at night");

    expect(first.seed).toBe(second.seed);
    expect(first.svg).toContain("<svg");
    expect(first.title).toBe("A Futuristic Sports Car Driving");
  });
});
