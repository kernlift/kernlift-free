FROM node:24-bookworm-slim AS build
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.28.1 --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY tsconfig.json vite.config.ts ./
COPY src ./src
COPY public ./public
RUN pnpm build

FROM node:24-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000 DATABASE_PATH=/app/data/free.db
RUN install -d -m 0700 -o node -g node /app/data
COPY --from=build /app/.output ./.output
COPY scripts/admin.mjs ./scripts/admin.mjs
USER node
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
