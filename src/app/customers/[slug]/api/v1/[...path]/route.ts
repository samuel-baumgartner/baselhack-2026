import {
  DEMO_BUYER,
  inquiryInputSchema,
  acceptanceInputSchema,
} from "@/lib/contracts";
import { AppError, errorResponse, requireBuyer } from "@/server/auth";
import { db } from "@/server/db";
import { inquiries, offers } from "@/server/db/schema";
import {
  acceptOffer,
  createInquiry,
  getPublishedBusiness,
} from "@/server/services/commerce";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

type Context = { params: Promise<{ slug: string; path: string[] }> };
export const dynamic = "force-dynamic";

export async function GET(request: Request, context: Context) {
  try {
    const { slug, path } = await context.params;
    const { tenant, version } = await getPublishedBusiness(slug);
    if (path.join("/") === "capabilities")
      return Response.json({
        business: version.profile,
        businessVersion: version.id,
        capabilities: [
          "request_stay_offer",
          "get_task",
          "read_offer",
          "accept_approved_offer",
          "consented_events",
        ],
        bookingAuthority: "fictional_inventory",
        status: "owner_approved",
      });
    requireBuyer(request);
    if (path[0] === "tasks" && path[1]) {
      const id = z.uuid().parse(path[1]);
      const [inquiry] = await db
        .select({
          id: inquiries.id,
          status: inquiries.status,
          requirements: inquiries.requirements,
          mailStatus: inquiries.mailStatus,
        })
        .from(inquiries)
        .where(
          and(
            eq(inquiries.id, id),
            eq(inquiries.tenantId, tenant.id),
            eq(inquiries.buyerId, DEMO_BUYER),
          ),
        );
      if (!inquiry) throw new AppError("NOT_FOUND", "Task not found.", 404);
      return Response.json(inquiry, {
        headers: { "cache-control": "no-store" },
      });
    }
    if (path[0] === "offers" && path[1]) {
      const id = z.uuid().parse(path[1]);
      const [offer] = await db
        .select()
        .from(offers)
        .innerJoin(inquiries, eq(offers.inquiryId, inquiries.id))
        .where(
          and(
            eq(offers.id, id),
            eq(offers.tenantId, tenant.id),
            eq(inquiries.buyerId, DEMO_BUYER),
          ),
        );
      if (!offer) throw new AppError("NOT_FOUND", "Offer not found.", 404);
      const row = offer.offers;
      return Response.json(
        {
          id: row.id,
          terms: row.terms,
          totalMinor: row.totalMinor,
          currency: row.terms.currency,
          status: row.status,
          expiresAt: row.expiresAt,
          requirements: offer.inquiries.requirements,
          ownerApproved: true,
        },
        { headers: { "cache-control": "no-store" } },
      );
    }
    throw new AppError("NOT_FOUND", "Capability not found.", 404);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request, context: Context) {
  try {
    requireBuyer(request);
    const { slug, path } = await context.params;
    const { tenant } = await getPublishedBusiness(slug);
    if (path.join("/") === "inquiries") {
      const input = inquiryInputSchema.parse(await request.json());
      const inquiry = await createInquiry(
        tenant.id,
        DEMO_BUYER,
        input.idempotencyKey,
        input.prompt,
        input.requirements,
      );
      return Response.json(
        {
          id: inquiry.id,
          status: inquiry.status,
          statusUrl: `/customers/${slug}/api/v1/tasks/${inquiry.id}`,
          next: "Wait for an owner-approved offer; no reservation exists yet.",
        },
        { status: 202 },
      );
    }
    if (path[0] === "offers" && path[1] && path[2] === "accept") {
      const input = acceptanceInputSchema.parse(await request.json());
      const reservation = await acceptOffer(
        tenant.id,
        DEMO_BUYER,
        z.uuid().parse(path[1]),
        input.idempotencyKey,
        input.approvalId,
        input.totalMinor,
      );
      return Response.json({
        id: reservation.id,
        reference: reservation.reference,
        status: reservation.status,
        totalMinor: reservation.totalMinor,
        terms: reservation.terms,
        adapter: "fictional_inventory",
      });
    }
    throw new AppError("NOT_FOUND", "Capability not found.", 404);
  } catch (error) {
    return errorResponse(error);
  }
}
