import nextEnv from "@next/env";
nextEnv.loadEnvConfig(process.cwd());
import { randomBytes } from "node:crypto";
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { writeFile } from "node:fs/promises";
import { db, jobs, getJob, updateJob, setStage } from "../lib/db";
import type { Job } from "../lib/contracts";
const id = randomBytes(20).toString("hex"),
  now = new Date().toISOString();
const fixture: Job = {
  id,
  url: "https://example.com",
  stage: "selection",
  createdAt: now,
  updatedAt: now,
  selected: [],
  events: [],
};
const checks: { name: string; passed: boolean }[] = [];
await db()
  .insert(jobs)
  .values({ id, owner: "state-check", stage: "selection", data: fixture });
try {
  const results = await Promise.allSettled([
    updateJob(
      id,
      { stage: "planning", selected: ["discover"] },
      { title: "First claim", detail: "Race test" },
      ["selection"],
    ),
    updateJob(
      id,
      { stage: "reviewing", selected: ["discover", "updates"] },
      { title: "Second claim", detail: "Race test" },
      ["selection"],
    ),
  ]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal((await getJob(id))!.events.length, 1);
  checks.push({
    name: "Competing transitions from the same stage have exactly one winner",
    passed: true,
  });
  await updateJob(id, { stage: "cancelled" });
  await assert.rejects(
    () => setStage(id, "publishing", "Publish", "Should not publish"),
    /cancelled/,
  );
  await assert.rejects(() => updateJob(id, { stage: "ready" }), /cancelled/);
  checks.push({
    name: "Cancellation blocks late worker stage transitions and publication",
    passed: true,
  });
  await updateJob(id, { stage: "selection" }, undefined, ["cancelled"]);
  assert.equal((await getJob(id))!.stage, "selection");
  checks.push({
    name: "Explicit creator retry can resume a cancelled job",
    passed: true,
  });
  await updateJob(id, { stage: "ready" });
  await assert.rejects(
    () => updateJob(id, { stage: "cancelled" }),
    /Published/,
  );
  checks.push({
    name: "Published output cannot be cancelled or overwritten by a stale action",
    passed: true,
  });
  await writeFile(
    "docs/verification/state-race-checks.json",
    JSON.stringify(checks, null, 2),
  );
  console.log(JSON.stringify(checks, null, 2));
} finally {
  await db().delete(jobs).where(eq(jobs.id, id));
}
