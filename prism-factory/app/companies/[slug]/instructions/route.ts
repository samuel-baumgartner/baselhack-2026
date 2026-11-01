import { getJob } from "@/lib/db";
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const u = new URL(req.url),
    job = await getJob(u.searchParams.get("build") ?? "");
  if (
    !job ||
    job.stage !== "ready" ||
    job.profile?.slug !== (await params).slug
  )
    return new Response("Not found", { status: 404 });
  return new Response(
    `# ${job.profile.name} on PRISM\n\nMCP endpoint: ${u.origin}/apps/${job.id}/mcp\n\nBrowser widget: ${u.origin}/apps/${job.id}/widget\n\nSelected flows: ${job.selected.join(", ")}\n\nPublished configuration: ${job.artifactHash}\n\nActual ChatGPT host connection remains unverified. Claude, Gemini and Grok are visual previews.\n\nThis is synthetic commerce using frozen Galaxus catalog prices. No real orders or payments.\n\nOfficial connection guide: https://developers.openai.com/apps-sdk/deploy/connect-chatgpt\n`,
    {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${job.profile.slug}-prism.md"`,
      },
    },
  );
}
