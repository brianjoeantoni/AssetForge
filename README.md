# AssetForge

AssetForge is a fullstack MVP for an authenticated AI asset-generation workflow. It uses a fake image-generation provider so the architecture can be practiced without external AI API keys.

## Stack

- Next.js, React, TypeScript, Tailwind CSS
- Express.js REST API
- PostgreSQL with Prisma
- MongoDB for flexible generation metadata
- Redis and BullMQ for background generation jobs
- HTTP-only JWT cookies
- Vitest and Supertest
- Docker Compose

## Local Setup

```bash
npm install
cp .env.example .env
docker compose up -d postgres mongo redis
npm run db:generate
npm run db:migrate
npm run dev
```

Open:

- Web: http://localhost:3000
- API: http://localhost:4000/health

## Docker Setup

```bash
docker compose up --build
```

The first full Docker run may require applying Prisma migrations from your host or a one-off container command:

```bash
npm run db:migrate
```

## Core Flow

1. Register or log in.
2. Submit a prompt from the dashboard.
3. The API creates a generation record and queues a BullMQ job.
4. The worker updates status, creates a fake SVG asset, writes flexible metadata to MongoDB, and marks the generation complete.
5. The dashboard polls recent generations and links to completed assets.

## Useful Scripts

```bash
npm run dev
npm run build
npm run test
npm run typecheck
npm run db:studio
```
