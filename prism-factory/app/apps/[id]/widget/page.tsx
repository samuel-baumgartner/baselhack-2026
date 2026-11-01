import { getJob } from "@/lib/db";
import { Preview } from "@/components/preview";
import { notFound } from "next/navigation";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const job = await getJob((await params).id);
  if (!job || job.stage !== "ready") notFound();
  return <Preview job={job} widgetOnly />;
}
