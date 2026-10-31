import { and, eq } from "drizzle-orm";
import { setTimeout } from "node:timers/promises";
import { PgBoss } from "pg-boss";
import { pollReceivedMail } from "./server/adapters/mail";
import { config } from "./server/config";
import { db, pool } from "./server/db";
import { outbox } from "./server/db/schema";
import {
  handlers,
  recordJobFailure,
  type JobPayload,
} from "./server/jobs/handlers";

const boss = new PgBoss({ connectionString: config().DATABASE_URL, max: 3 });
boss.on("error", (error) => console.error("Queue error:", error.message));
await boss.start();
for (const [name, handler] of Object.entries(handlers)) {
  await boss.createQueue(name, {
    retryLimit: 2,
    retryDelay: 5,
    retryBackoff: true,
    expireInSeconds: 180,
  });
  await boss.work<JobPayload>(
    name,
    { pollingIntervalSeconds: 1, batchSize: 1 },
    async (jobs) => {
      for (const job of jobs) {
        try {
          await handler(job.data);
        } catch (error) {
          await recordJobFailure(name, job.data, error);
          throw error;
        }
      }
    },
  );
}
let stopping = false;
for (const signal of ["SIGTERM", "SIGINT"] as const)
  process.on(signal, () => {
    stopping = true;
  });
console.log("Presence worker ready: durable jobs, outbox and email receiving.");
let lastMailPoll = 0;
while (!stopping) {
  try {
    await pool.query(
      "INSERT INTO runtime_health(id,last_seen) VALUES ('worker',now()) ON CONFLICT(id) DO UPDATE SET last_seen=now()",
    );
    const pending = await db
      .select()
      .from(outbox)
      .where(eq(outbox.dispatched, false))
      .orderBy(outbox.createdAt)
      .limit(30);
    for (const event of pending) {
      if (!handlers[event.type])
        throw new Error(`Unknown outbox event type ${event.type}`);
      // A stable queue ID lets a dispatcher retry after crashing between these writes.
      await boss.send(
        event.type,
        { tenantId: event.tenantId, recordId: event.recordId },
        { id: event.id },
      );
      await db
        .update(outbox)
        .set({ dispatched: true })
        .where(and(eq(outbox.id, event.id), eq(outbox.dispatched, false)));
    }
    if (Date.now() - lastMailPoll > 5000) {
      lastMailPoll = Date.now();
      await pollReceivedMail();
    }
  } catch (error) {
    console.error(
      "Dispatcher:",
      error instanceof Error ? error.message : "Unknown error",
    );
  }
  await setTimeout(1000);
}
await boss.stop({ graceful: true, timeout: 10000 });
await pool.end();
