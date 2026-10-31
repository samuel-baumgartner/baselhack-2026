# Presence — BaselHack 2026

**Your next customer is an agent. Your business should be ready.**

A working, local Next.js application for Adobe’s _The Post-Website Business_ challenge. Tailwind v4 and shadcn/ui power a presentation interface with three chapters:

1. **Publish:** fetch a website, extract source-backed facts with Codex, review missing policies, then publish a versioned human page, business JSON, OpenAPI contract and MCP tools.
2. **Book:** the buyer reads the public merchant API and requests an offer. Resend emails the owner. An email reply or authenticated dashboard reply becomes a proposal; owner approval publishes exact terms, a signed callback resumes the buyer, and explicit traveller approval reserves fictional inventory.
3. **Reconnect:** the traveller explicitly subscribes to a category, frequency and expiry. An owner event sends a signed callback; Codex evaluates relevance before suggesting a return. Revocation, expiry, category mismatch and the monthly limit suppress delivery.

The default stage source is the real [Hotel Rheinfelderhof website](https://www.rheinfelderhof.ch/en/), fetched live. Public facts and excerpts are real; commercial offers, events and inventory are demonstration data. This demo is not affiliated with the hotel. No payment is collected or real accommodation booked. The presenter switches between owner and traveller views; these views demonstrate separate approvals inside a single authenticated presentation session. The repository remains private.

On the Publish screen, click **Try Hotel Rheinfelderhof’s website**, then **Read website**. Review the extracted facts and check the review acknowledgement before publishing. Unknown policies stay unknown; the demo email offer supplies its own simulated commercial terms. All email is routed to the configured demo mailbox, never to contact addresses scraped from the website. A local fictional source remains available at `/fixtures/hotel-linden` for development checks. Published customer routes follow the reviewed business name.

After publication, **Switch to the traveller’s personal agent** changes the perspective to Alex’s blue personal-agent site. The hotel owner workspace uses warm violet colors. The header, navigation and identity banner change together, and the handoff returns to the top of the page. Switching back to **Hotel owner** restores the merchant view; reservation acceptance controls appear only in the traveller view.

## Run locally

Requires Node 22, Corepack/pnpm, Docker, and an authenticated Codex CLI on the host (`codex login`).

```bash
corepack pnpm install --frozen-lockfile
node scripts/init-env.mjs
docker compose up -d db
pnpm db:migrate
pnpm db:seed
pnpm dev
```

In a second terminal run `pnpm worker`. Open **http://127.0.0.1:3000/demo** (use this exact origin). Bootstrap sign-in is restricted to loopback and the seeded demo; the generated password and secrets stay in ignored `.env.local`. The worker must remain running for extraction, emails and callbacks.

The native Codex SDK reuses the existing host sign-in. No AI Gateway key is required for the default Codex runtime. App/provider credentials are excluded from the subprocess environment. Native model calls run in private temporary directories with read-only sandboxing, disabled shell/apps/plugins/MCP tools and structured schemas; unexpected tool actions cause result rejection. Business facts and email content remain untrusted data. Codex limits still apply.

For production web packaging: `docker compose --profile app up -d --build web`. Keep the subscription worker on the authenticated host; do not copy Codex credentials into an image. The web service talks to the same Postgres instance. This is local demo packaging, not an internet-hardened multi-user service.

## Voice requests

In the traveller booking view, click **Speak your request**, allow the microphone, speak in English, then click **Stop recording**. Local CPU Whisper transcribes the recording into the editable request; nothing is sent to the booking agent until **Send to my agent**. Pending microphone permission can be cancelled and times out after 15 seconds. The empty composer also shows a suggested request: click its arrow or focus the box and press **→** to insert it.

For local setup, run `bash tools/setup-speech.sh` (requires `uv`) and add the two printed runtime paths to `.env.local`. Docker includes the speech runtime and model. No transcription API key is needed. Recordings are limited to one minute / 2 MB, authenticated, processed one at a time with two CPU threads, and removed from the temporary directory after processing. Transcription uses [faster-whisper](https://github.com/SYSTRAN/faster-whisper); microphone recording uses the browser’s [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder).

## Real email

Set `MAIL_TRANSPORT=resend`, `RESEND_API_KEY`, `RESEND_FROM`, `RESEND_RECEIVING_DOMAIN` and `OWNER_EMAIL` in `.env.local`. Use a verified sending domain for the built-in reply composer. Resend’s test sender can send the inquiry only to the account owner's mailbox; that owner can reply from their actual mailbox to the generated `inquiry+…` receiving address. Changing an unverified From address does not bypass this restriction.

The worker polls authenticated Resend receiving APIs every five seconds, so localhost needs no public tunnel. `/api/webhooks/resend` also supports signature-verified webhooks when reachable and configured with `RESEND_WEBHOOK_SECRET`. Provider message IDs and received receipts are shown in the activity evidence. The dashboard reply path is explicitly labelled and never described as an inbound email.

`MAIL_TRANSPORT=local` is a labelled practice transport. AI Gateway is an optional alternative (`AGENT_RUNTIME=gateway`, `ONBOARDING_PROVIDER=gateway`); its billing is separate from the Codex subscription.

If an inquiry email exhausts its automatic retries, **Retry sending email** queues the saved request again without creating another inquiry. The original provider idempotency key is preserved.

## Structure and safeguards

- `src/features/demo`: chapter components and resumable server-event state.
- `src/server/services`: versioned publication, inquiries, exact-term approvals, atomic inventory reservations and consent.
- `src/server/adapters`: bounded SSRF-protected source fetching, model runtimes, mail and signed callbacks.
- `src/server/jobs` and `src/worker.ts`: Postgres outbox/inbox plus pg-boss retries; state survives browser and worker restarts.
- `src/app/customers/[slug]`: public human page, JSON, OpenAPI, bearer-protected commerce API and MCP discovery/request tools.
- `migrations`: SQL with inventory and idempotency constraints. No separate app is generated per customer.

Anonymous access can read published facts. Private tasks/offers require a buyer credential and are tenant/buyer scoped. Operator mutations require a Better Auth session and same-origin requests. Offer revisions are immutable; both approvals refer to the exact offer and total. Transaction locks serialize duplicate requests and last-room acceptance. Callbacks use timestamped HMAC and a deduplicated inbox. Current seeded UI and buyer identity are intentionally demo-specific; production identity, billing, real PMS inventory and third-party agent distribution remain future work.

## Verify

```bash
pnpm lint
pnpm typecheck
# Create the isolated test database once:
docker exec presence-postgres psql -U presence -d postgres -c 'CREATE DATABASE presence_test'
DATABASE_URL=postgresql://presence:presence-local-only@127.0.0.1:54329/presence_test pnpm db:migrate
pnpm test
# After publishing a business in the running app:
pnpm exec tsx --env-file=.env.local scripts/check-protocols.ts
```

Tests never send provider mail. They use a separate database and isolated tenant data. They cover price/conditions validation, concurrent idempotency, buyer/tenant isolation, expiry, last-room races, SSRF, callback authenticity, monthly limits and revocation. `scripts/check-protocols.ts` calls real MCP/REST endpoints and verifies callback replay. Manual browser verification covers publish, a real outgoing Resend inquiry, an actual Proton email reply received by Resend and parsed into a proposal, both approvals, a capacity-backed reservation and a live Codex follow-up. The real email path and the labelled dashboard alternative were tested separately.

Substantial production builds run through the machine's shared `remote-work` helper using `tools/remote-build.sh`; runtime `.env` and Codex credentials are excluded. The build uses explicit placeholders and returns a standalone artifact. Avoid running a heavy build on the desktop when it would cause lag.

## Research and pitch

The [plan](docs/plan.md), [review](docs/plan-review.md), [implementation specification](docs/implementation-spec.md), [C4 architecture](docs/architecture.md), [sources](docs/sources.md) and [PDF](output/pdf/presence-hackathon-plan.pdf) preserve the reviewed concept and three-minute pitch. They precede implementation; this README describes current behavior. Broad model benchmarks and economic uplift are not claimed as measured results.

The team reports ideation began on 30 October 2026 at 20:30 Europe/Zurich. The [decision log](docs/decision-log.md) preserves that report; Git commits use actual timestamps.

## License

[MIT](LICENSE) for original code and documentation. Adobe’s challenge and linked third-party materials retain their respective ownership.
