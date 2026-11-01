<p align="center">
  <img src="prism-factory/public/images/prism-mark-512-v2.png" width="80" alt="PRISM">
</p>

<h1 align="center">PRISM</h1>
<p align="center"><strong>Your business. Inside their AI.</strong></p>
<p align="center">A website becomes tools an agent can use and an experience a guest can recognise.</p>

<p align="center">
  <a href="https://prism.mvps.ch">Open PRISM</a> ·
  <a href="https://krafft.prism.mvps.ch/widget">Try the hotel app</a> ·
  <a href="https://krafft.prism.mvps.ch/mcp">MCP endpoint</a> ·
  <a href="docs/challenge-brief.md">Adobe challenge</a>
</p>

## Why we built it

When a customer asks an AI assistant to plan a stay, the assistant can become the place where they discover, compare and book. The hotel still provides the room. Its website, identity and relationship with the guest can disappear from the conversation.

PRISM gives the business a presence there: structured facts, explicit actions and its own branded interface. The owner starts with a website and chooses the experiences to support, without building a different integration for every assistant.

Built for **The Post-Website Business**, Adobe’s challenge at **BaselHack 2026**.

## The demo: Krafft Basel

Our active case is a hotel on Basel’s Rhine promenade. Try:

> Find a room for two adults under CHF 250 per night. Show me the total before reserving.

The prepared demo offers a **Double Room City at CHF 220 per night**. For two nights, the guest reviews **CHF 440**, confirms a synthetic reservation and saves an interest in local tips. Direct controls and agent tools share server-owned state; revisions protect against stale writes and retries return the same completed reservation.

**No real room is booked or charged.** Room names, branding and photographs come from the official hotel website. Prices, capacities, availability and reservations are simulated. This is an independent prototype, with no claimed hotel partnership. The pitch’s hotel-manager persona is fictional.

## How the factory works

1. **Read the website.** Extract bounded public content and identify the business and supported experiences.
2. **Choose the flows.** For a hotel: room discovery, reviewed demo reservations and guest guidance.
3. **Plan and review.** A planner proposes the implementation; an independent reviewer checks it; the planner revises it.
4. **Generate and verify.** Produce merchant TSX/CSS around a tested template, then run tests and a production build in isolated Docker.
5. **Connect a client.** Expose MCP tools and a branded MCP Apps interface, with setup packages for compatible hosts.

Generated source apps run locally. The public hotel demo is a separate template-based deployment with Neon persistence. Generating an app does not automatically publish or install it inside an assistant.

**Stack:** Next.js, TypeScript, React, MCP / MCP Apps, Neon, the Codex SDK, Vercel AI SDK and Vercel.

## Run the factory locally

Requirements: **Node.js 24+, pnpm, Docker**, a native Codex subscription login and `DATABASE_URL` in `prism-factory/.env.local`. The optional conversational rehearsal also needs AI Gateway authentication. Credentials are not included.

```bash
cd prism-factory
pnpm install --frozen-lockfile
pnpm db:migrate
pnpm dev --port 3040
```

In another terminal, from the same folder:

```bash
pnpm worker
```

Open **http://localhost:3040** and enter `https://www.krafftbasel.ch/en/`. See the [factory guide](prism-factory/README.md) for configuration and generated outputs.

## Repository map

| Component | Location |
| --- | --- |
| PRISM factory and retail/hotel templates | [`prism-factory/`](prism-factory/README.md) |
| Original Presence hospitality prototype | Repository root · [setup and architecture](docs/presence-guide.md) |
| Retained Galaxus reference app | [`galaxus-demo/`](galaxus-demo/README.md) |

Each application has its own dependencies and environment configuration. Installing packages at the repository root runs Presence, not the factory.

The standalone hotel app and current pitch are included in [PR #2](https://github.com/samuel-baumgartner/baselhack-2026/pull/2). Until it merges, the deployed hotel’s source is also available in [krafft-prism-app](https://github.com/ralfboltshauser/krafft-prism-app) to repository collaborators.

## What is verified, and what is next

The hotel flow has been exercised through domain/store tests, isolated production builds, public MCP checks, mobile browser checkout and a controlled official MCP Apps bridge. The factory’s URL-to-generated-source pipeline has also completed end to end.

Actual installation and rendering inside individual ChatGPT or other provider accounts remain unverified. Client capabilities differ: some support embedded interfaces, others only tools, and some have account or regional restrictions. [Provider capabilities and official sources →](docs/prism-platforms.md)

Live hotel inventory, real payments, automatic cross-platform discovery and background notifications remain future work. Guest interests currently use a saved, pull-based feed.

## More

[Challenge brief](docs/challenge-brief.md) · [Presence architecture](docs/architecture.md) · [Research sources](docs/sources.md)

[MIT](LICENSE) for original code and documentation. Third-party brands and photographs retain their respective ownership.
