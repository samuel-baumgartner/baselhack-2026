# Plan review - version 2

31 October 2026. Review of the proposed product, demo, user flows and architecture; no application has been implemented or tested.

## Verdict

The commercial idea and email-first adoption path make sense. Version 1 was a strategy brief, not yet a build contract. Its weakest points were an undefined presentation experience, mixed demo/future boundaries, an unresolved durability choice, and insufficient detail around who can confirm a booking. These are corrected in version 2 and the [implementation specification](implementation-spec.md).

## Confirmed direction

The user clarified that the deliverable is for the final presentation and that **URL onboarding, booking through real email, and an opted-in agent follow-up must all be live**. The selected interface is a standalone Next.js application using Tailwind and shadcn/ui. It is not an embedded ChatGPT application. The presenter operates the demo; owner and traveller remain separate domain actors with separate authority.

The user chose to proceed without supplying a deadline. No submission time is assumed. Build the three connected moments first and reduce experiment breadth and roadmap features before cutting any of those moments. Real mail and model credentials are setup dependencies, not an invitation to invent successful results.

## Critical issues and corrections

### P1. The user interface had no concrete product flow

Version 1 listed an owner dashboard and an optional traveller chat without explaining how the audience would follow them. A builder could have produced disconnected screens, generic analytics cards or a chat-only prototype.

**Correction:** a single presentation route with three fixed chapters, a clear owner/traveller context switch, a task-focused conversation and a persistent business/offer panel. Structured cards handle publication, approval, terms and subscription; chat supports the work. Screen states, component choices, visual tokens and responsive behavior are specified. See specification sections 1-4.

### P1. External buyer agents and our demo buyer were conflated

The old context diagram described an external buyer platform, while the container notes put its loop in our worker. That obscured what interoperability the prototype could actually prove.

**Correction:** the running prototype contains its own buyer-agent simulator with an isolated principal. It invokes the public merchant API, not private service shortcuts. Future external buyer platforms are dashed integrations. The context, container and component diagrams now use that same boundary. The component view decomposes the web/API container only; worker responsibilities are shown as an adjacent container.

### P1. Durable execution was not selected

The old plan relied on an unspecified self-hosted Workflow World and also proposed a fallback queue. The required worker and database connections could have been discovered too late.

**Correction:** select PostgreSQL plus pg-boss for jobs, with explicit persisted domain state and an outbox. Human waits occupy database records, not a live LLM loop. A durable queue is not an exactly-once guarantee for email or bookings. The commercial transaction and outbox share a SQL transaction; a dispatcher schedules jobs from committed outbox records, so queue/database commits do not need to be magically atomic. Workflow SDK remains a future alternative, not a second runtime to build now. [S28]

### P1. Offer acceptance and booking confirmation were underspecified

A request status was used to stand for offers, holds and reservations. A real email-only hotel cannot atomically reserve inventory just because a customer accepts an offer.

**Correction:** separate inquiry, immutable offer revision, reservation attempt, confirmation evidence and delivery state. In the fictional inventory adapter, acceptance validates and commits capacity atomically. In an email-only adapter, acceptance creates a pending reservation and a second owner-confirmation step; confirmation requires an owner action or authoritative external reference. UI status and agent language follow the selected adapter.

### P1. Real email was simultaneously mandatory and optional

Version 1 offered a dashboard shortcut and suggested demonstrating real inbound mail only in Q&A. That fails the clarified scope.

**Correction:** the on-stage booking flow includes an actual outbound email and an actual owner reply through Resend inbound. Parsed mail becomes a proposed offer; an authenticated owner action approves it. An email client is prepared before presenting. The dashboard is for explicit approval and recovery, not a substitute for claiming the email round trip occurred. Provider message IDs and inbound receipt are inspectable; mail delivery time is a real external dependency.

### P1. Authority was missing from the presentation controls

One browser operating both sides can accidentally become a single omnipotent account. A role label in the UI provides no authorization.

**Correction:** Better Auth manages the presenter session; explicit owner membership and a separate seeded buyer principal govern actions. Demo orchestration is enabled only for seeded demo tenants behind a server-side feature flag and operator permission. Production owner actions and buyer actions retain independent authorization and audit identities. Role switching changes the visible context, not the underlying permissions. [S29]

### P1. The benchmark and protocol scope could consume the hackathon

432 episodes, multiple protocol adapters, a full growth dashboard and three live moments are too much to promise before the basic slice works. Base-model comparisons also cannot demonstrate immediate organic search lift.

**Correction:** REST/OpenAPI and a real MCP tool adapter share one commercial service. A2A and UCP are deferred adapters. Run six core scenarios, two model families, three repeats and two arms for 72 exploratory episodes after smoke checks. The 12-task/four-arm matrix remains an expansion. Keep three live demo moments mandatory and show only measured results.

### P2. Technical structure was too vague to constrain code quality

The old plan did not select an authentication library, specify transaction/queue boundaries, distinguish chat streaming from task events, or define acceptance tests and module ownership.

**Correction:** the implementation specification fixes those choices, error semantics, actor access, schemas, job handlers, replay behavior and a feature-oriented directory layout. Visual and functional exit checks are explicit. The product cannot be called complete on the basis of a successful compilation.

### P2. Two separately maintained diagram representations could drift

The Markdown Mermaid and the PDF renderer used separate edge definitions. The rendered level 3 also combined consent and evaluation even though they are different responsibilities.

**Correction:** architecture node/edge data and layout are stored in `architecture.json`; the same data generates the Mermaid blocks and rendered PDF. Consent and evaluation are separated. Diagram relationships include direction and technology; a single arrow is not described as bidirectional unless both directions are drawn.

### P2. The pitch had little allowance for live actions

The original 359-word speaker draft left insufficient room for extraction, real mail and approvals inside three minutes.

**Correction:** reduce spoken copy, preload only non-demonstrated setup, and use one continuous UI. Targets are rehearsal goals, not guaranteed provider latency. Preflight real mail, keep an honest failure/retry state, and retain a labelled recording for external outages; a replay does not count as the required live proof.

## Review exit

The documentation is implementation-ready under the clarified standalone-demo scope. Application readiness is not established. Before coding the full UI, verify the real email round trip, harness access and durable job restart behavior; then implement and rehearse the connected flow. No more product-choice questions are pending from this review.
