import { actionSchema, DEMO_BUYER, DEMO_TENANT } from "@/lib/contracts";
import { sendOwnerReply } from "@/server/adapters/mail";
import {
  AppError,
  errorResponse,
  requireOperator,
  requireSameOrigin,
} from "@/server/auth";
import { config } from "@/server/config";
import { db } from "@/server/db";
import {
  inquiries,
  messages,
  offers,
  outbox,
  subscriptions,
  tenants,
} from "@/server/db/schema";
import {
  approveAsTraveller,
  approveOffer,
  publishEvent,
  subscribe,
} from "@/server/services/commerce";
import { recordEvent } from "@/server/services/events";
import { publishPresence, startOnboarding } from "@/server/services/onboarding";
import { resetDemo } from "@/server/services/snapshot";
import { and, eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const userId = await requireOperator(request);
    const input = actionSchema.parse(await request.json());
    switch (input.action) {
      case "onboard":
        return Response.json(await startOnboarding(DEMO_TENANT, input.url), {
          status: 202,
        });
      case "publish":
        return Response.json(
          await publishPresence(DEMO_TENANT, input.profile, userId),
        );
      case "request": {
        if (
          config().AGENT_RUNTIME === "gateway" &&
          !config().AI_GATEWAY_API_KEY
        )
          throw new AppError(
            "AI_NOT_CONFIGURED",
            "Configure AI Gateway or select the Codex subscription runtime.",
            503,
          );
        const message = await db.transaction(async (tx) => {
          const [row] = await tx
            .insert(messages)
            .values({
              tenantId: DEMO_TENANT,
              buyerId: DEMO_BUYER,
              role: "user",
              chapter: "book",
              text: input.prompt,
              state: "running",
            })
            .returning();
          await tx.insert(outbox).values({
            tenantId: DEMO_TENANT,
            type: "buyer.request",
            recordId: row!.id,
          });
          return row!;
        });
        return Response.json(message, { status: 202 });
      }
      case "reply":
        return Response.json(
          await sendOwnerReply(DEMO_TENANT, input.inquiryId, input.text),
        );
      case "dashboard-reply": {
        await db.transaction(async (tx) => {
          const [inquiry] = await tx
            .select()
            .from(inquiries)
            .where(
              and(
                eq(inquiries.id, input.inquiryId),
                eq(inquiries.tenantId, DEMO_TENANT),
              ),
            )
            .for("update");
          if (!inquiry || inquiry.status === "closed")
            throw new AppError(
              "INQUIRY_UNAVAILABLE",
              "This request is unavailable.",
              409,
            );
          await tx
            .update(inquiries)
            .set({
              replyText: input.text,
              replyMessageId: `dashboard-${crypto.randomUUID()}`,
              mailStatus: "dashboard_reply",
              error: null,
            })
            .where(eq(inquiries.id, inquiry.id));
          await tx.insert(outbox).values({
            tenantId: DEMO_TENANT,
            type: "merchant.parse_reply",
            recordId: inquiry.id,
          });
        });
        await recordEvent(
          DEMO_TENANT,
          "proposal",
          "owner",
          "Owner replied through the dashboard",
          "Authenticated dashboard response. No inbound email receipt is claimed.",
        );
        return Response.json({ ok: true });
      }
      case "approve-offer":
        return Response.json(
          await approveOffer(DEMO_TENANT, input.inquiryId, input.terms, userId),
        );
      case "accept": {
        const [offer] = await db
          .select()
          .from(offers)
          .where(
            and(eq(offers.id, input.offerId), eq(offers.tenantId, DEMO_TENANT)),
          );
        if (!offer) throw new AppError("NOT_FOUND", "Offer not found.", 404);
        const [tenant] = await db
          .select()
          .from(tenants)
          .where(eq(tenants.id, DEMO_TENANT));
        if (!tenant)
          throw new AppError("NOT_FOUND", "Business not found.", 404);
        const approval = await approveAsTraveller(
          DEMO_TENANT,
          DEMO_BUYER,
          offer.id,
        );
        // Exercise the public buyer interface; do not bypass it from presentation controls.
        const response = await fetch(
          new URL(
            `/customers/${tenant.slug}/api/v1/offers/${offer.id}/accept`,
            config().APP_URL,
          ),
          {
            method: "POST",
            headers: {
              authorization: `Bearer ${config().BUYER_API_KEY}`,
              "content-type": "application/json",
            },
            body: JSON.stringify({
              idempotencyKey: input.idempotencyKey,
              approvalId: approval.id,
              totalMinor: offer.totalMinor,
            }),
          },
        );
        return new Response(await response.text(), {
          status: response.status,
          headers: { "content-type": "application/json" },
        });
      }
      case "subscribe":
        return Response.json(await subscribe(DEMO_TENANT, input.categories));
      case "unsubscribe": {
        await db
          .update(subscriptions)
          .set({ active: false })
          .where(
            and(
              eq(subscriptions.tenantId, DEMO_TENANT),
              eq(subscriptions.buyerId, DEMO_BUYER),
            ),
          );
        await recordEvent(
          DEMO_TENANT,
          "consent",
          "traveller",
          "Traveller unsubscribed",
          "Future event deliveries and suggestions are disabled.",
        );
        return Response.json({ ok: true });
      }
      case "event":
        return Response.json(
          await publishEvent(
            DEMO_TENANT,
            input.title,
            input.description,
            input.category,
          ),
          { status: 202 },
        );
      case "reset":
        await resetDemo(DEMO_TENANT);
        return Response.json({ ok: true });
    }
  } catch (error) {
    return errorResponse(error);
  }
}
