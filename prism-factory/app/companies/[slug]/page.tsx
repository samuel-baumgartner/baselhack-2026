import { db, jobs, getJob } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { Setup } from "@/components/setup";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ build?: string }>;
}) {
  const { slug } = await params,
    { build } = await searchParams;
  let job = build ? await getJob(build) : undefined;
  if (!job) {
    const rows = await db()
      .select()
      .from(jobs)
      .where(eq(jobs.stage, "ready"))
      .orderBy(desc(jobs.updatedAt))
      .limit(50);
    job = rows.map((r) => r.data).find((j) => j.profile?.slug === slug);
  }
  if (!job || job.stage !== "ready" || job.profile?.slug !== slug) notFound();
  const h = await headers(),
    host = h.get("host") ?? "prism.mvps.ch";
  return (
    <Setup
      job={job}
      origin={`${host.includes("localhost") ? "http" : "https"}://${host}`}
    />
  );
}
