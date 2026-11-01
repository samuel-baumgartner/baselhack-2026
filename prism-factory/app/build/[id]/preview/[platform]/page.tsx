import { Preview } from "@/components/preview";
import { getJob } from "@/lib/db";
import { notFound } from "next/navigation";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string; platform: string }>;
}) {
  const { id, platform } = await params;
  if (!["chatgpt", "claude", "gemini", "grok"].includes(platform)) notFound();
  const job = await getJob(id);
  if (!job || job.stage !== "ready") notFound();
  return <Preview job={job} platform={platform} />;
}
