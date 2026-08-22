# AssetForge Learning Branch

This branch is the frontend-only baseline for learning backend concepts from scratch.

The complete fullstack MVP still exists on the `main` branch. This branch intentionally removes:

- Express API
- PostgreSQL/Prisma
- MongoDB/Mongoose
- Redis/BullMQ
- Worker process
- Docker Compose

The current app uses browser `localStorage` as temporary mock persistence. We will add backend pieces back one layer at a time.

## Current Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn-style local UI components

## Local Setup

```bash
npm install
npm run dev
```

Open:

```txt
http://localhost:3000
```

## Useful Scripts

```bash
npm run dev
npm run build
npm run typecheck
```
