# Galaxus / PRISM MCP Apps demo

Next.js application built from vercel-labs/mcp-apps-nextjs-starter commit `adca42ccaeda3c34a322808b51f70200f14e3c89`. The original research notes are excluded from this release.

- Setup: https://galaxus.prism.mvps.ch
- Browser preview: https://galaxus.prism.mvps.ch/widget
- MCP: https://galaxus.prism.mvps.ch/mcp

`pnpm install --frozen-lockfile`, `pnpm dev`, `pnpm test`, `pnpm lint`, `pnpm build`.
Copy database credentials into an ignored `.env.local` through `vercel env pull`, never into source. `pnpm db:migrate` creates the two dedicated tables and persists the frozen catalogue/editions; it does not change existing external tables. DATABASE_URL is mandatory; no ephemeral fallback.

`node scripts/verify-production.mjs` tests production with the maintained MCP SDK. It creates synthetic test sessions/orders only. Set TEST_ORIGIN to verify another deployment.

Private operator publish control: `pnpm exec tsx scripts/publish-demo-update.ts <session-capability>` with local DB credentials. It publishes a clearly synthetic check-in edition to that session; refresh the pull feed. It sends no webhook or host wakeup. Keep capabilities out of shared logs.

Server authority: lib/shopping.ts is deterministic domain logic; lib/db.ts persists each synthetic session using atomic compare-and-swap. The frozen catalogue is compiled from data/galaxus-products.json and also stored as an audit snapshot in prism_demo_catalog. Integer CHF cents, explicit revisions and idempotent order operation IDs are shared by model and UI through the same 12 MCP tools. No second model/LLM, live scraping, payments, Galaxus login or real order API.

Session identity is a 256-bit random bearer capability issued on search_products, not a caller-chosen customer ID. Reuse it across turns. Browser localStorage remembers only this capability, not authoritative commerce state. Anyone holding it can access that synthetic session. No OAuth or production customer authentication; use only synthetic data. Two independent capabilities isolate session state. Inventory is simulated per session, not a real shared Galaxus stock pool.

Transport, iframe bootstrap, absolute assets, App bridge listener ordering and resource self-fetch come from the starter. Modified hook recomputes connection truth and guards initialization; UI tool calls explicitly apply returned snapshots. The browser preview uses the maintained MCP client against /mcp, without a duplicate REST shopping API.

Local verification captures and research notes are excluded from this release. Native host rendering must be verified separately from transport and domain tests.
