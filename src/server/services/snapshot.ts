import { DEMO_BUYER, DEMO_TENANT } from "@/lib/contracts";
import { and, desc, eq, inArray } from "drizzle-orm";
import { AppError } from "../auth";
import { replyAddress } from "../adapters/mail";
import { config } from "../config";
import { db, pool } from "../db";
import * as s from "../db/schema";

export async function getSnapshot(tenantId = DEMO_TENANT) {
  const [
    tenantRows,
    runRows,
    versionRows,
    inquiryRows,
    offerRows,
    reservationRows,
    subscriptionRows,
    eventRows,
    deliveryRows,
    messageRows,
    traceRows,
    health,
  ] = await Promise.all([
    db.select().from(s.tenants).where(eq(s.tenants.id, tenantId)),
    db
      .select()
      .from(s.onboardingRuns)
      .where(eq(s.onboardingRuns.tenantId, tenantId))
      .orderBy(desc(s.onboardingRuns.createdAt))
      .limit(1),
    db
      .select()
      .from(s.businessVersions)
      .where(eq(s.businessVersions.tenantId, tenantId))
      .orderBy(desc(s.businessVersions.createdAt))
      .limit(1),
    db
      .select({
        id: s.inquiries.id,
        prompt: s.inquiries.prompt,
        requirements: s.inquiries.requirements,
        status: s.inquiries.status,
        mailStatus: s.inquiries.mailStatus,
        mailProvider: s.inquiries.mailProvider,
        messageId: s.inquiries.messageId,
        replyText: s.inquiries.replyText,
        replyToken: s.inquiries.replyToken,
        replyMessageId: s.inquiries.replyMessageId,
        proposedTerms: s.inquiries.proposedTerms,
        error: s.inquiries.error,
        createdAt: s.inquiries.createdAt,
      })
      .from(s.inquiries)
      .where(
        and(
          eq(s.inquiries.tenantId, tenantId),
          eq(s.inquiries.buyerId, DEMO_BUYER),
        ),
      )
      .orderBy(desc(s.inquiries.createdAt))
      .limit(1),
    db
      .select()
      .from(s.offers)
      .where(eq(s.offers.tenantId, tenantId))
      .orderBy(desc(s.offers.createdAt))
      .limit(1),
    db
      .select()
      .from(s.reservations)
      .where(
        and(
          eq(s.reservations.tenantId, tenantId),
          eq(s.reservations.buyerId, DEMO_BUYER),
        ),
      )
      .orderBy(desc(s.reservations.createdAt))
      .limit(1),
    db
      .select()
      .from(s.subscriptions)
      .where(
        and(
          eq(s.subscriptions.tenantId, tenantId),
          eq(s.subscriptions.buyerId, DEMO_BUYER),
        ),
      ),
    db
      .select()
      .from(s.merchantEvents)
      .where(eq(s.merchantEvents.tenantId, tenantId))
      .orderBy(desc(s.merchantEvents.createdAt))
      .limit(10),
    db
      .select()
      .from(s.deliveries)
      .where(eq(s.deliveries.tenantId, tenantId))
      .orderBy(desc(s.deliveries.createdAt))
      .limit(10),
    db
      .select()
      .from(s.messages)
      .where(
        and(
          eq(s.messages.tenantId, tenantId),
          eq(s.messages.buyerId, DEMO_BUYER),
        ),
      )
      .orderBy(s.messages.createdAt)
      .limit(80),
    db
      .select()
      .from(s.taskEvents)
      .where(eq(s.taskEvents.tenantId, tenantId))
      .orderBy(desc(s.taskEvents.createdAt))
      .limit(50),
    pool.query<{ last_seen: Date }>(
      "SELECT last_seen FROM runtime_health WHERE id='worker'",
    ),
  ]);
  const env = config();
  const inquiry = inquiryRows[0];
  const publicInquiry = inquiry
    ? (({ replyToken, ...rest }) => ({
        ...rest,
        replyAddress:
          env.MAIL_TRANSPORT === "resend" && env.RESEND_RECEIVING_DOMAIN
            ? replyAddress(replyToken)
            : null,
      }))(inquiry)
    : null;
  return {
    now: new Date().toISOString(),
    tenant: tenantRows[0]!,
    run: runRows[0] ?? null,
    version: versionRows[0] ?? null,
    inquiry: publicInquiry,
    offer: offerRows[0] ?? null,
    reservation: reservationRows[0] ?? null,
    subscription: subscriptionRows[0] ?? null,
    events: eventRows,
    deliveries: deliveryRows,
    messages: messageRows,
    trace: traceRows,
    connections: {
      worker:
        !!health.rows[0] &&
        Date.now() - health.rows[0].last_seen.getTime() < 10000,
      ai: env.AGENT_RUNTIME === "codex" || !!env.AI_GATEWAY_API_KEY,
      model:
        env.AGENT_RUNTIME === "codex" ? "Codex subscription" : env.AI_MODEL,
      agentRuntime: env.AGENT_RUNTIME,
      onboarding: env.ONBOARDING_PROVIDER,
      email: env.MAIL_TRANSPORT,
      testSender: /@resend\.dev>?$/i.test(env.RESEND_FROM ?? ""),
      emailConfigured: !!(
        env.RESEND_API_KEY &&
        env.RESEND_FROM &&
        env.RESEND_RECEIVING_DOMAIN &&
        env.OWNER_EMAIL
      ),
      ownerEmail: env.OWNER_EMAIL ?? null,
    },
  };
}
type Serialize<T> = T extends Date
  ? string
  : T extends Array<infer U>
    ? Serialize<U>[]
    : T extends object
      ? { [K in keyof T]: Serialize<T[K]> }
      : T;
export type DemoSnapshot = Serialize<Awaited<ReturnType<typeof getSnapshot>>>;

export async function resetDemo(tenantId: string) {
  if (tenantId !== DEMO_TENANT)
    throw new AppError(
      "RESET_DENIED",
      "Only the seeded demo can be reset.",
      403,
    );
  const active = await db
    .select()
    .from(s.onboardingRuns)
    .where(
      and(
        eq(s.onboardingRuns.tenantId, tenantId),
        inArray(s.onboardingRuns.status, ["queued", "fetching", "extracting"]),
      ),
    );
  const running = await db
    .select()
    .from(s.messages)
    .where(
      and(eq(s.messages.tenantId, tenantId), eq(s.messages.state, "running")),
    );
  if (active.length || running.length)
    throw new AppError(
      "WORK_RUNNING",
      "Wait for active extraction or agent work before resetting.",
      409,
    );
  await db.transaction(async (tx) => {
    await tx
      .update(s.tenants)
      .set({ publishedVersion: null, name: "Hotel Linden Basel" })
      .where(eq(s.tenants.id, tenantId));
    for (const table of [
      s.outbox,
      s.deliveries,
      s.travellerApprovals,
      s.reservations,
      s.offers,
      s.inquiries,
      s.merchantEvents,
      s.subscriptions,
      s.businessVersions,
      s.onboardingRuns,
      s.messages,
      s.taskEvents,
    ]) {
      await tx.delete(table).where(eq(table.tenantId, tenantId));
    }
    await tx
      .update(s.inventory)
      .set({ remaining: 1 })
      .where(eq(s.inventory.tenantId, tenantId));
  });
}
