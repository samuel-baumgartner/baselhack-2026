# Krafft hotel starter verification

Verified locally on 1 November 2026. This is an unofficial research-based prototype. No connection to a hotel booking, payment, inventory or messaging service exists.

## Evidence and scope

Official sources are https://www.krafftbasel.ch/en/, https://www.krafftbasel.ch/en/rooms/, https://www.krafftbasel.ch/en/rooms/city-rooms/ and https://www.krafftbasel.ch/en/rooms/river-rooms/. The catalogue manifest records source URLs for the actual hotel logo and each room photograph. Assets are unmodified copies of publicly served official assets. Public availability of an image is not a separate licence grant; this is a local demonstration.

Room category names and address come from the official pages. Rates, occupancies and room inventory are synthetic demonstration values. Quoted totals are nightly demo rate times nights; they are not real hotel tax-inclusive offers. Inventory is bounded within each demo session only. Saved local-tip and arrival interests are durable preferences, with a pull feed and no background messages. The English rooms page says check-out at “12 a.m.” ambiguously; the UI asks the guest to confirm the actual time with the hotel.

## Automated checks

- Seven tests cover calendar and past-date rejection, stay length and guests, nightly budget/view filtering, quote arithmetic, confirmation, stale-write prevention, retry idempotency, sequential reservations and latest retrieval, session ownership, durable file-store serialization, saved interests and rendering the actual hotel view.
- Widget bundling, TypeScript and the optimized Next.js production build pass in an isolated Node 24 container with network disabled.
- A real Streamable HTTP MCP client verifies selected tool registration, room filtering, image responses, canonical state, invalid calendar/stale-revision errors, quote totals, reservation retry identity, latest reservation lookup, saved preferences, resource JS/CSS assets and session isolation.
- Chromium at 390 × 844 exercises date entry, budget filtering, actual photos, quote review, explicit demo reservation, saved local tips and reload persistence. Catalogue, quote and updates were checked for horizontal overflow.

The local file store is designed for one process and a persistent directory. It does not support distributed writers or Vercel's ephemeral filesystem. The factory's separate public service must provide its own persistent store.

ChatGPT, Claude and other provider-host embedded behavior has not been tested by this template's local verification. Local browser and protocol checks do not establish compatibility with every consumer host.
