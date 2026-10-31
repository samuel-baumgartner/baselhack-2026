# Presence - reviewed C4 architecture

Version 2 | 31 October 2026 | Proposed architecture, not a deployed system.

The running demo is one shared Next.js/TypeScript application, with its own buyer-agent simulator. The presenter operates the owner and traveller views; each action still has an authorized domain actor. Independent consumer-assistant platforms and PMS/POS/CRM/ERP adapters are future integrations.

`architecture.json` is the canonical node/relationship data, including native-vector PDF layout. Run `python docs/render_architecture.py` to regenerate the Mermaid blocks. `render_plan.py` reads the same data. Change the graph once rather than maintaining separate Mermaid and PDF models.

<!-- BEGIN GENERATED C4 -->

## C4 Level 1 - system context

The running prototype includes its demo buyer. Future platforms are outside the boundary.

```mermaid
flowchart TB
  owner["Hotel owner / staff<br/>Person<br/>Reviews facts, terms and commercial approval"]
  presenter["Presenter<br/>Person<br/>Operates seeded demo; cannot override actor scopes"]
  traveller["Traveller<br/>Person<br/>Approves terms and consent; operated by presenter"]
  presence["Presence<br/>Software system in scope<br/>Presentation UI, merchant service and demo buyer agent"]
  source["Merchant website<br/>External software system<br/>Approved first-party source pages"]
  mailbox["Owner mailbox / client<br/>External software system<br/>Actual owner email and reply"]
  resend["Resend<br/>External software system<br/>Send, receive and notify"]
  gateway["AI Gateway / providers<br/>External software systems<br/>Bounded buyer and parsing inference"]
  codex["Native Codex runtime<br/>Host-side integration<br/>Bounded onboarding; fallback is disclosed"]
  futurebuyer["Independent buyer agents<br/>Future external systems<br/>Use the same public API and callbacks"]
  futureops["PMS / POS / CRM / ERP<br/>Future external systems<br/>Operational truth and fulfilled outcomes"]
  owner -->|"1. Reviews and approves business facts and commercial offers / HTTPS session"| presence
  traveller -->|"2. Submits needs; approves exact terms and consent / HTTPS buyer-scoped actions"| presence
  presence -->|"3. Fetches bounded source material / HTTP(S)"| source
  presence -->|"4. Sends inquiries and retrieves received mail / Resend HTTPS API"| resend
  resend <-->|"5. Delivers inquiry; owner sends an actual reply / Email transport"| mailbox
  resend -->|"6. Notifies of received mail / Signed HTTPS webhook"| presence
  presence -->|"7. Runs bounded model calls / Authenticated HTTPS"| gateway
  presence -->|"8. Requests configuration proposals; native credentials stay host-side / Authenticated local job boundary"| codex
  futurebuyer -.->|"9. Requests offers; receives scoped callbacks / Public HTTPS API; future protocol adapters"| presence
  presence -.->|"10. Connects authorized operational adapters / Vendor APIs"| futureops
  presenter -->|"11. Operates only seeded demo session; changes visible actor context / Authorized demo controls"| presence
```


## C4 Level 2 - containers

One Next.js/TypeScript repository; pg-boss worker and database persist human waits.

```mermaid
flowchart TB
  browser["Presentation browser<br/>Browser container<br/>Owner and traveller views; independent actor scopes"]
  mail["Resend + owner mailbox<br/>External systems<br/>Actual email round trip"]
  models["Gateway / model services<br/>External systems<br/>Buyer and parse inference"]
  host["Host-side Codex adapter<br/>External integration process<br/>Narrow jobs; native auth stays on host"]
  futurebuyer["Independent buyer platform<br/>Future external system<br/>Uses public merchant API; receives callbacks"]
  subgraph scope["Presence system - shared Next.js / TypeScript repository"]
    web["Web and API<br/>Container / Next.js Node<br/>Presentation UI, auth, REST/MCP, webhook and SSE endpoints"]
    worker["Job + demo-agent worker<br/>Container / Node TypeScript<br/>pg-boss, onboarding, demo buyer, mail and callback jobs"]
    db["PostgreSQL<br/>Database container<br/>Domain records, inbox/outbox, pg-boss jobs and messages"]
  end
  browser -->|"1. Uses presentation and owner/buyer-scoped actions / HTTPS; SSE snapshots/events"| web
  mail -->|"2. Delivers received-email notification / Signed HTTPS webhook"| web
  worker -->|"3. Sends inquiry; fetches received reply content / Resend HTTPS API"| mail
  worker -->|"4. Runs bounded buyer/parsing calls / AI SDK / HTTPS"| models
  web -->|"5. Commits domain state and outbox together / Tenant-scoped SQL transaction"| db
  worker -->|"6. Dispatches outbox; claims jobs; persists inbox/resume state / SQL / pg-boss"| db
  worker -->|"7. Demo buyer invokes public merchant tools and signed receiver / HTTP API + callback; no private shortcuts"| web
  worker -->|"8. Requests validated onboarding proposal / Authenticated local-only job boundary"| host
  futurebuyer -.->|"9. Uses public commerce tools and task reads / HTTPS / MCP; later A2A or UCP adapter"| web
```


## C4 Level 3 - web/API components

This view decomposes the web/API container only. Worker execution is outside it.

```mermaid
flowchart TB
  db["Postgres repositories<br/>Adjacent database container<br/>Transactions, inbox/outbox and approved records"]
  worker["Job / demo-agent worker<br/>Adjacent worker container<br/>Extraction, mail parsing, buyer resumption, delivery and evaluation"]
  subgraph scope["Web/API container - Next.js / Node"]
    gate["Identity and actor gate<br/>Component<br/>Better Auth session, memberships, buyer scope, demo controls"]
    views["Presentation + owner UI<br/>Component<br/>Tailwind/shadcn; forms, chat, sourced cards"]
    facade["Merchant REST / MCP facade<br/>Component<br/>Public tools and private task scope"]
    delivery["Webhook / event boundary<br/>Component<br/>Signed inbox, buyer receiver and resumable SSE"]
    publish["Presence publication<br/>Component<br/>Owner-approved immutable business versions"]
    trade["Commercial service<br/>Component<br/>Inquiry, immutable offer and reservation rules"]
    consent["Subscription service<br/>Component<br/>Scope, expiry, frequency and revocation"]
  end
  gate -->|"1. Authorizes presenter/owner views / Server session and membership"| views
  gate -->|"2. Authorizes merchant and buyer requests / Validated HTTP/MCP context"| facade
  gate -->|"3. Checks provider signatures, buyer callback auth and SSE scope / HTTP boundary policy"| delivery
  views -->|"4. Reviews and publishes sourced configuration / Authorized action / service call"| publish
  facade -->|"5. Validates inquiry, offer and acceptance / Typed service call"| trade
  facade -->|"6. Creates or revokes permitted subscription / Typed service call"| consent
  publish -->|"7. Commits approved publication version / Tenant-scoped SQL"| db
  trade -->|"8. Commits commercial state and outbox atomically / SQL transaction"| db
  consent -->|"9. Persists consent and event outbox / Tenant-scoped SQL"| db
  delivery -->|"10. Persists deduplicated inbound events before acknowledgment / SQL inbox + authorized event reads"| db
  worker -->|"11. Runs committed jobs and records outcomes / SQL / pg-boss; shared service modules"| db
```

<!-- END GENERATED C4 -->

## Container responsibilities

- **Web/API:** presentation and owner UI, Better Auth boundary, owner membership/buyer scopes, public REST/MCP, provider/buyer webhook inbox and authorized SSE reads. Database mutations and their outbox records commit together.
- **Worker:** pg-boss jobs, bounded onboarding, mail send/parse, the demo buyer model loop, signed callback delivery, resume scheduling, consent-aware event delivery and evaluations. It invokes the merchant HTTP API as the buyer and uses shared services only for its authorized worker responsibilities.
- **Postgres:** commercial truth, approved versions, messages, authorization records, inbox/outbox, queue jobs and delivery attempts. A dispatcher schedules jobs from committed outbox rows. Replaying a queue job does not replay an already-applied domain effect.
- **Host-side Codex adapter:** private integration for typed configuration proposals, with native credentials outside Compose and tenant workspaces. Gateway extraction is a disclosed fallback. Neither is a public shell execution endpoint.

Level 3 decomposes the web/API container. Its adjacent worker contains separate extraction, mail, buyer, delivery and evaluation handlers; the evaluation handler is not a consent service. Level 4 is deferred; module ownership and invariants are specified in [implementation-spec.md](implementation-spec.md).

## Dynamic view - booking through real email

```mermaid
sequenceDiagram
  actor Traveller
  participant Buyer as Demo buyer agent
  participant API as Merchant REST/MCP API
  participant DB as PostgreSQL
  participant Worker as pg-boss worker
  participant Resend
  actor Owner
  Buyer->>API: Create scoped inquiry with idempotency key
  API->>DB: Commit inquiry plus email outbox in one transaction
  API-->>Buyer: 202 task ID and authorized read URL
  Worker->>DB: Dispatch committed outbox, claim send job
  Worker->>Resend: Send real inquiry, persist provider message ID
  Resend-->>Owner: Deliver email to prepared real mailbox
  Owner->>Resend: Send actual reply via mail client
  Resend->>API: Signed received-email notification
  API->>DB: Commit deduplicated inbox event
  API-->>Resend: Acknowledge after persistence
  Worker->>DB: Claim committed parse task
  Worker->>Resend: Retrieve full received email
  Worker->>DB: Save structured offer proposal for owner review
  Owner->>API: Authenticated approval of exact offer revision
  API->>DB: Commit immutable approved offer plus callback outbox
  Worker->>API: Signed task update to demo buyer receiver
  API->>DB: Persist event plus buyer-resume outbox, deduplicate
  API-->>Worker: Acknowledge accepted event
  Worker->>Buyer: Resume bounded buyer turn from persisted context
  Buyer->>API: Read authoritative task and approved offer
  Buyer->>Traveller: Present CHF 205 and exact terms for approval
  Traveller->>API: Save approval for this offer revision
  Buyer->>API: Accept approved revision with idempotency key
  API->>DB: Validate authority, total, expiry and capacity atomically
  alt Fictional inventory is the system of record
    API->>DB: Commit capacity and confirmed reservation
    API-->>Buyer: Confirmed fictional reservation with receipt
  else Real email-only merchant without live inventory adapter
    API->>DB: Commit pending merchant confirmation plus outbox
    API-->>Buyer: Pending reservation, no confirmation claim
    Owner->>API: Reconcile external booking and approve reference
    API->>DB: Store confirmation evidence and notification outbox
  end
```

## Dynamic view - consented follow-up

```mermaid
sequenceDiagram
  actor Traveller
  actor Owner
  participant API as Presence API
  participant DB as PostgreSQL
  participant Worker as Dispatcher and jobs
  participant Receiver as Demo buyer receiver
  participant Buyer as Buyer agent
  Traveller->>API: Explicit scoped subscription
  API->>DB: Store consent, expiry and frequency cap
  Owner->>API: Publish relevant fictional event
  API->>DB: Commit immutable event and outbox
  Worker->>DB: Claim delivery and recheck current consent
  alt Still subscribed and event permitted
    Worker->>Receiver: Signed event with unique ID and timestamp
    Receiver->>DB: Commit deduplicated inbox plus resume outbox
    Receiver-->>Worker: Acknowledge after persistence
    Worker->>Buyer: Run bounded relevance check
    Buyer->>DB: Persist suggestion or suppression decision
    API-->>Traveller: Authorized UI event and current suggestion
  else Revoked, expired or frequency-limited
    Worker->>DB: Store suppressed delivery reason
  end
  Traveller->>API: Revoke subscription
  API->>DB: Disable future delivery; record revocation
```

Callbacks are at-least-once, signed and idempotent. They target registered destinations; user-supplied URLs do not grant egress. A notification is external data and never grants purchase authority. A browser SSE stream is a view of persisted state, not the durable agent runtime.
