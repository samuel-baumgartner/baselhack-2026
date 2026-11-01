import { getJob } from "@/lib/db";
import { failure, requestOrigin, safeId } from "@/lib/http";
import { platformConnection, platforms } from "@/lib/platform-targets";
export async function GET(req: Request, { params }: { params: Promise<{ id: string; platform: string }> }) {
  try {
    const { id, platform } = await params;
    const job = await getJob(safeId(id));
    if (!job?.config || job.stage !== "ready") return new Response("Build not published", { status: 404 });
    if (!platforms.some(target => target.id === platform && target.capability !== "preview")) return new Response("This platform has no native installation artifact", { status: 404 });
    const endpoint = `${requestOrigin(req)}/apps/${job.id}/mcp`;
    const artifact = platformConnection(platform, endpoint, job.config.company.name);
    if (!artifact) return new Response("This platform has no native installation artifact", { status: 404 });
    return new Response(artifact.content, { headers: { "Content-Type": artifact.mimeType, "Content-Disposition": `attachment; filename="${artifact.filename.replace(/[\r\n"]/g, "")}"`, "Cache-Control": "no-store" } });
  } catch (error) { return failure(error); }
}
