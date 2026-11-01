import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { pgTable, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { eq, and, sql as expression } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import type { Job, Stage } from "./contracts";
export const jobs = pgTable("prism_factory_jobs", {
  id: text().primaryKey(),
  owner: text().notNull(),
  stage: text().notNull(),
  data: jsonb().$type<Job>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
export function db() {
  if (!process.env.DATABASE_URL) throw Error("Database is not configured");
  return drizzle(neon(process.env.DATABASE_URL));
}
export async function getJob(id: string) {
  const [r] = await db().select().from(jobs).where(eq(jobs.id, id));
  return r?.data;
}
export async function createJob(url: string, owner: string) {
  const [{ total }] = await db()
    .select({ total: expression<number>`count(*)::int` })
    .from(jobs)
    .where(expression`${jobs.updatedAt}>now()-interval '24 hours'`);
  if (total >= 50)
    throw Error(
      "The demo builder has reached today’s limit. Existing previews still work.",
    );
  const [{ count }] = await db()
    .select({ count: expression<number>`count(*)::int` })
    .from(jobs)
    .where(
      and(
        eq(jobs.owner, owner),
        expression`${jobs.updatedAt}>now()-interval '1 hour'`,
      ),
    );
  if (count >= 8)
    throw Error("You have reached the demo limit. Come back in an hour.");
  const now = new Date().toISOString();
  const job: Job = {
    id: randomBytes(20).toString("hex"),
    url,
    stage: "analyzing",
    createdAt: now,
    updatedAt: now,
    selected: [],
    events: [
      {
        sequence: 1,
        stage: "analyzing",
        title: "A new perspective",
        detail: "Your website is queued for investigation.",
        at: now,
      },
    ],
  };
  await db()
    .insert(jobs)
    .values({ id: job.id, owner, stage: job.stage, data: job });
  return job;
}
export async function updateJob(
  id: string,
  patch: Partial<Job>,
  event?: { title: string; detail: string },
  expectedStages?: readonly Stage[],
) {
  for (let i = 0; i < 5; i++) {
    const old = await getJob(id);
    if (!old) throw Error("Build not found");
    if (expectedStages && !expectedStages.includes(old.stage))
      throw Error(
        "This build has moved on. Refresh to see its current progress.",
      );
    if (
      patch.stage &&
      old.stage === "cancelled" &&
      patch.stage !== "cancelled" &&
      !expectedStages?.includes("cancelled")
    )
      throw Error("Build cancelled");
    if (old.stage === "ready" && patch.stage && patch.stage !== "ready")
      throw Error("Published builds cannot be changed. Start a new build.");
    const now = new Date().toISOString();
    const next: Job = {
      ...old,
      ...patch,
      updatedAt: now,
      events: event
        ? [
            ...old.events,
            {
              sequence: old.events.length + 1,
              stage: patch.stage ?? old.stage,
              ...event,
              at: now,
            },
          ]
        : old.events,
    };
    const rows = await db()
      .update(jobs)
      .set({ stage: next.stage, data: next, updatedAt: new Date() })
      .where(
        and(
          eq(jobs.id, id),
          eq(jobs.stage, old.stage),
          expression`${jobs.data}->>'updatedAt'=${old.updatedAt}`,
        ),
      )
      .returning({ id: jobs.id });
    if (rows.length) return next;
  }
  throw Error("Another update is in progress. Try again.");
}
export async function setStage(
  id: string,
  stage: Stage,
  title: string,
  detail: string,
) {
  const job = await getJob(id);
  if (job?.stage === "cancelled") throw Error("Build cancelled");
  return updateJob(id, { stage }, { title, detail });
}
