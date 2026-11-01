import { NextResponse } from "next/server";
import { getJob, updateJob } from "@/lib/db";
import { safeId, failure, requireOwner } from "@/lib/http";
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const id = safeId((await params).id),
      job = await getJob(id);
    await requireOwner(req, id);
    if (!job) throw Error("Build not found");
    const { action } = await req.json();
    if (action === "cancel" && !["ready", "cancelled"].includes(job.stage))
      return NextResponse.json(
        await updateJob(
          id,
          { stage: "cancelled" },
          { title: "Build stopped", detail: "Your progress is saved." },
          [
            "analyzing",
            "selection",
            "queued",
            "planning",
            "reviewing",
            "revising",
            "building",
            "checking",
            "publishing",
            "failed",
          ],
        ),
      );
    if (action === "retry" && ["failed", "cancelled"].includes(job.stage))
      return NextResponse.json(
        await updateJob(
          id,
          { stage: job.profile ? "queued" : "analyzing", error: undefined },
          {
            title: "A fresh start",
            detail: "Resuming from your saved company profile.",
          },
          ["failed", "cancelled"],
        ),
      );
    throw Error("This action is not available");
  } catch (e) {
    return failure(e);
  }
}
