# Krafft Basel standalone app verification

Public origin: https://krafft.prism.mvps.ch.

- Browser UI: `/widget`.
- ChatGPT / MCP Apps server: `/mcp`; no authentication for this synthetic demo.
- Stable resource: `ui://prism/stay.html`.
- Persistence: Neon `prism_krafft_sessions`, separate from the factory’s job/session table. Compare-and-swap revisions prevent stale writes; replay of the same completed booking operation returns the stored receipt.

## Passed

- Seven TypeScript domain/store/generated-view tests, including real Neon concurrent exact reservation retries, latest receipt and session isolation.
- TypeScript and optimized production Next.js build with pinned versions matching the previously tested factory template.
- Actual production HTTPS MCP room/date/guest/budget/view filters, four official room image assets and logo, stale/date validation, quote arithmetic, explicit synthetic booking, exact retry, latest receipt, guest interests, updates and isolation.
- Stable resource URI, every tool’s output descriptor, canonical HTTPS CSS/JS/image assets, CORS and declared resource CSP.
- Production browser at 390×844: CHF440 two-night quote → explicit synthetic receipt → follow local tips. Latest reservation and follow remained available after a full page reload. All initially shown official images loaded and no horizontal overflow was detected.

- Controlled official MCP Apps AppBridge at 390×844: public resource loaded all images, completed the CHF440 synthetic reservation, delivered two model-context updates, and produced no action errors or horizontal overflow.

A cross-origin controlled official AppBridge initially exposed a missing CORS header on MCP POST responses. `/mcp` now declares CORS along with widget assets; the final cross-origin browser journey and the repeatable HTTP CORS check both passed. Deployment: `dpl_Fxy6vEvWe9wWqyq1Wsw6SwKgpEM6`.

Run `node --import tsx scripts/verify-production.ts` for repeatable production protocol acceptance. `pnpm test` requires the private `.env.local` database configuration. Migrations are additive and run only via `scripts/migrate.ts`, never at request time.

## Limits

No real room is reserved or charged. Rates, availability, capacity and quotes are simulated. Official photographs/categories/branding are attributed to Krafft’s website; no partnership is asserted. Guest interests are saved pull preferences, not background notifications. A controlled protocol host is not proof of rendering/installation inside a real ChatGPT or Claude account; those native account flows remain unverified.
