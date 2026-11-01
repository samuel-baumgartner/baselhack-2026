import { getJob } from "@/lib/db";
import { Preview } from "@/components/preview";
import HostedHotel from "@/components/hosted-hotel";
import { notFound } from "next/navigation";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const job = await getJob((await params).id);
  if (!job || job.stage !== "ready") notFound();
  if (job.profile?.industry === "hotel") return <HostedHotel jobId={job.id} enabled={job.selected} name={job.profile.name} headline={job.config?.headline} accent={job.profile.accent} />;
  return <Preview job={job} widgetOnly />;
}
