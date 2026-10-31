# Presence - proposed C4 architecture

Planning only, 31 October 2026. The system is one shared application. C4 containers describe deployable processes and stores, not separate product codebases. External systems and roadmap integrations are explicit. Mermaid flowcharts are used to render the C4 concepts without a remote diagram service.

## C4 Level 1 - system context

```mermaid
flowchart TB
  owner["Hotel owner / staff<br/>Person<br/>Publishes facts and approves offers"]
  guest["Traveller<br/>Person<br/>Delegates a request and approves terms"]
  buyer["Personal agent platform<br/>External software system<br/>Discovers, requests, checks, suggests"]
  presence["Presence<br/>Software system in scope<br/>Business-controlled presence and commerce layer"]
  email["Resend + merchant inbox<br/>External software system<br/>Email delivery and owner responses"]
  sources["Merchant website<br/>External software system<br/>First-party source material"]
  ai["AI Gateway / model services / Codex<br/>External software systems<br/>Inference and onboarding assistance"]
  ops["PMS / POS / CRM / ERP<br/>Future external systems<br/>Operational truth and fulfilled outcomes"]
  owner -->|"Approves publication and offers / HTTPS"| presence
  guest -->|"Gives requirements and approval"| buyer
  buyer -->|"Queries capabilities, requests offers / HTTPS"| presence
  presence -->|"Task updates and opted-in events / signed HTTPS"| buyer
  presence -->|"Requests owner response / email API"| email
  email -->|"Reply notifications / HTTPS webhook"| presence
  sources -->|"Fetched content / HTTPS"| presence
  presence -->|"Bounded inference / authenticated connection"| ai
  presence -.->|"Later: approved adapters / vendor APIs"| ops
```

The owner retains commercial authority. The traveller's agent is independently operated. A callback reaches a supported receiver; there is no assumed universal consumer-agent inbox.

## C4 Level 2 - containers

```mermaid
flowchart TB
  browser["Owner + demo traveller browser<br/>Container / browser<br/>Review, approval and trace UI"]
  buyer["External buyer-agent platform<br/>External software system"]
  mail["Resend<br/>External software system"]
  ai["AI Gateway + model providers<br/>External software systems"]
  host["Host-side credentialed Codex harness<br/>Trusted integration process<br/>Native subscription stays on host"]
  subgraph application["Presence system boundary - shared Next.js / TypeScript repository"]
    web["Web and API<br/>Container / Next.js Node process<br/>Owner UI, human pages, REST/MCP, webhooks"]
    worker["Durable worker<br/>Container / TypeScript process<br/>Onboarding, workflow steps, outbox and evaluation"]
    db[("PostgreSQL<br/>Container / relational database<br/>Tenant data, tasks, offers, inventory, events, traces")]
    web -->|"Tenant-scoped SQL transactions"| db
    worker -->|"State, jobs and inbox/outbox / SQL"| db
    web -->|"Durable start/resume / workflow runtime"| worker
  end
  browser -->|"HTTPS + SSE"| web
  buyer -->|"REST/MCP; supported A2A adapter / HTTPS"| web
  worker -->|"Signed callback / HTTPS"| buyer
  worker -->|"Send and retrieve mail / HTTPS"| mail
  mail -->|"Received email / signed webhook"| web
  worker -->|"Model requests / HTTPS"| ai
  worker -->|"Narrow configuration job / authenticated local IPC"| host
```

Compose includes web, worker and Postgres; optional Mailpit and a restricted HTTPS tunnel assist demos. The worker uses the same server modules and image, not another backend framework. The workflow World and any additional runtime service are selected and verified in M3. The host harness boundary can be implemented through a supported broker/bridge; do not assume credentials automatically appear inside Docker. The demo traveller's model loop can run in the worker; an external agent is shown to clarify the future integration boundary.

## C4 Level 3 - application components

```mermaid
flowchart TB
  incoming["Owner browser / buyer agents / Resend<br/>External callers"]
  subgraph app["Next.js web/API and shared server modules, executed by web + worker"]
    gate["Tenant and authorization gateway<br/>Component<br/>Session, task scope, signatures, rate limits"]
    ingest["Onboarding compiler<br/>Component<br/>Fetch, extract, ask, validate"]
    publish["Approved presence publisher<br/>Component<br/>BusinessVersion to HTML / JSON / OpenAPI / MCP"]
    trade["Commercial state machine<br/>Component<br/>Inquiries, offers, approval, confirmation"]
    mail["Merchant response adapter<br/>Component<br/>Email routing, parsing, dashboard review"]
    events["Durable events and outbox<br/>Component<br/>Persisted waits, retries, deduplication"]
    consent["Consent and subscription service<br/>Component<br/>Scope, expiry, revocation, event eligibility"]
    eval["Evaluation and experiment service<br/>Component<br/>Frozen tasks, variants, deterministic scoring"]
    gate --> ingest
    gate --> publish
    gate --> trade
    gate --> mail
    gate --> consent
    ingest -->|"Validated draft; owner approves"| publish
    trade -->|"Owner task"| mail
    mail -->|"Approved structured response"| trade
    trade -->|"State event"| events
    consent -->|"Permitted merchant event"| events
    eval -->|"Same public tools; isolated fixture tenants"| trade
  end
  incoming -->|"Authenticated HTTP"| gate
  db[("Postgres<br/>External container for this view<br/>Versioned tenant data and commercial records")]
  harness["Codex harness boundary<br/>External integration process"]
  recipient["Buyer-agent callback receiver<br/>External system<br/>Treats events as external data"]
  ingest -->|"Bounded configuration task"| harness
  publish -->|"Approved version"| db
  trade -->|"Atomic state transition"| db
  events -->|"Inbox/outbox and retry schedule"| db
  consent -->|"Subscription state"| db
  eval -->|"Run evidence and scores"| db
  events -->|"Signed at-least-once delivery"| recipient
```

Commercial mutation is deterministic. LLM proposals do not bypass authorization or state checks. C4 Level 4 is deferred until implementation.

## Dynamic view - asynchronous booking

```mermaid
sequenceDiagram
  actor Traveller
  participant Buyer as Buyer agent
  participant API as Presence API
  participant DB as Postgres
  participant Worker as Durable worker
  participant Mail as Resend
  actor Owner
  Buyer->>API: Create inquiry with idempotency key
  API->>DB: Save inquiry + owner-email outbox atomically
  API-->>Buyer: 202 task ID and status URL
  Worker->>DB: Claim persisted email job
  Worker->>Mail: Send requirements and scoped response link
  Mail-->>Owner: Owner email
  Owner->>Mail: Reply with proposed offer
  Mail->>API: Signed received-email webhook
  API->>DB: Deduplicate, correlate and persist incoming event
  API-->>Mail: Acknowledge after persistence
  Worker->>Mail: Fetch complete received email
  Worker->>DB: Store parsed draft; request owner review
  Owner->>API: Authenticate and approve offer version
  API->>DB: Save immutable offer + callback outbox
  Worker-->>Buyer: Signed task-updated event
  Buyer->>API: Read current task and offer
  Buyer->>Traveller: Request approval of CHF 205 and exact terms
  Traveller-->>Buyer: Approve this offer version
  Buyer->>API: Accept offer with idempotency key
  API->>DB: Validate version, authority, expiry; commit fictional inventory
  API-->>Buyer: Confirmed fictional reservation and receipt
  Note over API,Owner: Real email-only merchant: acceptance stays pending until owner confirms in system of record
```
