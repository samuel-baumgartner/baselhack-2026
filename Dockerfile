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
RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-venv libgomp1 \
    && rm -rf /var/lib/apt/lists/* \
    && python3 -m venv /opt/presence-speech/venv \
    && /opt/presence-speech/venv/bin/pip install --no-cache-dir faster-whisper==1.2.1 av==16.0.1 \
    && /opt/presence-speech/venv/bin/python -c "from huggingface_hub import snapshot_download; snapshot_download('Systran/faster-whisper-tiny.en', local_dir='/opt/presence-speech/model', allow_patterns=['config.json','model.bin','tokenizer.json','vocabulary.*'])"
ENV SPEECH_PYTHON=/opt/presence-speech/venv/bin/python SPEECH_MODEL_PATH=/opt/presence-speech/model
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000
COPY --from=build --chown=node:node /app/dist/next/standalone ./
COPY --from=build --chown=node:node /app/dist/next/static ./dist/next/static
USER node
EXPOSE 3000
CMD ["node","server.js"]
