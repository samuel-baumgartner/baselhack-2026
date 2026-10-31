import { receiveReply, resendClient } from "@/server/adapters/mail";
import { AppError, errorResponse } from "@/server/auth";
import { config } from "@/server/config";

export async function POST(request: Request) {
  try {
    if (!config().RESEND_WEBHOOK_SECRET)
      throw new AppError(
        "WEBHOOK_DISABLED",
        "The Resend webhook is not configured. Local receiving uses authenticated polling.",
        503,
      );
    const client = resendClient();
    let event;
    try {
      event = client.webhooks.verify({
        payload: await request.text(),
        headers: {
          id: request.headers.get("svix-id") ?? "",
          timestamp: request.headers.get("svix-timestamp") ?? "",
          signature: request.headers.get("svix-signature") ?? "",
        },
        webhookSecret: config().RESEND_WEBHOOK_SECRET!,
      });
    } catch {
      throw new AppError(
        "BAD_SIGNATURE",
        "Resend webhook signature is invalid.",
        401,
      );
    }
    if (event.type === "email.received") {
      const full = await client.emails.receiving.get(event.data.email_id);
      if (full.error || !full.data)
        throw new Error("The received email could not be retrieved.");
      await receiveReply(
        `received-${full.data.id}`,
        full.data.to,
        full.data.text ?? "",
        full.data.id,
      );
    }
    return Response.json({ received: true });
  } catch (error) {
    return errorResponse(error);
  }
}
