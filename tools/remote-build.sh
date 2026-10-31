#!/usr/bin/env bash
set -euo pipefail
export NEXT_TELEMETRY_DISABLED=1
# Install a job-private Node runtime from the official distribution if needed.
if ! command -v corepack >/dev/null; then
  case "$(uname -m)" in x86_64) arch=x64;; aarch64) arch=arm64;; *) exit 2;; esac
  node_release="node-v22.22.2-linux-$arch"
  curl --fail --silent --show-error --location "https://nodejs.org/dist/v22.22.2/$node_release.tar.xz" -o "$HOME/node.tar.xz"
  curl --fail --silent --show-error --location "https://nodejs.org/dist/v22.22.2/SHASUMS256.txt" -o "$HOME/node-shasums.txt"
  (cd "$HOME"; sed "s|$node_release.tar.xz|node.tar.xz|" node-shasums.txt | grep ' node.tar.xz$' | sha256sum -c -)
  tar -xJf "$HOME/node.tar.xz" -C "$HOME"
  export PATH="$HOME/$node_release/bin:$PATH"
fi
# Build placeholders only. Runtime credentials never leave the local host.
export DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build
export APP_URL=http://127.0.0.1:3000
export BETTER_AUTH_SECRET=build-only-placeholder-not-a-runtime-secret
export DEMO_PASSWORD=build-only-password-not-used-at-runtime
export BUYER_API_KEY=build-only-placeholder-buyer-key-not-a-secret
export CALLBACK_SECRET=build-only-placeholder-callback-not-a-secret
corepack pnpm install --frozen-lockfile
corepack pnpm build
mkdir -p "$REMOTE_OUTPUT_DIR/build"
cp -r dist/next/standalone/. "$REMOTE_OUTPUT_DIR/build/"
mkdir -p "$REMOTE_OUTPUT_DIR/build/dist/next"
cp -r dist/next/static "$REMOTE_OUTPUT_DIR/build/dist/next/static"

# The generated bootstrap is CommonJS, including when extracted inside an ESM repo.
cat > "$REMOTE_OUTPUT_DIR/build/package.json" <<'JSON'
{"private":true,"type":"commonjs"}
JSON
tar -czf "$REMOTE_OUTPUT_DIR/production.tar.gz" -C "$REMOTE_OUTPUT_DIR/build" .
