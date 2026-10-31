# Presence: the business side of personal agents

BaselHack 2026 | Adobe challenge | Planning version 1 | 31 October 2026, Europe/Zurich

Status: research and proposed scope only. No application has been built. Presence is a working name, not an Adobe product or an affiliation claim. Sources are numbered in `sources.md`. Architecture is in `architecture.md` and rendered in the PDF.

## 01. The decision we should align on

**Jury takeaway:** When customers send an AI, independent businesses need a way to participate. We turn their existing website into a business-controlled commerce interface, connect it to the inbox they already use, and preserve a permission-based path to repeat business.

**Proposed pitch line:** Your next customer is an agent. Your business should be ready.

The product is a shared, multi-tenant commercial layer with three visible outcomes: **publish, transact, reconnect**. The buyer is the independent hotel owner; the consumer's personal agent is the new distribution channel. Start with one fictional Basel hotel and one traveller. Restaurant support is a later configuration template, not a second vertical to build this weekend.

The strongest demonstration is a nonstandard request that a generic listing cannot reliably resolve: a traveller arrives after midnight with a dog and needs a quiet workspace after checkout, under CHF 220. The hotel cannot promise late checkout but can offer a room plus workspace. The owner approves the offer through email or a structured dashboard. The customer approves the exact terms. A real database records the resulting reservation.

Publishing an API alone does not make a hotel appear in every assistant. The demo must say how the agent finds the business. Use an explicit local directory for the controlled test; treat organic discovery as a separate, slower experiment. The prototype is a working commercial workflow; a chat can expose the traveller's actions but is not the product's entire value.

### The actual challenge

Recovered from the other chat, titled **Explore Adobe's post-website future**, and its attached challenge text. The official title is **The Post-Website Business**, sponsored by Adobe, posted 10 October 2026. The spoken labels "hope" and "5 challenge" do not match that title; the recovered attachment is the planning basis. [S1]

The brief asks how local businesses establish and control their presence when the visitor is an AI agent. It requires a believable future in roughly 5-10 years and a running prototype of a real slice. Agent-facing offerings, discovery, trust, transactions, owner control, fairness, and human fallback are suggested directions, not a mandatory checklist. The brief explicitly prefers an honestly scoped working slice. It requests an OSI-standard license in the submission repository. [S1]

2030 is our near-term scenario, four years from this event. Explicitly extend the vision to **2031-2036** on the roadmap to cover the brief's 5-10-year framing. The future is a scenario, not a forecast with a guaranteed adoption rate.

### What success looks like

- The jury can explain the customer, the problem, and the change after one sentence.
- Three connected demo moments work: onboard from a URL; complete an owner-approved request; deliver an opted-in event to the same traveller agent.
- Every promised price, booking status, and benchmark result has a traceable source or persisted record.
- The before/after evidence is labelled as a controlled experiment. Financial illustrations are visibly hypothetical.

## 02. Preserve the full concept, then choose the slice

### The user's vision, recorded

By 2030, personal agents may combine preferences, identity, delegated spending authority and ongoing context. They will compare more providers, solicit offers, and act within boundaries chosen by a person. That may shift influence over the customer relationship toward the assistant platform. Independent businesses need a voice in those comparisons and a way to earn repeat business.

Our adoption path begins with the information a business already has: a domain, business name, Google Maps link, or contact number. The system extracts facts, identifies missing operational information, interviews the owner only where needed, and publishes an agent-readable presence plus a transactional interface. Agent requests become normal emails to the business; replies become structured offers and task updates. A small dashboard gives the owner an alternative to writing email.

Over time, CRM, PMS, booking engine, POS and ERP adapters replace manual steps. These systems have different roles: PMS/booking engines govern hotel inventory; POS/reservation systems govern restaurant capacity; CRM handles relationships; ERP contributes finance and fulfilled-revenue data. Do not promise that an ERP connection alone provides bookable availability.

The long-term service continuously tests business descriptions, capability schemas, response policies and offers across several buyer agents and models. It connects representation and selection to inquiries, accepted offers, completed bookings, cancellations, repeat visits and contribution margin. Models can propose experiments; the business controls publication and commercial authority.

With customer consent, a hotel or restaurant can publish relevant updates to subscribed personal agents: an event, a suitable room becoming available, or a return-visit offer. The personal agent decides whether the update matters and whether to show it. The merchant gains a permission-based connection rather than a right to insert arbitrary instructions into someone else's agent.

### Adoption stages

- **A. Publish:** verified identity, sourced facts, distinctive brand material, policies, clear unknowns, machine-readable capabilities, and a human page from the same data.
- **B. Email bridge:** asynchronous inquiries and offers; owner remains the authority; no unsupported real-time availability claims.
- **C. Connected operations:** PMS/POS and CRM adapters; live quotes and resource holds where the underlying system supports them.
- **D. Measured growth:** experiments linked to fulfilled outcomes; owner-approved routing and offers, with capacity and margin guardrails.
- **E. Permission-based retention:** relevant events to subscribed customer agents; revocable consent, visible preferences and delivery receipts.

### Deliberate assumptions

The agent acts on behalf of a human or company under delegated authority; it is not assumed to be a new legal person. Payment and identity are handled by specialist providers later. Broad consumer adoption, universal webhook support, and the assistant platform's dominance of the relationship remain hypotheses. The names "Muse" and "Dropbot" in the spoken request are ambiguous; the pitch should use verified products and protocols rather than attribute unverified features to those names.

## 03. Evidence, trends, and market size

### Evidence we can actually cite

Adobe reported that AI-referred traffic to US travel sites grew **194% year over year in May 2026**. Its analysis covered more than 8 million visits to US travel sites. Crucially, this traffic still converted **28% less** than non-AI traffic. The direction is promising; this does not show that agents already dominate bookings or that the same effect applies to Swiss hotels. [S2]

UCP announced a **draft lodging-booking capability on 25 September 2026**, with participation from established travel and hospitality companies. That is evidence of infrastructure investment, not universal implementation or a final standard. [S3]

Stripe and OpenAI's ACP work demonstrates programmatic commerce between buyer agents and merchants. Its retail checkout context is not evidence that every hotel can expose inventory or accept autonomous reservations today. [S4]

A2A supports asynchronous task updates, including authenticated client webhooks when the server advertises push notifications. This makes an email-to-agent bridge technically plausible today. Availability in a protocol does not mean every personal assistant implements it. [S5]

### Bottom-up market framing

**Swiss hotel beachhead:** the FSO's Swiss Tourism Statistics 2024 states that **3,999 hotels and health establishments were open in 2024**. Use approximately 4,000 as an order-of-magnitude establishment base, not a count of independent, qualified software buyers. The report's adjacent chart gives 4,005, so use the prose figure with its year and definition rather than claim false precision. Establishments and enterprises are different units. [S6]

**European expansion ceiling:** Eurostat reports **1.988 million enterprises in accommodation and food services in 2023**, in an article extracted in May 2026. This includes a broad mix of businesses and is not a count of independently owned hotels with suitable demand. [S7]

**Pricing hypothesis:** CHF 149 per business per month for a pilot offer, with assisted onboarding initially. At that assumed price, 3,999 Swiss establishments imply an upper-bound annual subscription envelope of **CHF 7.15 million**, before qualification, adoption, discounts or churn. A hypothetical 25% eligible segment is about 1,000 businesses and CHF 1.79 million annual revenue capacity. A reachable first-year target of 50 paying businesses would be **CHF 89,400 ARR**. These are arithmetic scenarios, not validated SAM, pipeline or forecasts.

At an independently assumed EUR 149 per enterprise per month, the broad EU count implies a **EUR 3.55 billion annual envelope**. Currency and buyer-unit differences prevent adding it to the Swiss estimate. This ceiling belongs in backup material; the three-minute pitch should lead with the beachhead and a pilot hypothesis.

### What remains unproven

Interview 3-5 independent hotels and one hospitality agency: how many inquiries arrive by email, what details require human judgment, where booking authority lives, what a missed inquiry costs, and whether the owner would pay for this. Ask the Adobe mentor which presence-authoring and distribution workflows matter most. Small traffic today may support operational efficiency as the first buyer benefit before agent-attributed growth becomes material.

## 04. Competitive landscape: five useful comparisons

These are overlaps based on public descriptions, not exhaustive feature audits. Do not claim that any competitor lacks a feature merely because a page does not mention it.

- **Adobe Brand Visibility, formerly LLM Optimizer:** enterprise AI visibility, representation, optimization, experimentation and attribution. It overlaps substantially with the planned optimization loop. Our proposed extension is a small-business path from approved facts to operational transactions through email. Present this as a possible Adobe workflow, without suggesting a partnership. [S8]
- **Profound:** its Answer Engine Insights queries answer engines and analyzes how brands appear. The lesson is repeatable prompts and response evidence. Our prototype also executes merchant-approved workflows; mention counts alone are not its success criterion. [S9]
- **Wildcard:** YC describes a platform for agentic commerce optimization for ecommerce and retail, including ACP/UCP support. This is a direct adjacent competitor; "we make brands agent-ready" is insufficient differentiation. Test the hospitality-specific email bridge and permission-based repeat relationship as the wedge. [S10]
- **Palisade:** YC describes AI-native sales agents that run marketplaces. The other chat also identified overlap in persistent sales conversations; that finer feature comparison has not been re-verified from readable primary text here. Treat it as a competitor to investigate, not evidence of an unoccupied category. [S11]
- **Stripe / ACP:** transaction and payment infrastructure that can be a partner or dependency. We should adopt standards where relevant rather than invent payment rails. Our first slice resolves manual merchant operations before payment. [S4]

### Positioning to defend

**An adoption and operating layer for independent hospitality: publish once, answer agents through your existing inbox, and reconnect through customer-approved subscriptions.** The long-term advantage would be useful operational adapters, verified merchant data, and outcome-linked experiments. Those are hypotheses about defensibility; none is a moat at hackathon scale.

UCP, ACP, MCP and A2A are different building blocks. MCP exposes tools; A2A coordinates tasks between representatives; commerce protocols define commercial flows. A manifest or OpenAPI document helps an integrated agent use our service but does not automatically register it with every assistant. Keep a shared internal contract and add adapters rather than building four separate backends.

## 05. Three-minute pitch: one bullet per slide

- **1 | 0:00-0:18 | From answers to action:** one visual timeline from the 1956 AI research era to the 2017 Transformer, 2022 ChatGPT, 2026 commerce protocols, and our clearly labelled 2030 scenario; ask, "What does a business publish when its customer sends an agent?" [S3, S4, S21, S22]
- **2 | 0:18-0:35 | The owner loses the interface:** role-play a fictional Basel hotel owner whose rooms fit a traveller but whose policies and booking process cannot be reliably resolved by the agent; show the failed task and its actual reason.
- **3 | 0:35-1:05 | Demo: publish:** enter the hotel's URL, inspect the sourced business profile, confirm one missing policy, and publish a human page plus machine-readable capabilities from the same record.
- **4 | 1:05-1:45 | Demo: transact:** the traveller's agent requests late arrival, a dog, and workspace after checkout; the owner approves a CHF 205 room-plus-workspace offer by dashboard or email, the traveller approves, and a persisted reservation appears with exact terms.
- **5 | 1:45-2:10 | Demo: reconnect:** the traveller opts into suitable future updates, the owner publishes an event, and the agent receives it and offers a relevant suggestion; show the subscription and an unsubscribe control.
- **6 | 2:10-2:35 | Evidence and business:** show actual controlled before/after task results, the approximately 4,000-establishment Swiss beachhead, and the CHF 149/month pilot hypothesis; clearly distinguish measured outcomes from the financial illustration. [S6]
- **7 | 2:35-3:00 | Close the loop:** cite AI travel referral growth and the UCP lodging draft, show the email-to-PMS adoption path, and close, "The next web is agents acting for people. We help local businesses stay in the relationship." [S2, S3]

Total: **180 seconds**, including all demo actions. Use seven views in a continuous presentation; avoid repeated switches between unrelated windows. Keep AI history to 18 seconds. If a demo stalls for more than five seconds, switch to the prepared, clearly labelled replay.

### Speaker draft, approximately 350 words

AI moved from a research ambition to systems that can answer us. Transformers enabled a new wave of language models; ChatGPT made conversation familiar. Now commerce protocols let agents take action. Imagine 2030: your family asks an assistant to arrange a weekend, and the assistant compares and contacts businesses for you.

But what happens to the independent hotel that still takes special requests by email? Its rooms might be perfect. If the agent cannot verify the policies or obtain an offer, that hotel can lose the opportunity before anyone calls.

We are building Presence: the business side of personal agents.

Here is our fictional Basel hotel. We enter its website. Presence extracts the offering, shows where each fact came from, and asks the owner to confirm what is missing. One approved record now powers a human page and an interface an agent can use.

Our traveller arrives after midnight with a dog and needs somewhere to work after checkout, under 220 francs. The hotel cannot offer late checkout. Its owner can offer a room and workspace for 205. The request arrives in the inbox they already use. The owner approves; the traveller approves the exact terms; here is the saved reservation. We have connected the agent economy to the hotel's actual way of working.

And the relationship can continue. With the traveller's permission, the hotel publishes a suitable future event. Their agent receives it, checks relevance, and suggests returning. The customer controls the subscription.

Our benchmark compares the same customer tasks and candidate businesses before and after publication. We will show the actual completed-task results, not claim that publishing an API instantly changes every search engine. Switzerland has roughly four thousand open hotel establishments. Our pilot hypothesis is 149 francs per month, with deeper integrations as demand grows.

This direction already has signals: Adobe measured rapid growth in AI travel referrals, and UCP has published a lodging-booking draft. The adoption rate is uncertain; the mechanism is tangible. Start with a website and an inbox. Connect operational systems next. Keep improving from real outcomes.

The next web is agents acting for people. We help local businesses stay in the relationship.

## 06. Demo contract: three moments, one continuous story

### A. Publish an existing business

Input: a fictional hotel's locally hosted source page, also accessible by URL. The system actually fetches the page and extracts facts at runtime. Before publication it shows source URLs, observation times, confidence, and unknowns. One short owner question resolves workspace access. A readable brand page, JSON business profile, OpenAPI description and MCP tools are projections of the same approved version. No new application or deployment is generated.

The old page stays available as a human fallback. The owner can update a fact once and preview both representations. Do not use fabricated review scores or add an unsupported "quiet" claim just to win the test. If claiming distance from Basel SBB, use fixture coordinates and a clearly specified distance method or owner-provided evidence.

### B. Handle a request through the inbox

Traveller prompt: "I arrive after midnight with my dog. I need a quiet place to work until 14:00 after checkout. Keep the stay and extras below CHF 220. Ask me before confirming."

The buyer agent chooses tools. A genuine request record creates a merchant task. The owner receives the requirements and a link to the structured response form, plus an email reply option. Offer: CHF 175 room, CHF 20 dog fee, CHF 10 workspace, **CHF 205 total**, with fixture taxes included, checkout at 11:00, workspace until 14:00, late-arrival instructions, expiration and cancellation terms. These are fictional demo prices, not observed market prices.

The buyer checks constraints and asks the human to approve that offer version. In the fictional system, a transaction creates the hold/reservation against seeded capacity. For a real hotel without an inventory connection, acceptance creates a **pending confirmation**, and the owner must confirm it in the authoritative booking system. Never present a dispatched email as a confirmed external booking.

### C. Reconnect with permission

After the booking, the traveller approves a scoped subscription: this merchant, Basel cultural events, up to one relevant update per month, until a stated expiry. The owner publishes a fictional jazz evening and suitable package. A signed structured event reaches our demo buyer-agent receiver, is persisted, and triggers a new agent turn. The agent may suggest returning; it cannot book without the user's authority. Include an irrelevant event that the relevance filter suppresses, if time allows.

### Evidence on screen

Display task and offer IDs, source/version, pending versus confirmed states, amount and currency, consent status, delivery receipt, and benchmark provenance. The baseline may already work; report that honestly and show where steps, waiting, or errors improve. The planned before/after does not assert that a real business has lost customers or been saved from closure.

### Demo reliability

Use a seeded fictional merchant, fixed traveller scenario, prepared owner mailbox and prepared offer fields. Live extraction and database actions must genuinely execute. Keep a recorded successful trace as a labelled fallback. Human email latency is unpredictable: prepare the owner dashboard as the fast path and show the real email receipt/reply during Q&A. Any replayed email event must be labelled as replayed, not live mail.

## 07. Milestones: research, then pitch, then implementation

Estimates below are **focused engineering hours**, not calendar commitments; team size and submission deadline were not supplied. The implementation critical path is approximately 14-18 hours after pitch alignment, with substantial uncertainty. The order is intentional. Each milestone has a concrete exit condition and a cut if it overruns.

### M0. Research and decision brief - completed in this planning pass

Deliverables: recovered challenge brief, current evidence, five competitor comparisons, benchmark design, proposed architecture, narrative and a PDF. Exit: distinguish known facts from forecasts and unresolved technical checks. This does not mean market demand or SDK compatibility has been validated. No app build has started.

### M1. Lock the pitch and demo - 30-45 minutes

Choose the fictional Basel hotel, the specific traveller request, seven slide messages, three demo moments and one closing line. Walk the story aloud before any UI work. Exit: a timed storyboard with every claimed outcome linked to a visible action or record. Owner: pitch lead plus product lead. Cut: reduce history and financial detail before reducing proof of the mechanism.

### M2. Freeze the contracts and benchmark tasks - 45-60 minutes

Define BusinessVersion, Capability, Inquiry, OfferVersion, Reservation, Subscription, Event and AuditEvent. Fix price/authority rules, the 12 evaluation scenarios, baseline source pages and trace fields. Exit: a written API contract, state machine and scorer specification; no implementation-dependent grading. Owner: technical lead. Capture the baseline before modifying source content.

### M3. Time-box integration checks - 45-60 minutes

After authorization to implement, test: installed Codex auth works without printing credentials; HarnessAgent Codex adapter produces schema-valid configuration in an isolated workspace using explicit direct authentication; one Gateway model can call a tool; Resend can send to a team-controlled address and return an inbound reply through HTTPS; chosen Workflow World survives an application restart and resumes after a webhook. Exit: real traces for these checks. Do not treat documentation as an executed test.

Fallbacks: use the official OpenAI Codex SDK or CLI behind the same internal onboarding interface if the experimental harness blocks progress; retain AI SDK for commercial buyer agents. Use an established Postgres job worker and explicit persisted states if self-hosted Workflow compatibility consumes more than an hour. Keep signed callback delivery and polling fallback regardless. Secrets remain outside the repo and outside uploaded remote jobs.

### M4. Shared foundation - 1.5-2 hours

One Next.js/TypeScript codebase, Postgres schema and migrations, authenticated owner session, tenant-scoped data access, task/outbox primitives, seed/reset command, health checks, and Docker Compose. Exit: two tenants cannot read or mutate each other's inquiries; database state survives restart. Do not build custom auth or a generic plugin marketplace.

## 08. Milestones continued and scope control

### M5. URL to approved presence - 2-3 hours

Implement safe fetch, structured extraction with evidence, missing-field interview, owner approval, human rendering and generated manifest/OpenAPI/MCP projections. Exit: onboard two different fixture hotels through the same pipeline with no route or app generation; editing one approved fact updates both representations. Input support for the demo is URL-first. Name/Maps lookup and phone/WhatsApp onboarding follow later.

### M6. End-to-end inquiry and reservation - 3-4 hours

Connect buyer tool calls to persisted inquiries, merchant email, dashboard offer approval, optional parsed email reply, traveller approval, and fictional inventory commit. Deliver signed task callbacks with retries. Exit: a complete request-to-reservation trace, a duplicate delivery that does not duplicate a booking, and an expired offer rejected without charging or booking. The real email bridge needs at least one successful inbound reply outside a replay.

### M7. Permission-based return visit - 1-1.5 hours

Implement subscription, owner-created event, outbox delivery, buyer-agent receiver and a relevance decision. Exit: subscribed relevant event triggers a suggestion; unsubscribed/expired subscription blocks delivery; duplicate events do not retrigger. Use our demo buyer, not an assumed universal ChatGPT webhook.

### M8. Controlled benchmark and impact view - 2-3 hours

Run the frozen task suite across three selected model families and intervention arms, with repeats if budget allows. Exit: denominators, errors, raw traces, model IDs, source version and task-level results are visible. Run a 12-episode smoke pass first, then the full matrix; avoid changing prompts after seeing holdout scores. Bulk suites and substantial builds use the installed remote-work helper if likely to affect local responsiveness.

### M9. Pitch freeze and rehearsal - 1.5-2 hours

Run the 180-second narrative, verify every amount and status, record a clearly labelled fallback, test reset, package README and MIT license, and prepare technical backup views. Exit: three rehearsals finish in 2:50-3:00 and all three core moments remain understandable without commentary from the builder. Freeze dependencies and demo data before the final rehearsal.

### Critical path and parallel work, if the team chooses

M0 -> M1 -> M2 -> M3 -> M4 -> M5 -> M6 -> M7 -> M8 -> M9. Once M2 is fixed, a pitch/design person can refine slides and the evaluation owner can prepare fixtures while implementation proceeds. There are no automated subagents or delegated work in this planning pass. Run multiple merchant configurations or policy variants behind one service rather than one autonomous service per customer.

### Cut order when time is short

Cut name/Maps/WhatsApp inputs, voice, PMS/CRM/ERP, payment, autonomous negotiation, domain mapping, detailed analytics and extra verticals first. Keep owner-reviewed onboarding, one real email round trip, valid fictional booking and one consented event. Shrink the benchmark to 12 tasks x 2 models x 2 arms x 1 repeat and label it exploratory. Never cut accurate confirmation semantics, tenant isolation, or truthful demo labels.

## 09. Stack and the agent-runtime decision

### Simple stack

- **Next.js App Router + TypeScript:** owner UI, public human pages, REST routes, MCP transport adapter, webhook receivers and optional demo chat. Use the supported Node runtime, with exact versions pinned after M3.
- **PostgreSQL + Drizzle + Zod:** tenant data, source/evidence versions, tasks, offers, reservations, subscriptions, event inbox/outbox and traces. JSONB for approved merchant configuration; explicit relational state for commercial actions. No vector database is required for a few source pages.
- **Vercel AI SDK 7 + AI Gateway:** bounded buyer-agent reasoning, tool calls, structured extraction and model comparisons. Gateway advertises hundreds of models, not thousands of independent providers. Fetch the enabled catalog and choose three tool-capable model families; record actual route/provider details and costs. [S12]
- **HarnessAgent + Codex adapter:** preferred configurable onboarding worker using the authenticated subscription, conditional on an M3 smoke test. It produces reviewed data/configuration, not customer-specific executable routes. Current documentation lists the Codex adapter; harness packages are experimental. [S13, S14]
- **Workflow SDK:** preferred durable orchestration using an explicitly selected persistent self-hosted World; verify its version and restart behavior. The default Local World is for development. The Worlds directory lists external persistence adapters, including Postgres; their support and maturity differ. Do not describe an untested adapter as production-ready. [S15]
- **Resend:** merchant email sending and receiving, received-email webhook, full-content retrieval and threaded replies. Mailpit can provide an optional local fixture mailbox; it does not replace the real Resend proof. [S16]
- **Tailwind + shadcn/ui:** a small owner workspace with onboarding review, requests, offer response, consent/events and experiment results. The demo buyer is a route in the same application.

### What runs in Compose

Required: `web` and `worker` from the same Next.js/TypeScript repository and image, plus `postgres` with a persistent volume. The worker executes shared server modules and workflow/job handling; it is not a separate backend framework. Optional: Mailpit for fixtures and a narrowly configured HTTPS tunnel for inbound Resend webhooks. Do not expose the entire development machine or database. Actual Workflow adapter service needs are resolved in M3; no Redis unless the selected existing runtime requires it.

Local packaging does not mean offline operation: model calls and Resend still need network access, and external callbacks require a reachable HTTPS endpoint. The application can use a local receiver for the controlled retention demo.

### Subscription versus Gateway authentication

Vercel documents native subscription support for supported harnesses. Explicit `direct` authentication avoids inadvertently choosing Gateway when its credentials exist; direct mode still prioritizes explicit provider credentials, so the onboarding runtime must not inherit unintended API credentials. The host resolves native credentials. Do not copy the user's entire Codex HOME/auth store into a tenant workspace or image. [S14]

The installed CLI is **codex-cli 0.163.0**. Its presence and help output were checked; no inference/authentication test was executed. Official OpenAI docs identify `@openai/codex-sdk` for controlling local Codex threads and distinguish ChatGPT sign-in from API-key usage. Some locally bundled skill text refers to `@cursor/sdk`; that is not the OpenAI SDK selected here. [S17, S18]

Keep the credentialed harness behind a host-side boundary and a narrow job interface. Compose deployability must not depend on baking subscription tokens into an image. If a supported host credential broker cannot be made to work in M3, use a host-side Codex onboarding worker or Gateway-backed configuration extraction for the demo and disclose that deployment choice. Subscription access is quota-limited, not unlimited free inference.

## 10. Onboarding factory and shared API contract

### One application, versioned tenant configurations

Pipeline: resolve business -> fetch allowed sources -> extract source-backed claims -> identify capability template -> ask for missing facts -> validate -> owner review -> publish immutable BusinessVersion -> run evaluation -> activate or roll back. Every tenant uses the same code and database model.

Example capability types: `request_stay_offer`, `request_workspace`, `get_task`, `accept_offer`, `request_cancellation`, `subscribe_events`. A configuration selects these existing capabilities, adds descriptions and validated policy parameters, and selects a known adapter such as `email`. Arbitrary user-provided route code, email recipients, SQL, tools and shell execution are not generated or deployed during onboarding.

The harness can inspect permitted source content and propose the configuration. Its output is untrusted until schema and evidence checks pass. Prices and live inventory cannot be inferred from a marketing page. Unknown operational facts require an owner answer or a human-confirmation capability. Publishing requires demonstrated owner control of the business/contact channel; the fictional fixture uses a team-owned test identity.

### Input resolution

URL is the primary demo input. Name or Maps link resolves a candidate identity and official website, then the owner confirms the match. Use the Places API where appropriate rather than scraping Google Maps; content storage and attribution rules apply, with different treatment for place IDs. Prefer owner-provided facts and first-party website material for the durable profile. A phone number alone does not grant access to WhatsApp or establish business ownership. Voice and WhatsApp require separate integrations and are outside the core slice. [S19]

### Route shape

Keep a stable prefix: `/customers/{slug}`. Under it publish the human page, `/business.json`, `/openapi.json`, `/mcp`, and `/api/v1/...`. REST capabilities include:

- `GET /capabilities` and `GET /offers/{offerId}`: facts/capabilities and the exact immutable offer version.
- `POST /inquiries`: structured requirements, request identity, idempotency key and optional verified callback subscription; returns HTTP 202 plus task ID and status URL.
- `GET /tasks/{taskId}`: current state, next required input, offer artifacts and confirmation evidence; authenticated to the requesting principal.
- `POST /offers/{offerId}/accept`: accepted offer version, approved total/currency, and approval record; conflicting or expired versions fail deterministically.
- `POST /reservations/{id}/cancellation-requests`: creates an explicit cancellation task; it does not claim cancellation before the system of record confirms it.
- `POST /subscriptions` and `DELETE /subscriptions/{id}`: scoped consent, event types, expiry and revocation.

These paths are relative to `/customers/{slug}/api/v1`. Generated OpenAPI and MCP tools call the same service functions. Add a version-pinned A2A adapter if useful; do not claim a custom JSON endpoint is A2A compliant. Later UCP lodging integration must explicitly map its commercial states.

### Discovery and domains

For the demo, the traveller uses a directory whose candidate set is identical before and after publication. It points to the approved merchant capability URLs. Human pages can expose structured data and canonical links; `llms.txt` can be supplementary but is not a universal discovery standard. A future custom domain maps by verified Host to tenant ID; internal rewrites preserve API paths. Do not redirect commercial POST requests through arbitrary 301/302 chains. Tenant identity comes from authenticated routing, not a caller-supplied tenant field.

## 11. Email, authority, and asynchronous delivery

### Commercial state machine

`received -> waiting_for_owner -> offered -> accepted_pending_confirmation -> confirmed`. Additional states: `needs_input`, `rejected`, `expired`, `cancelled`, `failed`. Cancellation can itself remain pending until confirmed. Offer expiration and resource-hold expiration are explicit. An external email-only merchant cannot promise atomic inventory locking; owner confirmation must reconcile the booking system. Our fictional merchant's seeded inventory is the authoritative test system.

The LLM extracts and proposes; deterministic code validates totals, authority, offer versions, capacity and transitions. The owner signs off on concessions and terms. The traveller approves the exact version unless they have explicitly delegated that bounded authority. A database transaction and unique idempotency constraints prevent duplicate commits in the fictional store.

### Merchant email round trip

The inquiry creates a task and an outbox record in one transaction. A worker sends the owner an email with a scoped response link and a unique reply address such as `task+opaque-token@inbound.example`. Never place guest personal details in the token. Store provider message IDs, `In-Reply-To`, task correlation and delivery status.

Resend sends a received-email notification to our webhook. Verify the provider signature over the raw body, deduplicate the event, retrieve full content through the receiving API, and correlate the task. Parsing plain text produces a candidate structured response. Missing amount/currency, conflicting authority, changed sender or uncertain intent routes to dashboard review. A signed webhook proves delivery from the provider, not that the email author is authorized to bind the merchant. For the core demo, the authenticated dashboard finalizes the offer; a plain email can safely request review.

Persist state before acknowledging the webhook; enqueue follow-up work and return quickly. A timeout, duplicate email, provider retry or worker restart must not create duplicate offers or bookings. A late reply to an expired task reopens review rather than confirming stale terms.

### How the buyer receives updates

Preferred adapter: registered, authenticated callback for task state changes. A2A already supports such push notifications when advertised. For our own REST adapter return 202 and a task URL, then deliver a signed event containing task ID and event ID; the buyer reads authoritative task state. Use SSE for a connected demo viewer; authenticated polling with backoff is a compatibility fallback, not the main orchestration strategy. [S5]

Persist retry schedules and delivery attempts in the outbox. Back off, expire undeliverable notifications, keep a dead-letter state and allow replay. Assume at-least-once transport; require idempotent application effects. Avoid holding an LLM request open while a human answers an email.

OpenClaw documents opt-in inbound hooks that can wake an agent or submit a turn; its newer MCP Events integration is versioned and opt-in. These are concrete integration examples, not universal compatibility. OpenAI API completion webhooks report jobs in your own application; they do not establish an endpoint for sending marketing messages into an arbitrary user's ChatGPT. [S20, S23]

## 12. Benchmarks to borrow from

- **tau-bench:** interactive tool use under domain policies, evaluated against final database state, with repeated-run reliability. Borrow policy constraints, goal-state assertions and repeat trials; do not reproduce its old leaderboard numbers as current model performance. [S24]
- **tau2-bench:** coordination where both the user and agent can affect a shared environment. Borrow changed availability, missing information, and human intervention. It is not itself a merchant-discovery benchmark. [S25]
- **WebArena:** reproducible tasks in functional websites. Borrow browser-based baseline design and state-based success criteria. Running the full environment is unnecessary for the hackathon slice and could consume the build budget. [S26]
- **ORO Bench:** shopping tasks with changing conditions and outcome grading from recorded purchases. Borrow task variation, sealed records and hidden evaluation cases. Its public implementation focuses on shopping; our hotel task suite is our own benchmark, not an ORO-certified evaluation. [S27]
- **Adobe / Profound visibility measurement:** repeat prompts, citations, representation and competitive share. Borrow evidence capture, but do not equate a brand mention with booking capability or revenue. [S8, S9]

### Three separate measurement questions

**Discovery in deployed products:** run location-and-intent prompts in named consumer answer/search products with genuine retrieval; record date, geography, citations, result set and selection. This is observational, may have personalization and index delays, and cannot prove immediate publication impact. Gateway base-model output does not reproduce ChatGPT's or Google's consumer product behavior.

**Comprehension and action in a controlled environment:** give the same independently chosen candidate businesses and customer tasks to fixed buyer agents; compare representations and reachable actions. This is what we can causally test during the hackathon.

**Economic impact:** track qualified inquiries, owner response time, accepted offers, confirmed bookings, fulfilled stays, net revenue and contribution. Identity and attribution link through inquiry -> offer -> reservation -> fulfilled record. A lead, a confirmation and a completed stay are different outcomes.

### Intervention arms

Use the same underlying business truth, candidate set and seeded operating environment:

- **A. Existing website:** current fixture HTML and existing contact/booking options.
- **B. Improved website:** clearer crawlable HTML and structured data, same existing commercial options.
- **C. Structured presence:** approved business object and API read operations; transactions still use the same baseline channel.
- **D. Full commercial layer:** C plus owner-approved asynchronous inquiry/offer flow and callback.

B vs A tests readability; C vs B tests structured access; D vs C tests the action/operations bridge. If the baseline already has a working booking API, preserve it. If extra owner facts are needed, run a separate information-parity ablation with those facts available in every arm. Otherwise the result measures the whole onboarding bundle, not an API format advantage.

## 13. Our benchmark specification

### Small, reproducible suite

Define **12 scenarios**, three tool-capable model families and three independent repeats per arm: 12 x 3 x 3 x 4 = **432 episodes**. Start with a 12-episode smoke run. A scenario includes several candidate businesses with known eligibility; randomize presentation order and use fresh sessions. Freeze three merchants as an initial fixture set and keep at least one unseen tenant/template for generalization checks if time allows.

Scenarios: standard stay; dog fee; after-midnight arrival; workspace alternative to late checkout; full hotel; changed price; expired offer; duplicate acceptance; merchant timeout; cancellation; relevant opted-in event; revoked or irrelevant event. Four scenarios are held out from prompt/policy tuning. Twelve scenarios are a small exploratory sample, so avoid broad statistical or market claims.

The retention scenarios have a separate denominator and scorer; report discovery/comprehension, transaction, and retention results separately. Do not average unrelated task types into an unexplained agent-readiness score.

### Scoring

For every task, predefine the expected end state. Transaction success requires eligible choice, authorized offer, correct total/currency and policies, customer approval, confirmation evidence and exactly one resulting reservation when a booking is expected. For rejection/timeout/cancellation tasks, the correct end state may be no reservation or a pending task. Deterministic assertions inspect database records and tool traces; an eloquent final answer is not proof.

Report top-k eligible inclusion and selected eligible business in the controlled candidate set; factual claim accuracy with evidence; valid completion rate; reliability across repeats; first-response and end-to-end latency separately; tool calls and token cost; owner touches; invented-confirmation count; duplicate-booking count; and consent violations. For retention report relevant suggestion rate and inappropriate-send/suggestion rate.

Use matched scenario comparisons and show successes/attempts, not only percentages. With more repetitions, compute uncertainty at the task level so repeats do not masquerade as independent scenarios; exploratory intervals remain weak with 12 tasks. Include failures and infrastructure errors transparently. Do not remove a model because it made the result less impressive.

### Fair execution and provenance

Keep buyer objectives, eligible truth, comparable time/tool budgets, network fixtures and temperature settings fixed where supported. Give each arm the tools actually available to that business; disclose differences rather than pretending schemas are identical. Separate model quality from harness/tool quality by holding the harness constant when swapping models. Disable cross-model fallbacks for scored runs or explicitly record and stratify fallback episodes.

Persist run ID, task/fixture revision, arm, candidate order, model and provider, prompt hash, tool schema version, business version, cost/usage, timestamps, trace, final database evidence and scorer version. Estimates that lack provider usage telemetry must be labelled estimates. Set a per-run and overall spend limit before the full suite. No benchmark calls were run for this plan and there are no measured lift numbers yet.

### Experiment loop after the hackathon

Offline proposed variant -> policy/factual validation -> holdout evaluation -> owner approval -> limited live allocation -> qualified outcome and margin analysis -> keep or roll back. Assign a variant at inquiry/session level and keep it stable for the whole transaction. Log exposure before outcomes. Avoid random price discrimination in the demo; test representation and workflow first. Capacity, quality and margin remain constraints, not metrics to trade away for more leads.

## 14. Economics, retention and customer control

### A transparent economic illustration

Assume, solely to illustrate the model, 100 relevant agent-mediated inquiries per month. Increasing confirmed-booking conversion from 20% to 30% produces 10 additional bookings. At CHF 250 booking value, that is **CHF 2,500 additional booked value**. At an assumed 35% contribution margin, that yields CHF 875 before our fee and any additional costs; after the hypothetical CHF 149 subscription, CHF 726 remains. Break-even is about **two** additional bookings at CHF 87.50 contribution each.

These are chosen assumptions, not research findings or prototype results. Deduct cancellations, discounts, variable service cost, commissions, acquisition cost and inference/email cost as applicable. Booked value is not fulfilled revenue. Recovered demand may simply be diverted from an existing direct channel, so incremental impact needs a credible comparison or randomized holdout. Do not claim that the prototype saved a real hotel or prevented a closure.

### Who owns the customer?

The personal agent platform may control much of the discovery interface. The merchant still controls its offering and service delivery; the customer controls permissions and agent choice. "Owns the customer" is a strategic shorthand, not a technical property. Our objective is a portable commercial record and a customer-approved subscription that can survive a change of interface.

An event is structured data: merchant identity, event ID/type, eligibility, dates, location, offer version, expiry, source link and revocation link. It is not a system prompt or a hidden instruction. The personal agent stores it as external, lower-trust information, checks scope and relevance, and decides whether to notify the person. Receipt of an event is not permission to buy.

The merchant should see consent scope, delivery results and aggregate responses; it should not gain the traveller's full chat history, private preferences or spending limits. The buyer can revoke consent and migrate to a different adapter. No universal push inbox exists for all assistant products; our prototype proves one supported callback integration and exposes an adapter boundary.

### Progressive integration roadmap

Pilot with 3-5 hotels through an agency or hospitality partner. Measure onboarding time, owner answer time, qualified task volume, errors and willingness to pay. Add PMS/booking integration only after showing that manual demand exists. Add CRM for consented relationship context; finance/POS/ERP for realized value and repeat visits. Use aggregate experiment evidence to propose improvements, with owner review for commercial changes.

Adobe relevance: existing workflows already address content and AI representation. Our proposed product connects approved representation to what a local business can actually do and promise, then measures outcomes. This is a proposed direction that should be tested with the sponsor, not a claim about Adobe's roadmap.

## 15. C4 architecture views

See `architecture.md` for editable Mermaid source and the next three PDF pages for rendered diagrams:

- **Level 1, system context:** people, buyer-agent platform, Presence, email provider, first-party source sites, model services and future operational systems.
- **Level 2, containers:** browser, Next.js web/API, TypeScript worker, Postgres, host-side credentialed harness, and external services. All app server code remains one Next.js/TypeScript codebase.
- **Level 3, components:** tenant gateway, source ingestion, approved publishing, commercial state machine, merchant response adapter, durable event/outbox handling, consent/relevance boundary and evaluator.

Diagrams express the proposed architecture. Dashed future-system relationships are roadmap items. C4 Level 4 is intentionally omitted: implementation-level classes and functions should follow after scope alignment, rather than inventing code structure now. A separate sequence diagram in the source explains the asynchronous booking flow.

## 16. Risks, readiness and the next decision

### Material risks and the response in scope

- **Distribution:** no guarantee of organic assistant selection. Demonstrate controlled discovery explicitly; pursue index/registry/partner integrations separately.
- **Credibility:** do not imply that all prices, reviews, policies or availability can be derived from a website. Show evidence, unknowns and owner approval.
- **Commitments:** email delivery is not inventory confirmation. Keep pending states and exact offer approval; use a fictional authoritative inventory for the end-to-end proof.
- **Untrusted content:** fetched pages, email and events are data. Prevent them from granting tool authority or changing developer instructions. Restrict outbound fetches and callbacks to avoid private-network access; cap fetch size and redirects.
- **Tenant boundaries:** authenticate owner actions and buyer task access; enforce tenant scope on every query and event. A slug is not authentication. Keep tokenized response links single-purpose and short-lived.
- **Email and callbacks:** signatures, replay protection, idempotent effects, deadlines, retry persistence and a dashboard fallback.
- **Experimental dependencies:** pin a working harness and Workflow adapter after short tests; keep a supported SDK and durable-job fallback. Do not spend the hackathon debugging a general coding factory.
- **Scope:** retention and benchmarking matter, but a convincing booking trace has priority over multiple verticals or enterprise integrations.

### Readiness checklist for the future build

Need at implementation time: Gateway key with a budget; Resend sending capability plus receiving address and webhook secret; a test sender/recipient controlled by the team; a narrowly exposed HTTPS callback URL; confirmed Codex subscription access; fictional source page and inventory; owner and traveller demo identities. Google Places credentials are optional if URL-first scope is accepted. No keys were requested, read, printed or stored in this planning pass.

At the start of this planning pass the folder was empty and had no Git repository. The planning pass created documentation only; it did not deploy an application or install application dependencies. Repository publishing was requested separately afterward; consult the current README and actual Git history for that status. Documents and PDF rendering are lightweight local work. Future heavy builds or bulk suites must use the installed `remote-work --project <absolute-project-path> <task>` helper where workload warrants it, following the supplied shared-host policy; credentials must not be synced.

### Alignment recommendation

Agree on **one hotel, one nonstandard request, and publish/transact/reconnect** before implementing. Keep the shared application with versioned tenant configurations. Use the authenticated harness for onboarding where the smoke test confirms it works, and an explicitly persisted commercial workflow for human waits. The next work item is M1, a timed pitch/storyboard review; it is not an instruction to begin coding.
