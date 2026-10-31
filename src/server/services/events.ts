import { DEMO_BUYER } from "@/lib/contracts";
import { db } from "../db";
import { messages, taskEvents } from "../db/schema";

export async function recordEvent(
  tenantId: string,
  kind: string,
  actor: string,
  title: string,
  detail?: string,
) {
  await db.insert(taskEvents).values({ tenantId, kind, actor, title, detail });
}
export async function addMessage(
  tenantId: string,
  chapter: string,
  role: string,
  text: string,
) {
  const [message] = await db
    .insert(messages)
    .values({ tenantId, buyerId: DEMO_BUYER, chapter, role, text })
    .returning();
  return message!;
}
