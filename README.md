# AssetForge

AssetForge is a full-stack learning project for an AI asset generation MVP.

The app demonstrates a production-style flow at small scale:

```txt
Frontend prompt submission
  -> Express API creates a queued asset in Postgres
  -> API enqueues a BullMQ job in Redis
  -> Worker processes the job
  -> Worker updates Postgres asset status
  -> Worker writes flexible generation metadata to MongoDB
  -> Frontend polls and displays the completed asset/metadata
```

## Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn-style UI components
- Express
- PostgreSQL
- Prisma
- Redis
- BullMQ
- MongoDB
- Mongoose
- Docker Compose

## Repository Shape

```txt
apps/
  api/  -> Express API, Prisma/Postgres access, BullMQ worker, Mongo metadata
  web/  -> Next.js frontend
```

## Local Services

Docker Compose runs the local databases and queue broker:

```txt
Postgres -> localhost:5432
Redis    -> localhost:6379
MongoDB  -> localhost:27017
```

Start them with:

```bash
docker compose up -d postgres redis mongo
```

## Local Setup

Install dependencies:

```bash
npm install
```

Run database migration:

```bash
npm run db:migrate -w @assetforge/api
```

Start the full app:

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

API:

```txt
http://localhost:4000
```

## Useful Scripts

```bash
npm run dev
npm run build
npm run typecheck
npm run dev -w @assetforge/api
npm run dev:worker -w @assetforge/api
npm run dev -w @assetforge/web
npm run db:migrate -w @assetforge/api
```

## Main Features

- Register, login, logout
- HTTP-only cookie JWT auth
- Protected frontend routes
- Protected backend routes
- Asset creation and library
- Asset detail, rename, and delete
- Async asset generation with Redis/BullMQ
- Worker-driven status updates
- MongoDB generation metadata
- Frontend polling for queued/processing assets

## Data Stores

PostgreSQL is the source of truth for stable relational data:

```txt
users
assets
asset ownership
asset status
```

Redis is used for temporary queue coordination:

```txt
BullMQ waiting/active/completed/failed jobs
```

MongoDB stores flexible generation metadata:

```txt
generation parameters
timings
provider/model information
raw provider response
```

## Development Note

Next.js may rewrite `apps/web/next-env.d.ts` differently during `npm run dev` and `npm run build`.
Before committing, stop the dev server and run:

```bash
npm run build
git status
```
