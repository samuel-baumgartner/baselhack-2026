import { profileSchema, type BusinessProfile } from "@/lib/contracts";
import { and, desc, eq, sql } from "drizzle-orm";
import { AppError } from "../auth";
import { db } from "../db";
import {
  businessVersions,
  onboardingRuns,
  outbox,
  tenants,
} from "../db/schema";
import { recordEvent } from "./events";

export async function startOnboarding(tenantId: string, sourceUrl: string) {
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtextextended(${`onboard:${tenantId}`},0))`,
    );
    const [active] = await tx
      .select()
      .from(onboardingRuns)
      .where(eq(onboardingRuns.tenantId, tenantId))
      .orderBy(desc(onboardingRuns.createdAt))
      .limit(1);
    if (active && ["queued", "fetching", "extracting"].includes(active.status))
      return active;
    const [run] = await tx
      .insert(onboardingRuns)
      .values({ tenantId, sourceUrl, status: "queued" })
      .returning();
    await tx
      .insert(outbox)
      .values({ tenantId, type: "onboarding.extract", recordId: run!.id });
    return run!;
  });
}

export async function publishPresence(
  tenantId: string,
  profile: BusinessProfile,
  ownerId: string,
) {
  profileSchema.parse(profile);
  const slug =
    profile.name
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || "demo-hotel";
  const version = await db.transaction(async (tx) => {
    const [run] = await tx
      .select()
      .from(onboardingRuns)
      .where(
        and(
          eq(onboardingRuns.tenantId, tenantId),
          eq(onboardingRuns.status, "needs_review"),
        ),
      )
      .orderBy(desc(onboardingRuns.createdAt))
      .limit(1)
      .for("update");
    if (!run)
      throw new AppError(
        "NO_DRAFT",
        "Extract and review a source page before publishing.",
        409,
      );
    const [row] = await tx
      .insert(businessVersions)
      .values({
        tenantId,
        profile,
        sourceUrl: run.sourceUrl,
        approvedBy: ownerId,
      })
      .returning();
    await tx
      .update(tenants)
      .set({ publishedVersion: row!.id, name: profile.name, slug })
      .where(eq(tenants.id, tenantId));
    await tx
      .update(onboardingRuns)
      .set({ profile, status: "published", updatedAt: new Date() })
      .where(eq(onboardingRuns.id, run.id));
    return row!;
  });
  await recordEvent(
    tenantId,
    "publication",
    "owner",
    "Business presence published",
    "One approved record now powers the human page, business JSON and commerce tools.",
  );
  return version;
}
