import { and, eq } from "drizzle-orm";
import { createHash } from "node:crypto";
import { Resend } from "resend";
import { AppError } from "../auth";
import { config } from "../config";
import { db } from "../db";
import { inbox, inquiries, outbox } from "../db/schema";
import { recordEvent } from "../services/events";

export function resendClient() {
  if (!config().RESEND_API_KEY)
    throw new AppError(
      "EMAIL_NOT_CONFIGURED",
      "Connect Resend to use real email.",
      503,
    );
  return new Resend(config().RESEND_API_KEY);
}

export function replyAddress(token: string) {
  if (!config().RESEND_RECEIVING_DOMAIN)
    throw new AppError(
      "RECEIVING_DOMAIN_REQUIRED",
      "Configure the Resend receiving domain.",
      503,
    );
  return `inquiry+${token}@${config().RESEND_RECEIVING_DOMAIN}`;
}

export async function retryInquiryEmail(tenantId: string, inquiryId: string) {
  await db.transaction(async (tx) => {
    const [inquiry] = await tx
      .select()
      .from(inquiries)
      .where(and(eq(inquiries.id, inquiryId), eq(inquiries.tenantId, tenantId)))
      .for("update");
    if (!inquiry) throw new AppError("NOT_FOUND", "Inquiry not found.", 404);
    if (
      inquiry.mailStatus !== "queued" ||
      !inquiry.error ||
      inquiry.status === "closed"
    )
      throw new AppError(
        "MAIL_NOT_RETRYABLE",
        "Only a failed pending inquiry email can be retried.",
        409,
      );
    await tx
      .update(inquiries)
      .set({ error: null })
      .where(eq(inquiries.id, inquiryId));
    await tx
      .insert(outbox)
      .values({ tenantId, type: "merchant.send_inquiry", recordId: inquiryId });
  });
  await recordEvent(
    tenantId,
    "email",
    "owner",
    "Inquiry email retry requested",
    "The saved inquiry is queued again with the same provider idempotency key.",
  );
  return { queued: true };
}

export async function sendInquiry(id: string) {
  const [inquiry] = await db
    .select()
    .from(inquiries)
    .where(eq(inquiries.id, id));
  if (!inquiry || inquiry.mailStatus !== "queued") return;
  const env = config();
  if (inquiry.mailProvider === "local") {
    await db
      .update(inquiries)
      .set({ mailStatus: "sent", messageId: `practice-${id}` })
      .where(eq(inquiries.id, id));
    await recordEvent(
      inquiry.tenantId,
      "email",
      "system",
      "Practice inquiry is ready",
      "Local practice mailbox; no internet email was sent.",
    );
    return;
  }
  if (!env.OWNER_EMAIL || !env.RESEND_FROM)
    throw new AppError(
      "EMAIL_NOT_CONFIGURED",
      "Configure the verified sender and team-owned owner mailbox.",
      503,
    );
  const result = await resendClient().emails.send(
    {
      from: env.RESEND_FROM,
      to: env.OWNER_EMAIL,
      replyTo: replyAddress(inquiry.replyToken),
      subject: `[Presence ${id.slice(0, 8)}] New stay request`,
      text: `A traveller's agent is requesting an offer.\n\n${inquiry.prompt}\n\nReply with the room, dog, workspace prices and conditions. This is a BaselHack simulation using public website facts; offers and inventory are demonstration data. No actual hotel is contacted or booked. A reply is a proposed offer; the owner must approve the terms in the app.\n\nReview: ${env.APP_URL}/owner?chapter=book`,
    },
    { idempotencyKey: `presence-inquiry-${id}` },
  );
  if (result.error)
    throw new Error(
      `Resend could not send the inquiry: ${result.error.message}`,
    );
  await db
    .update(inquiries)
    .set({ mailStatus: "sent", messageId: result.data!.id, error: null })
    .where(eq(inquiries.id, id));
  await recordEvent(
    inquiry.tenantId,
    "email",
    "system",
    "Real inquiry email sent",
    `Resend message ${result.data!.id}. Waiting for an owner reply.`,
  );
}

export async function receiveReply(
  eventId: string,
  recipients: string[],
  text: string,
  messageId: string,
  provider = "resend",
) {
  const token = recipients
    .map((to) => to.match(/inquiry\+([a-f0-9]{48})@/i)?.[1])
    .find(Boolean);
  if (!token) return false;
  const [inquiry] = await db
    .select()
    .from(inquiries)
    .where(eq(inquiries.replyToken, token));
  if (!inquiry || inquiry.status === "closed") return false;
  const applied = await db.transaction(async (tx) => {
    const inserted = await tx
      .insert(inbox)
      .values({ id: eventId, provider })
      .onConflictDoNothing()
      .returning();
    if (!inserted.length) return false;
    await tx
      .update(inquiries)
      .set({
        replyText: text.slice(0, 8000),
        replyMessageId: messageId,
        mailStatus: "reply_received",
        error: null,
      })
      .where(
        and(
          eq(inquiries.id, inquiry.id),
          eq(inquiries.tenantId, inquiry.tenantId),
        ),
      );
    await tx.insert(outbox).values({
      tenantId: inquiry.tenantId,
      type: "merchant.parse_reply",
      recordId: inquiry.id,
    });
    return true;
  });
  if (applied)
    await recordEvent(
      inquiry.tenantId,
      "email",
      "owner",
      "Owner email reply received",
      provider === "resend"
        ? `Actual received email ${messageId}; parsing a proposed offer.`
        : "Practice reply; this is not an internet email.",
    );
  return applied;
}

export async function sendOwnerReply(
  tenantId: string,
  id: string,
  text: string,
) {
  const [inquiry] = await db
    .select()
    .from(inquiries)
    .where(and(eq(inquiries.id, id), eq(inquiries.tenantId, tenantId)));
  if (!inquiry) throw new AppError("NOT_FOUND", "Inquiry not found.", 404);
  if (inquiry.mailStatus === "queued")
    throw new AppError(
      "MAIL_PENDING",
      "Wait for the inquiry email to be sent.",
      409,
    );
  if (inquiry.mailProvider === "local") {
    // This branch is visible as practice mode, never reported as actual provider mail.
    await receiveReply(
      `practice-reply-${id}-${crypto.randomUUID()}`,
      [`inquiry+${inquiry.replyToken}@practice.local`],
      text,
      `practice-${crypto.randomUUID()}`,
      "local",
    );
    return { mode: "local" };
  }
  if (!config().RESEND_FROM)
    throw new AppError(
      "EMAIL_NOT_CONFIGURED",
      "Configure a verified sender.",
      503,
    );
  const result = await resendClient().emails.send(
    {
      from: config().RESEND_FROM!,
      to: replyAddress(inquiry.replyToken),
      subject: `Re: [Presence ${id.slice(0, 8)}] Stay offer`,
      text,
      headers: inquiry.messageId
        ? { "X-Presence-Inquiry": inquiry.id }
        : undefined,
    },
    {
      idempotencyKey: `presence-reply-${id}-${createHash("sha256").update(text).digest("hex")}`,
    },
  );
  if (result.error)
    throw new AppError(
      "EMAIL_REPLY_REJECTED",
      `Resend rejected the reply: ${result.error.message}`,
      422,
    );
  await recordEvent(
    tenantId,
    "email",
    "owner",
    "Owner sent a real email reply",
    `Resend outbound message ${result.data!.id}; waiting for inbound delivery. No offer is approved yet.`,
  );
  return { mode: "resend", messageId: result.data!.id };
}

export async function pollReceivedMail() {
  if (config().MAIL_TRANSPORT !== "resend" || !config().RESEND_API_KEY) return;
  const client = resendClient();
  const response = await client.emails.receiving.list({ limit: 20 });
  if (response.error)
    throw new Error(`Resend receiving: ${response.error.message}`);
  for (const email of response.data?.data ?? []) {
    if (!email.to.some((to) => to.includes("inquiry+"))) continue;
    const [seen] = await db
      .select()
      .from(inbox)
      .where(eq(inbox.id, `received-${email.id}`));
    if (seen) continue;
    const full = await client.emails.receiving.get(email.id);
    if (full.error || !full.data) continue;
    await receiveReply(
      `received-${email.id}`,
      full.data.to,
      full.data.text ?? "",
      email.id,
    );
  }
}
