import type {
  BusinessProfile,
  OfferTerms,
  Requirements,
} from "@/lib/contracts";
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const created = () =>
  timestamp("created_at", { withTimezone: true }).defaultNow().notNull();
export const tenants = pgTable("tenants", {
  id: uuid().primaryKey(),
  slug: text().unique().notNull(),
  name: text().notNull(),
  publishedVersion: uuid(),
  seeded: boolean().default(false).notNull(),
  createdAt: created(),
});
export const memberships = pgTable(
  "owner_memberships",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: text().notNull(),
    tenantId: uuid()
      .references(() => tenants.id)
      .notNull(),
    role: text().notNull(),
  },
  (table) => [
    uniqueIndex("membership_user_tenant").on(table.userId, table.tenantId),
  ],
);
export const onboardingRuns = pgTable("onboarding_runs", {
  id: uuid().primaryKey().defaultRandom(),
  tenantId: uuid()
    .references(() => tenants.id)
    .notNull(),
  sourceUrl: text().notNull(),
  status: text().notNull(),
  sourceText: text(),
  profile: jsonb().$type<BusinessProfile>(),
  provider: text(),
  error: text(),
  createdAt: created(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
export const businessVersions = pgTable("business_versions", {
  id: uuid().primaryKey().defaultRandom(),
  tenantId: uuid()
    .references(() => tenants.id)
    .notNull(),
  profile: jsonb().$type<BusinessProfile>().notNull(),
  sourceUrl: text().notNull(),
  approvedBy: text().notNull(),
  createdAt: created(),
});
export const inquiries = pgTable(
  "inquiries",
  {
    id: uuid().primaryKey().defaultRandom(),
    tenantId: uuid()
      .references(() => tenants.id)
      .notNull(),
    buyerId: uuid().notNull(),
    idempotencyKey: text().notNull(),
    prompt: text().notNull(),
    requirements: jsonb().$type<Requirements>().notNull(),
    status: text().notNull(),
    mailStatus: text().default("queued").notNull(),
    mailProvider: text().notNull(),
    messageId: text(),
    replyToken: text().notNull(),
    replyText: text(),
    replyMessageId: text(),
    proposedTerms: jsonb().$type<OfferTerms>(),
    error: text(),
    createdAt: created(),
  },
  (t) => [
    uniqueIndex("inquiry_idempotency").on(
      t.tenantId,
      t.buyerId,
      t.idempotencyKey,
    ),
  ],
);
export const offers = pgTable("offers", {
  id: uuid().primaryKey().defaultRandom(),
  tenantId: uuid()
    .references(() => tenants.id)
    .notNull(),
  inquiryId: uuid()
    .references(() => inquiries.id)
    .notNull(),
  businessVersion: uuid().notNull(),
  terms: jsonb().$type<OfferTerms>().notNull(),
  totalMinor: integer().notNull(),
  status: text().default("published").notNull(),
  approvedBy: text().notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: created(),
});
export const travellerApprovals = pgTable("traveller_approvals", {
  id: uuid().primaryKey().defaultRandom(),
  tenantId: uuid().notNull(),
  buyerId: uuid().notNull(),
  offerId: uuid()
    .references(() => offers.id)
    .notNull(),
  totalMinor: integer().notNull(),
  createdAt: created(),
});
export const inventory = pgTable(
  "inventory",
  {
    id: uuid().primaryKey().defaultRandom(),
    tenantId: uuid()
      .references(() => tenants.id)
      .notNull(),
    day: text().notNull(),
    remaining: integer().notNull(),
  },
  (t) => [uniqueIndex("inventory_tenant_day").on(t.tenantId, t.day)],
);
export const reservations = pgTable(
  "reservations",
  {
    id: uuid().primaryKey().defaultRandom(),
    tenantId: uuid()
      .references(() => tenants.id)
      .notNull(),
    buyerId: uuid().notNull(),
    offerId: uuid()
      .references(() => offers.id)
      .unique()
      .notNull(),
    inquiryId: uuid()
      .references(() => inquiries.id)
      .notNull(),
    idempotencyKey: text().notNull(),
    reference: text().unique().notNull(),
    status: text().notNull(),
    totalMinor: integer().notNull(),
    terms: jsonb().$type<OfferTerms>().notNull(),
    arrival: text().notNull(),
    departure: text().notNull(),
    createdAt: created(),
  },
  (t) => [
    uniqueIndex("reservation_idempotency").on(
      t.tenantId,
      t.buyerId,
      t.idempotencyKey,
    ),
  ],
);
export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid().primaryKey().defaultRandom(),
    tenantId: uuid()
      .references(() => tenants.id)
      .notNull(),
    buyerId: uuid().notNull(),
    categories: jsonb().$type<string[]>().notNull(),
    active: boolean().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    lastDeliveredAt: timestamp("last_delivered_at", { withTimezone: true }),
    createdAt: created(),
  },
  (t) => [uniqueIndex("subscription_tenant_buyer").on(t.tenantId, t.buyerId)],
);
export const merchantEvents = pgTable("merchant_events", {
  id: uuid().primaryKey().defaultRandom(),
  tenantId: uuid()
    .references(() => tenants.id)
    .notNull(),
  title: text().notNull(),
  description: text().notNull(),
  category: text().notNull(),
  createdAt: created(),
});
export const deliveries = pgTable(
  "deliveries",
  {
    id: uuid().primaryKey().defaultRandom(),
    tenantId: uuid().notNull(),
    eventId: uuid()
      .references(() => merchantEvents.id)
      .notNull(),
    subscriptionId: uuid()
      .references(() => subscriptions.id)
      .notNull(),
    status: text().notNull(),
    suggestion: text(),
    reason: text(),
    createdAt: created(),
  },
  (t) => [
    uniqueIndex("delivery_event_subscription").on(t.eventId, t.subscriptionId),
  ],
);
export const messages = pgTable("messages", {
  id: uuid().primaryKey().defaultRandom(),
  tenantId: uuid().notNull(),
  buyerId: uuid().notNull(),
  role: text().notNull(),
  chapter: text().notNull(),
  text: text().notNull(),
  state: text().default("complete").notNull(),
  createdAt: created(),
});
export const taskEvents = pgTable("task_events", {
  id: uuid().primaryKey().defaultRandom(),
  tenantId: uuid().notNull(),
  kind: text().notNull(),
  actor: text().notNull(),
  title: text().notNull(),
  detail: text(),
  createdAt: created(),
});
export const inbox = pgTable("inbox_events", {
  id: text().primaryKey(),
  provider: text().notNull(),
  createdAt: created(),
});
export const outbox = pgTable("outbox_events", {
  id: uuid().primaryKey().defaultRandom(),
  tenantId: uuid().notNull(),
  type: text().notNull(),
  recordId: uuid().notNull(),
  dispatched: boolean().default(false).notNull(),
  createdAt: created(),
});
