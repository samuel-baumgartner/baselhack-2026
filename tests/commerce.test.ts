import { publishPresence } from "@/server/services/onboarding";
import { beforeAll, afterAll, it, expect, vi } from "vitest";
import { handlers } from "@/server/jobs/handlers";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, pool } from "@/server/db";
import * as s from "@/server/db/schema";
import {
  createInquiry,
  approveOffer,
  approveAsTraveller,
  acceptOffer,
  validateOffer,
} from "@/server/services/commerce";
import { parseStructuredReply } from "@/server/adapters/ai";
import { isPublicAddress, fetchSource } from "@/server/adapters/source";
import { signedHeaders, verifyCallback } from "@/server/adapters/callback";
import {
  DEFAULT_REPLY,
  requirementsSchema,
  totalMinor,
  type BusinessProfile,
} from "@/lib/contracts";

vi.mock("@/server/adapters/callback", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/server/adapters/callback")>()),
  sendCallback: vi.fn(async () => {}),
}));
const tenant = randomUUID(),
  buyer = randomUUID();
const requirements = requirementsSchema.parse({
  budgetMinor: 22000,
  currency: "CHF",
  dog: true,
  lateArrival: true,
  workspaceUntil: "14:00",
  quietWorkspace: true,
});
const terms = parseStructuredReply(DEFAULT_REPLY);
const profile: BusinessProfile = {
  name: "Isolated test hotel",
  description: "Test only",
  address: "Test",
  amenities: [],
  checkIn: "15:00",
  checkOut: "11:00",
  lateArrival: true,
  dogsWelcome: true,
  quietWorkspace: true,
  workspaceUntil: "14:00",
  claims: [],
};
beforeAll(async () => {
  if (!process.env.DATABASE_URL?.includes("presence_test"))
    throw new Error("Isolated test database required");
  await db.insert(s.tenants).values({
    id: tenant,
    slug: `test-${tenant}`,
    name: "Test hotel",
    seeded: false,
  });
  const [v] = await db
    .insert(s.businessVersions)
    .values({
      tenantId: tenant,
      profile,
      sourceUrl: "https://example.com",
      approvedBy: "test-owner",
    })
    .returning();
  await db
    .update(s.tenants)
    .set({ publishedVersion: v!.id })
    .where(eq(s.tenants.id, tenant));
  await db
    .insert(s.inventory)
    .values({ tenantId: tenant, day: "2030-11-12", remaining: 1 });
});
afterAll(async () => {
  for (const table of [
    s.outbox,
    s.deliveries,
    s.merchantEvents,
    s.subscriptions,
    s.taskEvents,
    s.travellerApprovals,
    s.reservations,
    s.offers,
    s.inquiries,
    s.inventory,
    s.onboardingRuns,
    s.businessVersions,
  ])
    await db.delete(table).where(eq(table.tenantId, tenant));
  await db.delete(s.tenants).where(eq(s.tenants.id, tenant));
  await pool.end();
});
async function offer() {
  const inquiry = await createInquiry(
    tenant,
    buyer,
    randomUUID(),
    "Test request only",
    requirements,
  );
  await db
    .update(s.inquiries)
    .set({ replyText: DEFAULT_REPLY })
    .where(eq(s.inquiries.id, inquiry.id));
  const offered = await approveOffer(tenant, inquiry.id, terms, "test-owner");
  const approval = await approveAsTraveller(tenant, buyer, offered.id);
  return { offered, approval };
}
it("parses all extras, taxes and workspace independently from checkout", () => {
  expect(totalMinor(terms)).toBe(20500);
  expect(terms.checkOut).toBe("11:00");
  expect(terms.workspaceUntil).toBe("14:00");
  expect(() =>
    parseStructuredReply(DEFAULT_REPLY.replace("All taxes included.", "")),
  ).toThrow();
  expect(() =>
    validateOffer({ ...terms, roomMinor: 22000 }, requirements),
  ).toThrow(/budget/);
  expect(() =>
    validateOffer({ ...terms, workspaceUntil: "12:00" }, requirements),
  ).toThrow(/workspace/);
});
it("serializes duplicate concurrent inquiries without duplicate email jobs", async () => {
  const key = randomUUID();
  const results = await Promise.all([
    createInquiry(tenant, buyer, key, "Same request", requirements),
    createInquiry(tenant, buyer, key, "Same request", requirements),
  ]);
  expect(results[0]!.id).toBe(results[1]!.id);
  const jobs = await db
    .select()
    .from(s.outbox)
    .where(eq(s.outbox.recordId, results[0]!.id));
  expect(jobs).toHaveLength(1);
  await expect(
    createInquiry(tenant, buyer, key, "Different request", requirements),
  ).rejects.toThrow(/different requirements/);
});
it("rejects foreign buyers, foreign tenants, wrong totals and expired offers", async () => {
  const { offered, approval } = await offer();
  await expect(
    approveAsTraveller(tenant, randomUUID(), offered.id),
  ).rejects.toThrow(/cannot approve/);
  await expect(
    acceptOffer(
      randomUUID(),
      buyer,
      offered.id,
      randomUUID(),
      approval.id,
      20500,
    ),
  ).rejects.toThrow(/not found/);
  await expect(
    acceptOffer(tenant, buyer, offered.id, randomUUID(), approval.id, 20501),
  ).rejects.toThrow(/approval/);
  await db
    .update(s.offers)
    .set({ expiresAt: new Date(0) })
    .where(eq(s.offers.id, offered.id));
  await expect(
    acceptOffer(tenant, buyer, offered.id, randomUUID(), approval.id, 20500),
  ).rejects.toThrow(/expired/);
});
it("allows only one concurrent reservation for the last room; replay preserves capacity", async () => {
  const a = await offer(),
    b = await offer(),
    key = randomUUID();
  const attempts = await Promise.allSettled([
    acceptOffer(tenant, buyer, a.offered.id, key, a.approval.id, 20500),
    acceptOffer(
      tenant,
      buyer,
      b.offered.id,
      randomUUID(),
      b.approval.id,
      20500,
    ),
  ]);
  expect(attempts.filter((x) => x.status === "fulfilled")).toHaveLength(1);
  const win = attempts[0]!.status === "fulfilled" ? a : b;
  const replay = await acceptOffer(
    tenant,
    buyer,
    win.offered.id,
    attempts[0]!.status === "fulfilled" ? key : randomUUID(),
    win.approval.id,
    20500,
  );
  expect(replay.totalMinor).toBe(20500);
  const [stock] = await db
    .select()
    .from(s.inventory)
    .where(eq(s.inventory.tenantId, tenant));
  expect(stock!.remaining).toBe(0);
});
it("rejects private, loopback and metadata source addresses", async () => {
  for (const ip of [
    "127.0.0.1",
    "10.1.2.3",
    "169.254.169.254",
    "::1",
    "::ffff:127.0.0.1",
  ])
    expect(isPublicAddress(ip)).toBe(false);
  expect(isPublicAddress("8.8.8.8")).toBe(true);
  await expect(fetchSource("http://127.0.0.1/private")).rejects.toThrow(
    /Private/,
  );
});
it("rejects forged, modified and stale callbacks", () => {
  const body = JSON.stringify({ id: randomUUID() });
  const headers = signedHeaders(body);
  expect(() =>
    verifyCallback(new Request("http://local", { headers }), body),
  ).not.toThrow();
  expect(() =>
    verifyCallback(new Request("http://local", { headers }), body + " "),
  ).toThrow(/signature/);
  expect(() =>
    verifyCallback(
      new Request("http://local", { headers: signedHeaders(body, "0") }),
      body,
    ),
  ).toThrow(/timestamp/);
});

it("atomically limits concurrent events and suppresses a queued event after revocation", async () => {
  const [sub] = await db
    .insert(s.subscriptions)
    .values({
      tenantId: tenant,
      buyerId: buyer,
      categories: ["culture"],
      active: true,
      expiresAt: new Date(Date.now() + 86400000),
    })
    .returning();
  const events = await db
    .insert(s.merchantEvents)
    .values(
      [1, 2].map((n) => ({
        tenantId: tenant,
        title: `Test event ${n}`,
        description: "Test culture event",
        category: "culture",
      })),
    )
    .returning();
  await Promise.all(
    events.map((event) =>
      handlers["subscription.deliver"]!({
        tenantId: tenant,
        recordId: event.id,
      }),
    ),
  );
  const deliveries = await db
    .select()
    .from(s.deliveries)
    .where(eq(s.deliveries.tenantId, tenant));
  expect(deliveries.filter((d) => d.status === "queued")).toHaveLength(1);
  expect(deliveries.filter((d) => d.status === "suppressed")).toHaveLength(1);
  await db
    .update(s.subscriptions)
    .set({ active: false })
    .where(eq(s.subscriptions.id, sub!.id));
  const queued = deliveries.find((d) => d.status === "queued")!;
  await handlers["buyer.event"]!({ tenantId: tenant, recordId: queued.id });
  const [revoked] = await db
    .select()
    .from(s.deliveries)
    .where(eq(s.deliveries.id, queued.id));
  expect(revoked!.status).toBe("suppressed");
});

it("publishes source-backed unknown policies without inventing workspace access, using the business name in its route", async () => {
  const draft = {
    ...profile,
    name: `Real source hotel ${tenant.slice(0, 8)}`,
    quietWorkspace: null,
    workspaceUntil: null,
    dogsWelcome: null,
    lateArrival: null,
  };
  await db
    .insert(s.onboardingRuns)
    .values({
      tenantId: tenant,
      sourceUrl: "https://example.com/hotel",
      status: "needs_review",
      profile: draft,
    });
  const published = await publishPresence(tenant, draft, "test-owner");
  expect(published.profile.quietWorkspace).toBeNull();
  expect(published.profile.workspaceUntil).toBeNull();
  expect(published.profile.lateArrival).toBeNull();
  const [updated] = await db
    .select()
    .from(s.tenants)
    .where(eq(s.tenants.id, tenant));
  expect(updated!.slug).toBe(`real-source-hotel-${tenant.slice(0, 8)}`);
});
