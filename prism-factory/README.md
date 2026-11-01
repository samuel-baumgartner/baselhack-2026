# PRISM factory

PRISM accepts a retailer or hotel website URL, recommends supported flows, plans/reviews the implementation, generates merchant React/CSS source, builds a separate Next.js application and starts it locally. The deployed factory is https://prism.mvps.ch. Its original reference output is https://galaxus.prism.mvps.ch.

## Run locally

Requirements: Node 24+, pnpm, Docker, a native Codex ChatGPT subscription login, and `DATABASE_URL` in `.env.local` for the factory's Neon job database. No API-billing fallback is enabled for the builder. Preview chat in the optional host-style shells uses Vercel AI Gateway separately.

```sh
pnpm install
pnpm db:migrate
docker pull node:24-bookworm
pnpm dev --hostname 0.0.0.0 --port 3040
# Another terminal; set this to the host reachable from your browser:
PRISM_PREVIEW_HOST=127.0.0.1 pnpm worker
```

The local factory is http://127.0.0.1:3040. On this host it also runs through Tailscale at http://100.98.187.105:3040. Generated outputs use free ports 3200–3299.

Two enabled user services keep the local interface and worker running:

```sh
systemctl --user status prism-factory-web prism-factory-worker
journalctl --user -u prism-factory-worker -n 30
```

Keep this machine awake/networked for builds and local outputs. Docker output containers restart unless explicitly stopped.

## What a build actually does

1. Fetch bounded public website metadata/text. The native agent classifies the company and recommends discovery, purchasing and/or updates. Galaxus and Krafft Basel have prepared research fallbacks if scraping is blocked. Retail and hotel templates are implemented; restaurants/services fail explicitly.
2. Save the user's selected flows. Purchasing includes discovery.
3. Create a planner thread, run one independent review, and resume the original planner to revise its plan.
4. Copy the versioned `templates/retailer` or `templates/hotel` source into `.runs/<job>/source`. The template content hash is recorded.
5. Resume the planner to generate **actual TSX, CSS and README source files**. The trusted controller writes only those three allowed paths. The agent does not get a host shell or deployment credentials. Protocol, persistence and domain logic remain shared template code.
6. Validate source imports and CSS boundaries. Build in Docker with no network, no credentials, resource limits, only the job source mounted writable and dependencies mounted read-only. TypeScript, domain/store tests, a real generated-component render test and a production Next build must pass. A bounded repair attempt gets real compiler/test feedback.
7. Start an independent Docker app and test its MCP tools, selected capabilities, widget assets, student filtering or room/date/guest filters, synthetic order/reservation replay and latest receipt, preferences and session isolation.
8. Save the source hash, checks, output directory, container, local widget URL and MCP endpoint. Only then mark ready. Cancellation/failure cleans up unpublished output containers.

The SDK emits structured source files; it does not execute arbitrary agent-proposed shell commands. Native subscription credentials stay in the controller's normal host auth store and are not copied into source or Docker.

## Outputs and limitations

A successful source job has `generatedApp` metadata and an **Open built app** link. Its local MCP endpoint is `http://<preview-host>:<port>/mcp`. ChatGPT's remote service cannot connect directly to this private HTTP URL: a public HTTPS deployment is a separate, unimplemented publishing step for source outputs. Existing `/apps/<id>/mcp` routes remain the shared configuration-runtime previews; they are not the independently generated source output.

The generated app stores synthetic sessions atomically in its own `.data/sessions` directory on the mounted job workspace. State survives container restarts. This local file store is not suitable for Vercel's ephemeral filesystem or a multi-replica production deployment; production publishing should use the existing Neon persistence adapter.

Generation currently customizes an introduction/quick actions around a tested retail or hotel template. It does not invent new domain capabilities, scrape a complete live product catalogue or synthesize arbitrary websites. Other retailers can use their name/accent but still receive the clearly labelled prepared Galaxus demo catalogue. Hotels use the researched Krafft Basel room catalogue, logo and official photographs; nightly rates, availability and reservations are explicitly synthetic. Restaurant templates are not implemented. Prices are frozen snapshots; stock, orders and shipping are synthetic. Updates are pull-based. The native-provider connection artifacts and limitations are documented in [platform research](../docs/prism-platforms.md). ChatGPT, Claude, Cursor, VS Code Copilot and experimental Goose can use the MCP Apps resource protocol; Perplexity and Mistral are tools-only. Gemini is a restricted US preview. Grok remains visual-only: no consumer custom-app installation is claimed. Provider account-level behavior remains unverified.

## Verification

```sh
pnpm test
pnpm lint
pnpm exec tsc --noEmit
pnpm build
pnpm exec tsx scripts/verify-generated-render.ts
```

The generated app's own tests/build output and source manifest are in `.runs/<job>/`. Factory verification reports are in `docs/verification/`. Never commit `.env.local`, native login stores or generated shopping-session capabilities.

## Krafft Basel example

Paste `https://www.krafftbasel.ch/en/` and select room discovery, demo reservation and guest updates. The verified source build is recorded in `docs/verification/hotel-factory.json`. Its public configured runtime uses Neon and is reachable at `https://prism.mvps.ch/apps/62d9b46320cf841b120e5f35fea685a9694486df/mcp`. This public endpoint runs the shared hotel template, while **Open built app** opens the separate locally generated source application. These have separate session stores.

Provider setup offers downloadable Cursor JSON, VS Code JSON, Goose YAML and cloud-provider instructions. Connectors are not automatically installed or approved inside personal accounts.
