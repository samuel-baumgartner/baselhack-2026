import { isDeepStrictEqual } from "node:util";
import {
  DEMO_BUYER,
  offerSchema,
  type OfferTerms,
  type Requirements,
  requirementsSchema,
  totalMinor,
} from "@/lib/contracts";
import { and, eq, gt, sql } from "drizzle-orm";
import { createHash, randomBytes } from "node:crypto";
import { AppError } from "../auth";
import { config } from "../config";
import { db } from "../db";
import {
  businessVersions,
  inquiries,
  inventory,
  merchantEvents,
  offers,
  outbox,
  reservations,
  subscriptions,
  taskEvents,
  tenants,
  travellerApprovals,
} from "../db/schema";
import { recordEvent } from "./events";

export async function getPublishedBusiness(slug: string) {
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.slug, slug));
  if (!tenant?.publishedVersion)
    throw new AppError(
      "NOT_PUBLISHED",
      "This business has not published its agent presence yet.",
      404,
    );
  const [version] = await db
    .select()
    .from(businessVersions)
    .where(
      and(
        eq(businessVersions.id, tenant.publishedVersion),
        eq(businessVersions.tenantId, tenant.id),
      ),
    );
  if (!version)
    throw new AppError("NOT_PUBLISHED", "Business version unavailable.", 404);
  return { tenant, version };
}

export async function createInquiry(
  tenantId: string,
  buyerId: string,
  key: string,
  prompt: string,
  input: Requirements,
) {
  const requirements = requirementsSchema.parse(input);
  if (requirements.departure <= requirements.arrival)
    throw new AppError("INVALID_DATES", "Departure must be after arrival.");
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId));
  if (!tenant?.publishedVersion)
    throw new AppError(
      "NOT_PUBLISHED",
      "Publish the business presence first.",
      409,
    );
  const inquiry = await db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtextextended(${`inquiry:${tenantId}:${buyerId}:${key}`},0))`,
    );
    const [existing] = await tx
      .select()
      .from(inquiries)
      .where(
        and(
          eq(inquiries.tenantId, tenantId),
          eq(inquiries.buyerId, buyerId),
          eq(inquiries.idempotencyKey, key),
        ),
      );
    if (existing) {
      if (
        !isDeepStrictEqual(existing.requirements, requirements) ||
        existing.prompt !== prompt
      )
        throw new AppError(
          "IDEMPOTENCY_CONFLICT",
          "This request key was already used for different requirements.",
          409,
        );
      return existing;
    }
    const [row] = await tx
      .insert(inquiries)
      .values({
        tenantId,
        buyerId,
        idempotencyKey: key,
        prompt,
        requirements,
        status: "waiting_for_owner",
        mailProvider: config().MAIL_TRANSPORT,
        replyToken: randomBytes(24).toString("hex"),
      })
      .returning();
    await tx
      .insert(outbox)
      .values({ tenantId, type: "merchant.send_inquiry", recordId: row!.id });
    return row!;
  });
  await recordEvent(
    tenantId,
    "inquiry",
    "buyer",
    "Request sent to the business",
    "A structured inquiry is saved; the owner email is queued.",
  );
  return inquiry;
}

export function validateOffer(terms: OfferTerms, requirements: Requirements) {
  offerSchema.parse(terms);
  if (totalMinor(terms) > requirements.budgetMinor)
    throw new AppError(
      "OVER_BUDGET",
      "The complete offer exceeds the traveller's budget.",
      422,
    );
  if (requirements.dog && !terms.dogAccepted)
    throw new AppError(
      "DOG_NOT_ACCEPTED",
      "The traveller needs dog accommodation.",
      422,
    );
  if (requirements.lateArrival && !terms.lateArrival)
    throw new AppError(
      "LATE_ARRIVAL_UNAVAILABLE",
      "The traveller needs late arrival.",
      422,
    );
  if (requirements.quietWorkspace && !terms.quietWorkspace)
    throw new AppError(
      "WORKSPACE_UNAVAILABLE",
      "The traveller needs a quiet workspace.",
      422,
    );
  if (
    requirements.workspaceUntil &&
    (!terms.workspaceUntil ||
      terms.workspaceUntil < requirements.workspaceUntil)
  )
    throw new AppError(
      "WORKSPACE_TIME",
      "The workspace must remain available until the requested time.",
      422,
    );
}

export async function approveOffer(
  tenantId: string,
  inquiryId: string,
  terms: OfferTerms,
  ownerId: string,
) {
  const offer = await db.transaction(async (tx) => {
    const [inquiry] = await tx
      .select()
      .from(inquiries)
      .where(and(eq(inquiries.id, inquiryId), eq(inquiries.tenantId, tenantId)))
      .for("update");
    if (!inquiry) throw new AppError("NOT_FOUND", "Inquiry not found.", 404);
    if (inquiry.status === "closed")
      throw new AppError(
        "INQUIRY_CLOSED",
        "This inquiry already has a reservation.",
        409,
      );
    if (!inquiry.replyText)
      throw new AppError(
        "REPLY_REQUIRED",
        "Receive an owner email or dashboard reply before approving an offer.",
        409,
      );
    validateOffer(terms, inquiry.requirements);
    const [tenant] = await tx
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId));
    if (!tenant?.publishedVersion)
      throw new AppError("NOT_PUBLISHED", "Publish the business first.", 409);
    await tx
      .update(offers)
      .set({ status: "superseded" })
      .where(
        and(
          eq(offers.inquiryId, inquiryId),
          eq(offers.tenantId, tenantId),
          eq(offers.status, "published"),
        ),
      );
    const [row] = await tx
      .insert(offers)
      .values({
        tenantId,
        inquiryId,
        businessVersion: tenant.publishedVersion,
        terms,
        totalMinor: totalMinor(terms),
        approvedBy: ownerId,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      })
      .returning();
    await tx
      .update(inquiries)
      .set({ status: "offered" })
      .where(eq(inquiries.id, inquiryId));
    await tx
      .insert(outbox)
      .values({ tenantId, type: "callback.offer", recordId: row!.id });
    return row!;
  });
  await recordEvent(
    tenantId,
    "offer",
    "owner",
    "Owner approved the exact offer",
    `CHF ${(offer.totalMinor / 100).toFixed(2)} including all extras and taxes. Revision ${offer.id.slice(0, 8)}.`,
  );
  return offer;
}

export async function approveAsTraveller(
  tenantId: string,
  buyerId: string,
  offerId: string,
) {
  const [offer] = await db
    .select()
    .from(offers)
    .where(and(eq(offers.id, offerId), eq(offers.tenantId, tenantId)));
  if (!offer) throw new AppError("NOT_FOUND", "Offer not found.", 404);
  const [inquiry] = await db
    .select()
    .from(inquiries)
    .where(
      and(
        eq(inquiries.id, offer.inquiryId),
        eq(inquiries.buyerId, buyerId),
        eq(inquiries.tenantId, tenantId),
      ),
    );
  if (!inquiry)
    throw new AppError(
      "FORBIDDEN",
      "This buyer cannot approve the offer.",
      403,
    );
  const [approval] = await db
    .insert(travellerApprovals)
    .values({ tenantId, buyerId, offerId, totalMinor: offer.totalMinor })
    .returning();
  return approval!;
}

export async function acceptOffer(
  tenantId: string,
  buyerId: string,
  offerId: string,
  key: string,
  approvalId: string,
  expectedTotal: number,
) {
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtextextended(${`accept:${tenantId}:${buyerId}:${key}`},0))`,
    );
    // Lock the immutable offer row so concurrent accept/replay requests serialize.
    const [offer] = await tx
      .select()
      .from(offers)
      .where(and(eq(offers.id, offerId), eq(offers.tenantId, tenantId)))
      .for("update");
    if (!offer) throw new AppError("NOT_FOUND", "Offer not found.", 404);
    const [existing] = await tx
      .select()
      .from(reservations)
      .where(
        and(
          eq(reservations.tenantId, tenantId),
          eq(reservations.buyerId, buyerId),
          eq(reservations.idempotencyKey, key),
        ),
      );
    if (existing) {
      if (existing.offerId !== offerId || existing.totalMinor !== expectedTotal)
        throw new AppError(
          "IDEMPOTENCY_CONFLICT",
          "This key was used for a different acceptance.",
          409,
        );
      return existing;
    }
    const [prior] = await tx
      .select()
      .from(reservations)
      .where(eq(reservations.offerId, offerId));
    if (prior) {
      if (prior.buyerId !== buyerId)
        throw new AppError(
          "FORBIDDEN",
          "Reservation belongs to another buyer.",
          403,
        );
      if (prior.totalMinor !== expectedTotal)
        throw new AppError(
          "IDEMPOTENCY_CONFLICT",
          "Accepted offer total does not match this retry.",
          409,
        );
      return prior;
    }
    const [inquiry] = await tx
      .select()
      .from(inquiries)
      .where(
        and(
          eq(inquiries.id, offer.inquiryId),
          eq(inquiries.tenantId, tenantId),
          eq(inquiries.buyerId, buyerId),
        ),
      );
    if (!inquiry)
      throw new AppError(
        "FORBIDDEN",
        "Offer is not available to this buyer.",
        403,
      );
    if (offer.status !== "published" || offer.expiresAt <= new Date())
      throw new AppError(
        "OFFER_EXPIRED",
        "This offer expired or was replaced. Ask the owner for a new offer.",
        409,
      );
    const [approval] = await tx
      .select()
      .from(travellerApprovals)
      .where(
        and(
          eq(travellerApprovals.id, approvalId),
          eq(travellerApprovals.offerId, offerId),
          eq(travellerApprovals.tenantId, tenantId),
          eq(travellerApprovals.buyerId, buyerId),
        ),
      );
    if (
      !approval ||
      approval.totalMinor !== expectedTotal ||
      expectedTotal !== offer.totalMinor
    )
      throw new AppError(
        "APPROVAL_REQUIRED",
        "Explicit approval of this exact offer and total is required.",
        403,
      );
    validateOffer(offer.terms, inquiry.requirements);
    const nights = await tx
      .select()
      .from(inventory)
      .where(and(eq(inventory.tenantId, tenantId), gt(inventory.day, "")))
      .orderBy(inventory.day)
      .for("update");
    const stay = nights.filter(
      (n) =>
        n.day >= inquiry.requirements.arrival &&
        n.day < inquiry.requirements.departure,
    );
    const count = Math.round(
      (Date.parse(inquiry.requirements.departure) -
        Date.parse(inquiry.requirements.arrival)) /
        86400000,
    );
    if (stay.length !== count || stay.some((n) => n.remaining < 1))
      throw new AppError(
        "NO_AVAILABILITY",
        "The room is no longer available. No reservation was created.",
        409,
      );
    for (const night of stay)
      await tx
        .update(inventory)
        .set({ remaining: sql`${inventory.remaining}-1` })
        .where(eq(inventory.id, night.id));
    const [reservation] = await tx
      .insert(reservations)
      .values({
        tenantId,
        buyerId,
        offerId,
        inquiryId: inquiry.id,
        idempotencyKey: key,
        reference: `PL-${randomBytes(3).toString("hex").toUpperCase()}`,
        status: "confirmed",
        totalMinor: offer.totalMinor,
        terms: offer.terms,
        arrival: inquiry.requirements.arrival,
        departure: inquiry.requirements.departure,
      })
      .returning();
    await tx
      .update(offers)
      .set({ status: "accepted" })
      .where(eq(offers.id, offer.id));
    await tx
      .update(inquiries)
      .set({ status: "closed" })
      .where(eq(inquiries.id, inquiry.id));
    await tx.insert(taskEvents).values({
      tenantId,
      kind: "reservation",
      actor: "traveller",
      title: "Reservation confirmed",
      detail: `${reservation!.reference}: exact approved terms preserved and capacity decremented.`,
    });
    return reservation!;
  });
}

export async function subscribe(tenantId: string, categories: string[]) {
  const [reservation] = await db
    .select()
    .from(reservations)
    .where(
      and(
        eq(reservations.tenantId, tenantId),
        eq(reservations.buyerId, DEMO_BUYER),
      ),
    );
  if (!reservation)
    throw new AppError(
      "BOOKING_REQUIRED",
      "Complete a booking before subscribing in this demo.",
      409,
    );
  const [subscription] = await db
    .insert(subscriptions)
    .values({
      tenantId,
      buyerId: DEMO_BUYER,
      categories,
      active: true,
      expiresAt: new Date(Date.now() + 365 * 86400000),
    })
    .onConflictDoUpdate({
      target: [subscriptions.tenantId, subscriptions.buyerId],
      set: {
        categories,
        active: true,
        expiresAt: new Date(Date.now() + 365 * 86400000),
      },
    })
    .returning();
  await recordEvent(
    tenantId,
    "consent",
    "traveller",
    "Traveller opted into relevant events",
    "Categories and consent expiry are saved. Unsubscribe is available at any time.",
  );
  return subscription!;
}

export async function publishEvent(
  tenantId: string,
  title: string,
  description: string,
  category: string,
) {
  const event = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(merchantEvents)
      .values({ tenantId, title, description, category })
      .returning();
    await tx
      .insert(outbox)
      .values({ tenantId, type: "subscription.deliver", recordId: row!.id });
    return row!;
  });
  await recordEvent(
    tenantId,
    "event",
    "owner",
    "The hotel published a new event",
    title,
  );
  return event;
}

export function fingerprint(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}
