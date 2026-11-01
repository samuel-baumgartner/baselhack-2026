import { NextResponse } from "next/server";
import { getJob, updateJob } from "@/lib/db";
import { selectionSchema } from "@/lib/contracts";
import { safeId, failure, requireOwner } from "@/lib/http";
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const id = safeId((await params).id),
      job = await getJob(id);
    await requireOwner(req, id);
    if (job?.stage !== "selection")
      throw Error("This build is not waiting for a selection");
    const selected = selectionSchema.parse((await req.json()).selected);
    return NextResponse.json(
      await updateJob(
        id,
        { selected, stage: "queued" },
        {
          title: "Your vision, in motion",
          detail: `${selected.length} experiences selected. The local builder will take it from here.`,
        },
        ["selection"],
      ),
    );
  } catch (e) {
    return failure(e);
  }
}
