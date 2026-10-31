CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS "user" (
  id text PRIMARY KEY, name text NOT NULL, email text NOT NULL UNIQUE,
  "emailVerified" boolean NOT NULL DEFAULT false, image text,
  "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS session (
  id text PRIMARY KEY, token text NOT NULL UNIQUE, "userId" text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  "expiresAt" timestamptz NOT NULL, "ipAddress" text, "userAgent" text,
  "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS account (
  id text PRIMARY KEY, "accountId" text NOT NULL, "providerId" text NOT NULL,
  "userId" text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  "accessToken" text, "refreshToken" text, "idToken" text,
  "accessTokenExpiresAt" timestamptz, "refreshTokenExpiresAt" timestamptz,
  scope text, password text,
  "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now(),
  UNIQUE("providerId","accountId")
);
CREATE TABLE IF NOT EXISTS verification (
  id text PRIMARY KEY, identifier text NOT NULL, value text NOT NULL, "expiresAt" timestamptz NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY, slug text UNIQUE NOT NULL, name text NOT NULL,
  published_version uuid, seeded boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS owner_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id text NOT NULL REFERENCES "user"(id),
  tenant_id uuid NOT NULL REFERENCES tenants(id), role text NOT NULL, UNIQUE(user_id,tenant_id)
);
CREATE TABLE IF NOT EXISTS onboarding_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL REFERENCES tenants(id),
  source_url text NOT NULL, status text NOT NULL, source_text text, profile jsonb, provider text, error text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS business_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL REFERENCES tenants(id),
  profile jsonb NOT NULL, source_url text NOT NULL, approved_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL REFERENCES tenants(id),
  buyer_id uuid NOT NULL, idempotency_key text NOT NULL, prompt text NOT NULL, requirements jsonb NOT NULL,
  status text NOT NULL, mail_status text NOT NULL DEFAULT 'queued', mail_provider text NOT NULL,
  message_id text, reply_token text NOT NULL, reply_text text, reply_message_id text, proposed_terms jsonb, error text,
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,buyer_id,idempotency_key)
);
CREATE TABLE IF NOT EXISTS offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL REFERENCES tenants(id),
  inquiry_id uuid NOT NULL REFERENCES inquiries(id), business_version uuid NOT NULL,
  terms jsonb NOT NULL, total_minor integer NOT NULL CHECK(total_minor>=0), status text NOT NULL DEFAULT 'published',
  approved_by text NOT NULL, expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS traveller_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, buyer_id uuid NOT NULL,
  offer_id uuid NOT NULL REFERENCES offers(id), total_minor integer NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL REFERENCES tenants(id),
  day text NOT NULL, remaining integer NOT NULL CHECK(remaining>=0), UNIQUE(tenant_id,day)
);
CREATE TABLE IF NOT EXISTS reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL REFERENCES tenants(id),
  buyer_id uuid NOT NULL, offer_id uuid NOT NULL UNIQUE REFERENCES offers(id), inquiry_id uuid NOT NULL REFERENCES inquiries(id),
  idempotency_key text NOT NULL, reference text UNIQUE NOT NULL, status text NOT NULL, total_minor integer NOT NULL,
  terms jsonb NOT NULL, arrival text NOT NULL, departure text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,buyer_id,idempotency_key)
);
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL REFERENCES tenants(id),
  buyer_id uuid NOT NULL, categories jsonb NOT NULL, active boolean NOT NULL, expires_at timestamptz NOT NULL,
  last_delivered_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(tenant_id,buyer_id)
);
CREATE TABLE IF NOT EXISTS merchant_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL REFERENCES tenants(id),
  title text NOT NULL, description text NOT NULL, category text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL,
  event_id uuid NOT NULL REFERENCES merchant_events(id), subscription_id uuid NOT NULL REFERENCES subscriptions(id),
  status text NOT NULL, suggestion text, reason text, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(event_id,subscription_id)
);
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, buyer_id uuid NOT NULL,
  role text NOT NULL, chapter text NOT NULL, text text NOT NULL, state text NOT NULL DEFAULT 'complete',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS task_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, kind text NOT NULL,
  actor text NOT NULL, title text NOT NULL, detail text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS inbox_events (id text PRIMARY KEY, provider text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS outbox_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL, type text NOT NULL,
  record_id uuid NOT NULL, dispatched boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS outbox_pending ON outbox_events(created_at) WHERE dispatched=false;
CREATE INDEX IF NOT EXISTS task_events_tenant ON task_events(tenant_id,created_at);
CREATE TABLE IF NOT EXISTS runtime_health (id text PRIMARY KEY, last_seen timestamptz NOT NULL);
