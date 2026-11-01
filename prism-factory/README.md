> v1 snapshot: the local source-building worker and `templates/retailer` are under active development. End-to-end validation of this new path was incomplete when copied. The configuration-runtime description below documents the preceding implementation; it is not a verification claim for the new code-building path. Docker is needed for the new worker build path. Run commands from this folder.

# PRISM factory

Live: https://prism.mvps.ch

A website becomes a configured, branded MCP Apps experience. This project is the factory; the earlier https://galaxus.prism.mvps.ch output stays in its own project.

## Run

Node 24+, pnpm. Configure `DATABASE_URL` in `.env.local`. Vercel AI Gateway uses the project's OIDC authentication; local development needs a fresh token from `vercel env pull`. No key is shipped to the browser.

```sh
pnpm install
pnpm db:migrate
pnpm dev --port 3040
pnpm worker
```

The worker uses the official Codex SDK with ChatGPT subscription auth forced, the shell tool disabled and a read-only sandbox and a curated environment without API credentials. Native auth must already exist on the trusted host. It analyzes bounded website metadata, plans, gets one independent review, resumes the original planner to revise and generates schema-validated configuration. It does not run generated shell code or automatically choose a billing fallback.

On this machine, `prism-factory-worker.service` is enabled as a user service:

```sh
systemctl --user status prism-factory-worker
systemctl --user restart prism-factory-worker
journalctl --user -u prism-factory-worker -n 30
```

Keep this machine awake/networked for new builds. Published outputs, shopping and chat run on Vercel/Neon independently of the worker.

## Published outputs

Each successful job has a configuration SHA-256, ordered durable events and actual checks. It publishes `/apps/<id>/mcp` and `/apps/<id>/widget` on a shared, already-deployed runtime. A job does **not** deploy a new Vercel project or generate arbitrary application source. This is the template/configuration implementation recommended in the plan review, with an explicit boundary instead of simulated deploy logs.

MCP Apps resources serve a standalone bundled React widget using the official App bridge. PRISM's host-like previews render the same RetailView component and call the same server-owned commerce functions. AI SDK + OpenAI through Gateway drives free-form conversational tool calls.

Select discovery, purchasing and/or updates; disabled capabilities are absent from the generated MCP tool list and rejected server-side. Purchasing depends on discovery. Brand name, accent and generated copy are configuration. Galaxus uses real captured product images and frozen prices from 31 October 2026. Other retailers can use their own brand configuration but currently get this clearly labeled demo catalog; restaurant/hotel output templates are not implemented.

Orders, inventory and payment are synthetic. Updates are a working pull feed, not proactive host wakeups. Claude, Gemini and Grok are interactive visual previews of the shared runtime, not native integrations. Actual ChatGPT host connection is unverified; MCP transport and executable resource checks alone do not prove host rendering.

Build creation is bounded to eight/hour/browser and fifty/day globally. Build changes require the creator cookie. Job IDs and shopping session IDs are unguessable bearer capabilities; this is a private-demo access model, not production customer identity.

## Verification

```sh
pnpm test
pnpm lint
pnpm exec tsc --noEmit
pnpm build
CHECK_BASE=https://prism.mvps.ch CHECK_JOB=<published-job> pnpm exec tsx scripts/check.ts
```

Local verification captures and working notes are excluded from this release. Never commit `.env.local`, native login stores or deployment credentials.
