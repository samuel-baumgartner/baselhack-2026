# Implementation specification - Presence presentation demo

Version 2 | 31 October 2026 | Planning only. This specification fixes implementation choices; package patches are pinned in the lockfile during setup after checking compatibility. All three live moments are required. The product is a standalone Next.js application with Tailwind and shadcn/ui.

## 1. Actors, authority and product surface

**Presenter:** operates the three-minute demonstration. Has a preauthenticated operator session for a seeded fictional hotel and a demo-only buyer principal. Cannot use the presentation controls on arbitrary real tenants. A visible context switch selects which side the audience sees; the server records which domain actor performs each action.

**Hotel owner/staff:** edits sourced facts, approves publication, reviews mail-derived offers, decides concessions and confirms external reservations. Membership determines the tenant. A website or email sender string does not itself establish this authority.

**Traveller:** supplies requirements, approves exact terms and separately consents to follow-up. The demonstration uses a seeded traveller identity; that identity does not expose the owner's private notes or mailbox.

**Buyer agent:** a running AI SDK loop in our demo worker. It can read public business capabilities, submit a scoped inquiry, read its own task, request exact-offer acceptance with a server-recorded traveller approval, and manage its own subscriptions. It calls the HTTP interface external agents would use. It cannot mint an owner session or read internal prices/notes.

**Onboarding assistant:** source extraction and typed configuration proposals through HarnessAgent/Codex when the integration check passes. It can ask for missing facts but cannot publish or grant itself new capabilities. A Gateway extraction fallback preserves the same schema and is visibly disclosed if used.

**Merchant service:** deterministic commercial rules plus optional AI parsing/suggestions. The MVP does not need an autonomous merchant negotiation agent. This leaves owner approval and inventory authority explicit.

**External services:** first-party source websites, Resend, the owner's mail client/provider, AI Gateway/model providers and host-side Codex access. Future independent buyer platforms, PMS/POS, CRM and ERP are outside the running demo boundary.

## 2. Routes and information architecture

- `/demo`: primary presentation shell, protected operator-only; sections Publish, Book, Reconnect. Section changes preserve one demo session and its records.
- `/demo/results`: measured evidence and replay inspector, available as a backup view; no fabricated charts or counters.
- `/workspace/{slug}/presence`: owner review/editor with source evidence and publication versions.
- `/workspace/{slug}/requests/{id}`: owner requirements, parsed email proposal, offer form and approval history.
- `/workspace/{slug}/events`: owner event draft, scope and permitted recipient summary.
- `/customers/{slug}`: accessible public human business page from the approved version.
- `/customers/{slug}/business.json`, `/openapi.json`, `/mcp`, `/api/v1/...`: published machine interfaces, with authenticated private actions.
- `/api/webhooks/resend`: signature-verified incoming notification endpoint.
- `/api/demo/agent-events`: signed receiver for our demo buyer's subscribed task and merchant events; enabled only in demo mode.

The route list is not nine separate products. Workspace forms and public preview components are reused within `/demo`. Owner inbox details never appear in public business JSON or MCP responses. A feature flag plus authorization, not an obscure URL, protects operator controls.

## 3. Presentation user flows

### Publish: source URL to approved presence

Start with a restrained onboarding screen: URL input, one primary action and a compact hotel preview. Submitting creates an OnboardingRun and immediately returns its ID. A step trace displays actual persisted stages: fetching, extracting, needs review, published. Use generic activity labels, not claimed hidden model reasoning.

Fetch at most five same-origin source pages, with explicit redirect, body-size and total-time limits. Accept public HTTP(S) only and recheck redirect/DNS targets. A locally hosted demo fixture is permitted only through a server-configured exact origin in isolated demo mode; never enable general private-network fetches for submitted URLs. Extraction returns claims with source URL, excerpt and observed time. Unsupported facts stay unknown.

The owner sees the business profile and one focused missing-information question. Fact editing is structured; free text is useful for describing workspace conditions. A source drawer shows provenance. The explicit Publish action creates an immutable BusinessVersion and switches the human and machine projections atomically. The preview shows the published version and updated capabilities. A failed extraction preserves the URL and completed work; retry does not create a duplicate tenant.

### Book: buyer request to a valid reservation

Start the traveller prompt with a prepared suggestion that the presenter actually submits. The buyer agent sees the same fixed candidate directory used in the baseline. Its task trace shows checked constraints and tool outcomes. Unknown facts lead to a question or owner inquiry rather than a fabricated answer.

The owner receives a real email. The on-stage owner replies from a preopened real mailbox using prepared text, which is delivered back through Resend inbound. The app shows a new email receipt, then the parsed offer proposal. The owner reviews and approves it in the embedded structured form. The system does not automatically bind the merchant from an email sender string.

The traveller receives a task update through the signed demo receiver. Show a complete offer card: dates, guest count, room, dog fee, workspace, included taxes, total CHF 205, checkout, workspace end time, cancellation terms and expiry. The traveller explicitly accepts that revision. The UI moves to confirmed only when the selected inventory adapter reports authoritative confirmation.

For the fictional hotel, the database is the inventory system of record. Acceptance commits the remaining capacity in one transaction. For a real email-only hotel, acceptance remains pending and the owner must reconcile/confirm it in the real booking system; this alternate adapter is designed but is not presented as completed external integration.

### Reconnect: permission to an agent suggestion

After booking, ask for a separate scoped subscription with merchant name, event categories, frequency cap, expiry and revoke action. It is not prechecked. The owner then publishes a relevant fictional event. Commit the event and outbox record; the dispatcher checks current consent before each delivery.

The signed callback is persisted by the buyer receiver before acknowledgment. The receiver deduplicates by event ID and subscription ID, then schedules a bounded agent turn. The agent treats the event as external data, checks relevance and may suggest returning. It does not auto-book. The UI shows a suggestion tied to the real event and a working unsubscribe control. An irrelevant event, expired consent or revoked subscription must not produce an inappropriate suggestion.

### Recovery and reload

Keep session, chat messages, pending tasks, offer versions and event receipts in Postgres. Refreshing the browser reconstructs the screen from current records. SSE reconnects with an event cursor and replays authorized public task summaries; missing events trigger a snapshot refresh. Stop-generating cancels an active model turn, not an already-sent email or a confirmed reservation. Show the actual task state and explicit cancellation semantics.

## 4. Visual contract and acceptance

**Direction:** a calm, polished product workspace suited to a projector. Warm off-white content surface, slate navigation, deep ink text and a single teal action color. Use high-contrast text and strong hierarchy; keep error/warning colors for their meanings. Theme tokens live in Tailwind v4's token layer. Use shadcn/ui primitives consistently, including its current conversation patterns where useful; do not mix component systems. [S30, S31]

**Desktop composition:** at 1440 x 900, a compact 216-240px chapter rail, flexible 600-720px working conversation/form area, and a 320-380px contextual business/offer panel. A persistent header names the fictional hotel, active chapter and current actor. One prominent action is visible at a time. Presentation mode can collapse secondary navigation for 1280 x 720 projection. The preview is a proposed design, not a screenshot of working software.

**Typography and spacing:** a bundled sans-serif font via Next font support, approximately 16px body, 20-24px section titles and 28-32px main titles; presentation mode raises essential text to at least 18px. Use an 8px spacing rhythm, moderate 10-14px radii, restrained borders, minimal elevation and no decorative gradients. Offer total and next required action receive more emphasis than trace details.

**Primitives:** Button, Input/InputGroup, Textarea, Field, Badge, Dialog/AlertDialog, Sheet, Tabs, Sidebar, ScrollArea, Skeleton, Tooltip and accessible select/checkbox components from one shadcn primitive family. Message/MessageScroller, Trace and Prompt Input patterns compose the conversation. Lucide icons communicate actions; they do not replace text labels. Avoid deprecated or undocumented component APIs; copy the current source patterns and pin versions after setup. [S31]

**Explicit states:** URL validation failure, extraction progress, partial extraction, missing policy, draft/published, email sent/waiting/reply received, offer proposal/approved/expired, awaiting traveller approval, booking pending/confirmed/rejected, subscribed/unsubscribed, event delivered/suppressed/failed. Use persisted state for status. Never animate fake progress percentages, invent lead counts or display a confirmed badge during a pending operation.

**Interaction:** a stable streaming composer; Enter sends and Shift+Enter adds a line; correct IME behavior; keyboard submit, stop and retry; scroll follows new output only when the user is already near the bottom. Source references and trace summaries collapse by default. Avoid auto-scrolling away from an offer while the audience reads it. Render Markdown safely and display tool results as typed cards. [S32]

**Responsive/accessibility:** at widths below 1024px, move context into a Sheet; below 768px, collapse the chapter rail and use a single content column. No horizontal page scrolling at 390px. Preserve keyboard focus and reduced-motion preferences; labelled controls, visible focus and suitable contrast are required. Use a single polite live region for concise status changes instead of announcing every token.

**Visual exit:** inspect real screenshots at 1440 x 900 and 1280 x 720, plus a 390px layout check. Review light/dark only if both are implemented; one polished light theme is sufficient for MVP. Inspect long hotel names, long offer terms and every major waiting/error state. A dependency install or successful build does not establish visual quality. Verify in an isolated browser/display if rendering would affect desktop responsiveness.

## 5. Selected technologies and deployment boundary

Use Next.js App Router, React, TypeScript strict mode, Tailwind v4 and shadcn/ui. Select a current mutually compatible stable Next/React/Node combination at setup, pin exact dependencies and use one pnpm lockfile. Experimental harness adapters are isolated behind a small interface; do not place the whole app on an unpinned canary dependency.

Use PostgreSQL, Drizzle migrations and Zod for persisted state and contracts. Use Better Auth with its supported Next/Drizzle integration and preprovisioned demo users; public self-registration is disabled for the presentation. Membership grants owner access. Store buyer principals and their task access separately from owner sessions. Do not put a service-wide owner token into the browser or an MCP tool. [S29]

Use **pg-boss** in one TypeScript worker process. The MVP does not also use Workflow SDK, Redis, a separate Python backend or an event-bus service. The worker and web process share server modules and the same repository; they have distinct entrypoints. Human waits are explicit records and deadlines. No job holds a database transaction open while waiting for an LLM, email or human. [S28]

Use AI SDK/Gateway for the buyer and parsing/extraction fallback; use `@ai-sdk/react` with its documented transport for streaming conversation. Stream delivery is not workflow persistence. Store UI messages separately from domain task events, and reconstruct visible tool cards from authoritative records. The assistant can explain a proposal; it cannot create commercial authority by saying that something was approved. [S32]

Use HarnessAgent/Codex for bounded onboarding proposals after the auth/compatibility smoke check. The credentialed runtime stays host-side behind an authenticated local-only job boundary. Never mount the Docker socket, a complete home directory or native auth store into tenant-controlled work. The host adapter accepts only a run ID and validated job payload, creates a private working directory, and returns schema-validated configuration. It is not a generic remote shell or a public endpoint.

Compose runs `web`, `worker` and `postgres`; database data is on a named volume and health checks gate readiness. The host-side Codex runtime is an explicit integration step, not hidden in the image. A Gateway-only extraction mode runs without that step and is clearly distinguished in status. Configure a restricted HTTPS tunnel for inbound mail and a production-style streaming path for rehearsal; model/email providers still need internet access. [S33]

REST/OpenAPI is the canonical commercial transport. An MCP adapter exposes the same service capabilities and authorization. A2A/UCP are future adapters; do not implement competing state machines to satisfy protocol labels. The demo buyer proves the public HTTP path first, then run one real MCP tool invocation before claiming MCP support.

## 6. Domain records and invariants

**Identity:** Tenant, OwnerMembership, BuyerPrincipal and DemoSession. A DemoSession references a seeded tenant and buyer; it cannot override arbitrary tenant IDs. Scope all private queries by both authenticated principal and tenant. The public business slug maps to a tenant but does not authenticate a caller.

**Presence:** SourceSnapshot stores bounded source text and evidence; OnboardingRun stores stage and job correlation; BusinessVersion stores immutable approved facts, provenance, capability selections and owner approval; Tenant points to the current version. Publication is a transaction. Cache public views by tenant and version; private offers/tasks are never shared-cache responses. A profile edit cannot retroactively change accepted terms.

**Inquiry:** structured needs, guest dates in the property's timezone, buyer reference, deadline and status. Inquiry states are received, waiting_for_owner, needs_input, offered or closed. A conversation is not a reservation record.

**OfferRevision:** immutable itemization in integer minor units, ISO currency, taxes/inclusions, conditions, dates, guest count, validity, business version, creator and owner approval. Published revisions can be accepted, superseded, withdrawn or expired. Acceptance includes the revision ID, expected total/currency and a server-recorded traveller approval. Reject incompatible revisions with 409; return the existing result for the same idempotency key and payload, and 409 if that key is reused with a different payload.

**ReservationAttempt:** pending_merchant_confirmation, confirmed, rejected, expired or cancelled. Confirmation records the adapter, system-of-record reference, confirmed terms and actor. The fictional adapter locks the relevant inventory rows or uses an equivalent database-enforced capacity constraint, validates expiry and consumes capacity atomically. Concurrent acceptances for the last unit cannot both succeed. Any hold has its own expiry and is never assumed from publication alone.

**Subscriptions/events:** Subscription stores buyer, merchant, scope, expiry, frequency cap, status and consent record. MerchantEvent references immutable details and any offer. Delivery stores subscriber/event IDs and state. Recheck consent when claiming a send, and suppress if revoked before dispatch. Revocation cannot recall a callback already delivered; the receiver suppresses later suggestions once it knows consent was revoked. No extra model call may auto-subscribe a user.

**Delivery and traces:** InboxEvent has a unique provider event ID; OutboxEvent stores type, payload reference and state; DeliveryAttempt stores attempts and provider/callback correlation. AgentRun, UIMessage, TaskEvent and EvaluationRun retain actual outputs and model/provider information, with redacted logs. Do not expose native credentials, private guest details or internal email bodies in public traces.

## 7. Transaction, job and callback contracts

Every commercial mutation and its outbox record are committed together in Postgres. After commit, a dispatcher reads committed outbox records and schedules pg-boss jobs using stable identifiers. A dispatcher crash can reschedule work; domain idempotency makes that safe. Do not assume a Drizzle transaction automatically encompasses an unrelated queue call.

Named job handlers: `onboarding.extract`, `merchant.send_inquiry`, `merchant.parse_reply`, `buyer.resume`, `callback.deliver`, `subscription.deliver` and `deadline.expire`. Payloads contain record IDs and explicit schema versions rather than a copied database row or raw credential. Each attempt checks the current domain state and exits if already applied, expired or revoked. Retry transient transport errors with bounded exponential backoff; invalid input or policy failure requires a deterministic error/review state.

For email sending, use the provider's supported idempotency mechanism where available and persist the returned message ID. If delivery succeeded but the response was lost, reconcile before blindly sending again. A queue's uniqueness guarantee alone cannot prevent all external duplicate effects. Inbound signature verification uses the raw request body, then commits a deduplicated inbox event before returning 2xx. Parse asynchronously and keep uncertain replies for owner review.

Callbacks go only to preregistered, verified receiver destinations. An inquiry does not accept an arbitrary callback URL. Each event includes event ID, schema version, task/subscription reference and timestamp; sign it and reject old/replayed messages at the receiver. Inbound deduplication and a scheduled resume job are persisted before acknowledgment. Use a task read to obtain authoritative state after notification. Provide authenticated task reads as a compatibility fallback; server-side polling is not the only way a buyer resumes.

## 8. Code structure and quality constraints

Use `src/app` for route composition and route handlers; `src/components/ui` for copied shadcn primitives; `src/components/presence` for reusable business/offer/source cards; and `src/features/demo`, `onboarding`, `commerce`, `subscriptions` and `evaluation` for feature UI plus typed client contracts. Keep server-only logic in `src/server/{auth,db,services,repositories,adapters,jobs}` and worker startup in `src/worker.ts`.

Domain services own validation, authorization and transaction boundaries. Route handlers, Server Actions and MCP tools are thin adapters to the same services. Treat every Server Action as a public mutation boundary and validate it accordingly. Provider-specific clients live in adapters. No handwritten price calculation in JSX, copied validation in four transports, or production logic hidden in the demo controller.

Use discriminated unions for result states, explicit schema versions, consistent error codes and exhaustive rendering of task/offer states. Avoid broad `any`, unchecked casts and swallowed failures. Model strings, timeouts, queue limits and enabled capabilities come from validated configuration. User-visible errors give an actionable retry or next step; debug details remain behind an inspector.

Add a reproducible `.env.example` without secrets, migrations, deterministic seed/reset commands and a clear README. Restrict demo reset to seeded sessions and operators; never clear all tenant data. CI runs formatting/lint, type checking, meaningful unit/integration checks and the production build using the lockfile. Long builds and bulk evaluation use the shared remote-work helper when workload warrants it.

## 9. Verification and build gates

**Integration gate:** one live Resend outbound/inbound round trip with a team-controlled inbox; one Codex or disclosed fallback schema-valid extraction; one worker restart while a task is waiting; one successful model tool call. Record outcomes, not just configuration presence. No fabricated SMTP transport is a substitute for the required email demonstration.

**Commercial gate:** money/tax arithmetic; expired/superseded offer rejection; same-key acceptance replay; concurrent last-unit contention; owner-versus-buyer access; cross-tenant access rejection; signed email replay; task resume after restart; callback duplicate handling; and consent suppression before delivery. These tests protect real risks rather than mirror component markup.

**Connected-flow gate:** a Playwright run on fixture infrastructure drives URL extraction, approval, actual public API buyer calls, parsed reply, offer approval, traveller acceptance and a consented event. Fixtures make the repeatable test deterministic; separately complete the real provider email run. Mark provider tests as opt-in so ordinary CI needs no live secrets and sends no mail.

**Protocol gate:** compare an MCP tool result with the corresponding REST operation under the same buyer scope. Private fields and mutation behavior must match. An OpenAPI file alone is not proof that an external tool call works.

**Presentation gate:** all three moments complete live; essential content is readable at 1280 x 720; no unexplained role switch or hidden owner action; browser reload preserves progress; errors and waiting states are honest. Rehearse at least three times to 180 seconds with a shorter speaker script and prepared mailbox. Inspect the real rendered screens before declaring visual quality achieved.

**Evaluation gate:** six core scenarios x two model families x three repeats x two arms = 72 exploratory episodes, only after the connected-flow gate. Freeze two core scenarios before prompt tuning. Bulk runs use fixture mail adapters and never send to real merchants. Report per-task successes/attempts, actual cost and failures. Retention and transaction tasks retain separate denominators. The expanded 432-episode experiment is optional; the three live moments are not.
