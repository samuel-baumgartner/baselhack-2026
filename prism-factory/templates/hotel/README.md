# Krafft Basel local hotel prototype

This standalone Next.js MCP Apps starter offers hotel room discovery, date/guest/budget filters, explicit synthetic reservation quotes, retry-safe no-charge reservations, and saved local-tip interests. It uses real hotel category names, logo and photos from the official website; all rates, capacity values, inventory and availability are demonstration data.

Run `pnpm install`, `pnpm build`, `pnpm start`. Set `NEXT_PUBLIC_APP_ORIGIN` at build time when serving a different origin; default http://localhost:3000. MCP endpoint: `/mcp`; browser widget: `/widget`. ChatGPT remote connections require a public HTTPS deployment; a private local HTTP app is not directly connectable from ChatGPT's servers.

Sessions are atomically saved under `.data/sessions` and survive process/container restarts. This file store is for one local app process, not distributed production or Vercel's ephemeral filesystem. No payment, real booking, room service or background notification is performed. Consult the hotel directly for real policies; the official English checkout time is ambiguous and intentionally not restated as a confirmed time.
