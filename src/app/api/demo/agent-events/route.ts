import { DEMO_TENANT } from "@/lib/contracts";
import { verifyCallback } from "@/server/adapters/callback";
import { AppError, errorResponse } from "@/server/auth";
import { config } from "@/server/config";
import { db } from "@/server/db";
import { inbox, outbox } from "@/server/db/schema";
import { z } from "zod";

export async function POST(request: Request) {
  try {
    if (config().DEMO_MODE !== "true")
      throw new AppError(
        "DEMO_DISABLED",
        "Demo callback receiver is disabled.",
        404,
      );
    const body = await request.text();
    verifyCallback(request, body);
    const event = z
      .object({
        id: z.uuid(),
        type: z.enum(["offer", "event"]),
        tenantId: z.literal(DEMO_TENANT),
        recordId: z.uuid(),
      })
      .parse(JSON.parse(body));
    const applied = await db.transaction(async (tx) => {
      const [received] = await tx
        .insert(inbox)
        .values({
          id: `agent-${event.type}-${event.id}`,
          provider: "signed-callback",
        })
        .onConflictDoNothing()
        .returning();
      if (!received) return false;
      await tx.insert(outbox).values({
        tenantId: event.tenantId,
        type: `buyer.${event.type}`,
        recordId: event.recordId,
      });
      return true;
    });
    return Response.json({ accepted: true, duplicate: !applied });
  } catch (error) {
    return errorResponse(error);
  }
}
