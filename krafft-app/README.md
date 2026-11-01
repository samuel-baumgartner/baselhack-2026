# Krafft Basel × PRISM

Standalone hotel MCP Apps demo. Public origin: https://krafft.prism.mvps.ch. MCP: `/mcp`; browser: `/widget`.

Official Krafft room categories, logo and photographs support room discovery, dates/guests/budget/view filters, reviewed quotes, explicit synthetic reservations, latest receipt lookup and saved guest interests. All room rates, capacities, availability and reservations are demo data; nothing is charged and no real room is booked. No official Krafft partnership is claimed.

This deployment uses Neon durable sessions with optimistic revision writes. Exact reservation retries are idempotent. Schema is prepared by `node --env-file=.env.local --import tsx scripts/migrate.ts`. The local file-session template is not deployed to Vercel.

Set `DATABASE_URL` privately and `NEXT_PUBLIC_APP_ORIGIN` to the public origin. Run `pnpm install`, `pnpm test`, `pnpm build`, then `pnpm start`. Credentials are excluded from version control.

This app supplies MCP tool results and a stable MCP Apps HTML resource. Protocol/controlled host verification does not establish installation/rendering inside a real ChatGPT account.
