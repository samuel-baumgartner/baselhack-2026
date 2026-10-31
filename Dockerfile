FROM node:22-bookworm-slim AS dependencies
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM dependencies AS build
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Build placeholders are not runtime credentials.
ENV DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build APP_URL=http://127.0.0.1:3000 BETTER_AUTH_SECRET=build-placeholder-at-least-32-characters DEMO_PASSWORD=build-placeholder-password BUYER_API_KEY=build-placeholder-buyer-32-characters CALLBACK_SECRET=build-placeholder-callback-32-characters
RUN pnpm build

FROM node:22-bookworm-slim AS web
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000
COPY --from=build --chown=node:node /app/dist/next/standalone ./
COPY --from=build --chown=node:node /app/dist/next/static ./dist/next/static
USER node
EXPOSE 3000
CMD ["node","server.js"]
