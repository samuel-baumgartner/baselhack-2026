# Ideation and decision log

This log records the team's stated timeline and the rationale behind the current proposal. It is not a reconstruction of Git activity. Commit timestamps reflect when the material was committed; no earlier commits or human reviews are implied.

## Team-reported start

The team reports that ideation began **30 October 2026 at 20:30, Europe/Zurich**. This is a reported project milestone, not a timestamp verified by this repository's history.

## Decisions captured on 31 October 2026

- **Design the pitch before implementation.** The challenge requires a believable future and a working mechanism. A three-minute demonstration determines the prototype's scope.
- **Use independent hospitality as the starting point.** One fictional Basel hotel keeps the operational model and demo understandable; restaurants remain a later template.
- **Demonstrate publish, transact, reconnect.** Together these cover onboarding, a real commercial workflow and a permission-based repeat relationship.
- **Use one multi-tenant application.** Onboarding creates validated configuration and capabilities rather than a separate application for each business.
- **Begin with email operations.** Existing merchant workflows offer a practical adoption path before PMS/POS/CRM integrations.
- **Preserve commercial authority.** Source extraction is not live inventory. Offers require authorization; an email sent to a real merchant is not a booking confirmation.
- **Separate visibility from transaction quality.** A controlled benchmark can test comprehension and action immediately. Organic assistant discovery requires separate evidence.
- **Plan subscription-backed onboarding, verify before relying on it.** The documented HarnessAgent/Codex path needs a short compatibility and authentication check.
- **Keep financial claims hypothetical until measured.** Market counts, assumed pricing and illustrative conversion changes do not establish product traction.

## Pending validation

Pitch alignment, hotel interviews, authentication and integration smoke tests, application implementation, benchmark execution and pilot economics remain outstanding. See [the plan](plan.md) for exit criteria and fallback choices.

## Review corrections on 31 October 2026

- **Presentation-first interface:** the user clarified that the audience is the final presentation. Use a standalone Next.js demo with Tailwind v4 and shadcn/ui; do not add an embedded ChatGPT application.
- **All three moments are live:** URL onboarding, booking through actual email and a consented agent follow-up are mandatory. A labelled preview or replay does not satisfy those gates.
- **Selected durable runtime:** PostgreSQL plus pg-boss and explicit state/outbox records replace the unspecified Workflow World. No second workflow runtime is required.
- **Separate actor and state boundaries:** our buyer simulator is part of the prototype; future independent assistants are external. Email receipt, owner-approved offer and confirmed reservation are different states.
- **Implementation contract:** concrete routes, user flows, visual tokens, record invariants, jobs, module ownership and meaningful test/visual gates are documented in `implementation-spec.md`.
- **Benchmark after the mechanism:** 72 core exploratory episodes precede the optional 432-episode expansion; bulk tests use fixtures, not real merchant emails.
- **Private repository:** changed GitHub visibility to private at the user's explicit request and verified the returned state. Publication visibility must not be changed without a new request.
- **No supplied deadline:** the user asked to proceed without giving a submission time. No deadline is assumed and no more product-choice questions are pending from this review.


## 31 October — implementation and subscription runtime

Implemented the shared Next.js/Tailwind/shadcn demo with Postgres, durable jobs, versioned publication, public commerce API/MCP, Resend transport, two explicit approvals, fictional inventory and signed opt-in callbacks. The native Codex SDK reuses the host subscription for extraction and buyer decisions; AI Gateway remains optional after its inference endpoint required separate billing. The buyer exercises the public HTTP API rather than a private database shortcut. Onboarding generates versioned configuration, never new customer-specific application code.

Manual browser checks completed URL extraction/publication, a real outgoing Resend inquiry, an explicitly labelled dashboard response, owner approval, Codex callback resumption, traveller approval/reservation, opt-in event suggestion and unsubscribe. Resend's test-sender restriction blocked the built-in email reply composer; real incoming mail remains a separate verification gate until mailbox access is connected. The UI includes a reply-from-mailbox link and does not describe dashboard responses as received email. Production build, lint/type checks, focused isolated database tests and real MCP/REST protocol checks were executed. No market-wide model visibility or revenue uplift is claimed from these checks.


## 31 October — real inbound email verified

Created a dedicated free Proton demo mailbox, with user-assisted verification. A fresh production-app run extracted and published the website through Codex, then requested an offer through the public API. Resend sent the inquiry (provider message `01a192f6-19d0-75b5-a9d9-56e3c8abf3c4`). The reply was sent from the Proton webmail UI, received by Resend as `029d7775-295f-4eb8-a292-4366570ef7f1`, and parsed into CHF 175 room + CHF 20 dog + CHF 10 workspace. Both approvals completed and reservation `PL-EB6F91` was saved against fictional inventory. No dashboard reply was used in this run. Mailbox credentials are kept outside the repository. The test-sender restriction remains correctly represented in the UI; the external mailbox provides the actual SMTP reply.

The fresh run also completed category-specific opt-in, signed event delivery and a Codex relevance check that produced a return-visit suggestion. Public MCP/REST and callback replay checks passed again against the running production app.


## 31 October — real hotel website as the stage source

Switched the suggested source to Hotel Rheinfelderhof’s official homepage, https://www.rheinfelderhof.ch/en/. The running scraper fetched 2,682 readable characters from the actual public HTTPS site, including the contact address in its footer. Codex produced seven source-backed claims. The profile retains dated renovation notices and leaves dog acceptance, after-midnight arrival and quiet workspace access unknown. Removed the fixture-specific publication override that forced workspace access until 14:00. Publication now derives its customer route from the reviewed business name, and acceptance uses that actual route.

Public facts are sourced from the real hotel; offers, inventory and events remain demo data and all email remains routed to the configured demo mailbox. No hotel contact address is used as an outbound recipient. Source fetch, browser extraction/review/publication, eight isolated tests and real MCP/REST checks passed.


## 31 October — explicit owner-to-traveller handoff

The publication handoff now explicitly switches to the traveller’s personal agent. Merchant pages use warm violet tones; Alex’s assistant uses blue, its own identity/navigation and customer-facing copy. A persistent role banner explains the active persona. Switching personas returns to the top so the new identity is visible, and only the traveller sees reservation acceptance controls.

Verified the publication handoff and reverse switch in the production browser, including the 390px mobile layout and navigation drawer. Typecheck, focused lint and the remote production build passed. No inquiry or reservation state was changed during these UI checks.


## 31 October — voice and suggested traveller request

The traveller composer starts empty, with a visible example that can be inserted by its arrow button or by pressing ArrowRight in the empty text field. A microphone button records up to one minute, then sends the recording to an authenticated same-origin Next.js route. Local CPU faster-whisper transcribes it into editable text. Sending to the booking agent remains a separate action. Microphone tracks stop on completion or navigation; temporary audio files are removed after processing. Runtime/model setup is documented and included in Docker.

Verified both suggestion controls in an isolated browser workspace without resetting the active rehearsal. A synthesized spoken request retained midnight arrival, dog, workspace, CHF 220 and approval requirements in transcription (735 ms on this host). HTTP checks passed for real transcription, silence, missing session, foreign origin, incorrect media type and oversized input; no temporary recording directories remained. The presenter's microphone was not recorded during these checks. Typecheck, focused lint, Compose validation and remote production builds passed. Pinned PyAV 16.0.1 after the speech check exposed an incompatibility with PyAV 19.
