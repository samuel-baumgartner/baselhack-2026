import { NextResponse } from "next/server";
import { getJob } from "@/lib/db";
import { safeId, failure } from "@/lib/http";
export const dynamic = "force-dynamic";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const job = await getJob(safeId((await params).id));
    if (!job) return failure(Error("Build not found"), 404);
    return NextResponse.json(job, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return failure(e);
  }
}
