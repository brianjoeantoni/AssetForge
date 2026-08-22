FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/queue/package.json packages/queue/package.json
RUN npm ci

COPY . .
RUN npm run build -w @assetforge/web

EXPOSE 3000
CMD ["npm", "run", "start", "-w", "@assetforge/web"]
