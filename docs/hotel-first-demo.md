# Hotel-first PRISM demonstration

The active BaselHack case is Krafft Basel, a hotel and restaurant on the Rhine. The implemented booking flow is for **hotel stays**, not restaurant tables. Maxus is a fictional hotel-manager persona. No actual hotel management role, partnership or claim about its internal technology team is implied.

## Live surfaces

- Factory: https://prism.mvps.ch
- Standalone hotel browser: https://krafft.prism.mvps.ch/widget
- Standalone hotel MCP: https://krafft.prism.mvps.ch/mcp
- Pitch: `pitch/index.html`, served on Ralf’s Tailscale host at http://100.98.187.105:8010/
- Rehearsal: [`pitch/demo-script.md`](../pitch/demo-script.md)

Factory deployment: `dpl_HHdFojPx6BC61Kzeeoej2LstqtxJ`.
Hotel deployment: `dpl_Fxy6vEvWe9wWqyq1Wsw6SwKgpEM6`.

## Scope of the switch

The PRISM homepage, example shortcut, ready workspace, header link, metadata, workflow selection copy and downloadable overview now feature the hotel. Existing retail templates and previous outputs are retained. The active pitch uses guests, rooms, hotel comparisons and Krafft branding; its frozen V1 remains an unchanged archive. The BCG statistic stays labelled as retailer research, not a hotel survey.

`krafft-app/` is a standalone deployed hotel application with its own durable Neon sessions, independent of factory job availability. The factory’s `/apps/<job>/mcp` is still a separate configured-template runtime; the source factory’s generated app runs locally in Docker. Their session stores are distinct.

## Verification

- Factory: 19 tests, TypeScript, lint and production build passed. Production desktop/mobile landing and ready hotel workspace have loaded official branding/photos, working hotel links and no visible Galaxus showcase or horizontal overflow.
- Hotel app: seven tests, TypeScript and production build passed. Production HTTPS MCP checks cover ten tools, real image assets, date/guest/budget/view filters, stale/date rejection, quote arithmetic, explicit synthetic reservations, exact retry, latest receipt, preferences and isolation. A dedicated concurrency test exercises Neon booking retries.
- At 390px, both the public browser app and official cross-origin MCP Apps AppBridge completed a CHF440 two-night city-room synthetic reservation. Context updates, images and layout passed. A real CORS gap on MCP POST responses was found, fixed and retested. Latest reservation and preferences survived reload.
- Evidence and reproducible commands are in [`krafft-app/VERIFICATION.md`](../krafft-app/VERIFICATION.md).

Actual installation/rendering inside a personal ChatGPT account remains unverified. Protocol/controlled-host checks do not establish account eligibility, host caching or native assistant behavior. Rates, capacities, availability, quotes and reservations are simulated. No real room is booked or charged. Guest interests are pull-based; background push is not implemented.
