import { getJob } from "@/lib/db";
import { platforms } from "@/lib/platform-targets";
import { requestOrigin } from "@/lib/http";
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const u = new URL(req.url),
    job = await getJob(u.searchParams.get("build") ?? "");
  if (!job || job.stage !== "ready" || job.profile?.slug !== (await params).slug)
    return new Response("Not found", { status: 404 });
  const origin = requestOrigin(req);
  const hotel = job.profile.industry === "hotel";
  const targets = platforms.filter(target => target.capability !== "preview");
  return new Response(
    `# ${job.profile.name} on PRISM\n\nMCP endpoint: ${origin}/apps/${job.id}/mcp\n\nBrowser widget: ${origin}/apps/${job.id}/widget\n\nSelected flows: ${job.selected.join(", ")}\n\nPublished configuration: ${job.artifactHash}\n\n${hotel ? "Hotel rooms, dates, guests, reviewed reservations and saved guest interests. Rates, availability and reservations are synthetic; no real room is reserved and nothing is charged." : "Synthetic retail commerce using a prepared catalogue. No real orders, payments or deliveries."}\n\n## Connection packages\n\n${targets.map(target => `- ${target.name}: ${target.kind}. ${origin}/api/jobs/${job.id}/integrations/${target.id}`).join("\n")}\n\nActual installation and rendering inside provider accounts remain unverified. Perplexity and Mistral are tools-only. Gemini access is a restricted preview. Grok has no native consumer installation package.\n\nThe public endpoint runs the shared configured template with durable sessions. Generated source applications run separately on the local build host.\n`,
    { headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${job.profile.slug}-prism.md"`,
    } },
  );
}
