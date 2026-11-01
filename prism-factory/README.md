# PRISM factory

**A website becomes a branded experience inside an agent conversation.**

[Live interface](https://prism.mvps.ch) · [Project story](../README.md) · [Retail example](../galaxus-demo/README.md)

PRISM reads website metadata, lets an owner select capabilities, and prepares a retail MCP Apps experience. The factory manages build jobs; the output exposes tools and a visual storefront backed by server-owned shopping state.

## Build flow

1. Submit a business URL and review the extracted profile.
2. Select discovery, purchasing and/or updates. Purchasing requires discovery.
3. A Codex planner proposes a plan, a separate review checks it, and the planner revises it.
4. Generate validated configuration for the shared runtime.
5. The new source-building path copies `templates/retailer`, generates a merchant TSX view, CSS and README, and uses Docker to compile and run the result locally.

**v1 status:** the source-building worker is included as work in progress. Its complete generation-to-running-app path had not finished end-to-end validation when this snapshot was taken. The existing shared runtime and a newly generated local application are distinct outputs.

## Run locally

Requires Node.js 24+, pnpm, Docker and a host with an authenticated Codex CLI. The worker uses the Codex SDK with ChatGPT subscription authentication forced. It does not fall back to API billing.

Create an ignored `.env.local` with `DATABASE_URL` for the Neon-backed store. Preview chat uses Vercel AI Gateway and requires its own authentication; the worker's subscription login does not authenticate Gateway.

```bash
pnpm install --frozen-lockfile
pnpm db:migrate
pnpm dev --port 3040
```

In a second terminal, from this folder:

```bash
pnpm worker
```

Open **http://localhost:3040**. New builds need the worker running. The existing hosted configuration runtime runs separately from the local worker.

| Setting | Purpose |
| --- | --- |
| `DATABASE_URL` | Required database connection. |
| `PRISM_CHAT_MODEL` | Optional Gateway model override for preview chat. |
| `PRISM_BUILD_IMAGE` | Optional Docker build image; defaults to `node:24-bookworm`. |
| `PRISM_PREVIEW_HOST` | Optional hostname in generated preview URLs; defaults to `127.0.0.1`. |

## Outputs and boundaries

Configured outputs expose `/apps/<id>/mcp` and `/apps/<id>/widget` through the shared application. The local source builder has a separate source directory, build process and application port. It does not deploy a new Vercel project.

MCP Apps resources use the official App bridge. Host-style previews reuse `RetailView` and the server commerce functions. Free-form preview chat uses Vercel AI SDK through Gateway. Disabled capabilities are removed from the tool list and rejected server-side.

Galaxus products use captured images and frozen prices from 31 October 2026. Other brands currently reuse that labelled demo catalogue. Orders, inventory and payments are synthetic. Updates are a pull feed. Restaurant and hotel templates are not implemented here; the repository's separate Presence app covers hospitality.

Claude, Gemini and Grok previews are interactive visual demonstrations. They do not establish native integration. Native host rendering requires separate verification.

## Verification

```bash
pnpm test
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

For a configured hosted output:

```bash
CHECK_BASE=https://prism.mvps.ch CHECK_JOB=<published-job> pnpm exec tsx scripts/check.ts
```

The 10 existing tests passed for the v1 snapshot. This is not an end-to-end verification of the new source builder.

Build changes require the creator cookie. Job and shopping-session identifiers are bearer capabilities, not production customer authentication. Keep them, `.env.local`, native login stores and generated `.runs` out of public logs and commits.
