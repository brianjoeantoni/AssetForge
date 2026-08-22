import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@assetforge/db";
import { createApp } from "./app.js";

const queue = {
  add: vi.fn(async () => ({ id: "job-1" }))
};

const app = createApp({ queue, skipMongo: true });

beforeEach(async () => {
  queue.add.mockClear();
  await prisma.asset.deleteMany();
  await prisma.generation.deleteMany();
  await prisma.user.deleteMany();
});

async function register(email: string) {
  const response = await request(app).post("/auth/register").send({
    name: "Test User",
    email,
    password: "password123"
  });

  return response.headers["set-cookie"];
}

describe("auth", () => {
  it("registers a user and returns the current account from the cookie", async () => {
    const cookies = await register("test@example.com");

    const response = await request(app).get("/auth/me").set("Cookie", cookies).expect(200);

    expect(response.body.user.email).toBe("test@example.com");
    expect(response.body.user.passwordHash).toBeUndefined();
  });
});

describe("generations", () => {
  it("creates a generation and queues a background job", async () => {
    const cookies = await register("creator@example.com");

    const response = await request(app)
      .post("/generations")
      .set("Cookie", cookies)
      .send({ prompt: "A futuristic sports car driving through Tokyo at night" })
      .expect(202);

    expect(response.body.generation.status).toBe("QUEUED");
    expect(queue.add).toHaveBeenCalledOnce();
  });
});

describe("asset ownership", () => {
  it("prevents one user from reading another user's asset", async () => {
    const ownerCookies = await register("owner@example.com");
    const otherCookies = await register("other@example.com");

    const ownerResponse = await request(app).get("/auth/me").set("Cookie", ownerCookies).expect(200);
    const asset = await prisma.asset.create({
      data: {
        ownerId: ownerResponse.body.user.id,
        name: "Private asset",
        prompt: "private prompt",
        imageUrl: "/uploads/assets/private.svg"
      }
    });

    await request(app).get(`/assets/${asset.id}`).set("Cookie", otherCookies).expect(404);
  });
});
