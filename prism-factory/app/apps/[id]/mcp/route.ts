import { createMcpHandler } from "mcp-handler";
import {
  registerAppTool,
  registerAppResource,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { getJob } from "@/lib/db";
import { toolsFor } from "@/lib/contracts";
import { definitions } from "@/lib/retail/tools";
import { retail } from "@/lib/retail/store";
import type { Command } from "@/lib/retail/shopping";
export const maxDuration = 60;
async function handle(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^[a-f0-9]{40}$/.test(id))
    return new Response("Not found", { status: 404 });
  const job = await getJob(id);
  if (!job?.config || job.stage !== "ready")
    return new Response("Not found", { status: 404 });
  const origin = new URL(req.url).origin,
    uri = `ui://prism/${id}/retailer.html`;
  const serverInfo = {
    name: job.config.company.name,
    version: "1.0.0",
    ...(job.config.company.name.toLowerCase() === "galaxus" ? { icons: [{ src: `${origin}/merchants/galaxus/icon.svg`, mimeType: "image/svg+xml", sizes: ["any"] }] } : {}),
  };
  const handler = createMcpHandler(
    async (server) => {
      registerAppResource(
        server,
        "prism-retailer",
        uri,
        { mimeType: RESOURCE_MIME_TYPE },
        async () => ({
          contents: [
            {
              uri,
              mimeType: RESOURCE_MIME_TYPE,
              text: `<!doctype html><html><head><base href="${origin}/"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="${origin}/widget.css"></head><body><div id="root"></div><script>window.__PRISM_WIDGET__=${JSON.stringify({ jobId: id, origin, flows: job.selected, headline:job.config?.headline, accent:job.config?.company.accent }).replace(/</g, "\\u003c")}</script><script src="${origin}/widget-runtime.js"></script></body></html>`,
              _meta: {
                ui: {
                  csp: { connectDomains: [origin], resourceDomains: [origin] },
                  prefersBorder: true,
                },
                "openai/widgetCSP": {
                  connect_domains: [origin],
                  resource_domains: [origin],
                },
              },
            },
          ],
        }),
      );
      for (const name of toolsFor(job.selected)) {
        const def = definitions[name as keyof typeof definitions];
        registerAppTool(
          server,
          name,
          {
            title: name.replaceAll("_", " "),
            description: def.description,
            inputSchema: def.schema.shape,
            annotations: {
              readOnlyHint: !def.write,
              destructiveHint: name === "place_demo_order",
              openWorldHint: false,
            },
            _meta: {
              ui: { resourceUri: uri },
              "openai/outputTemplate": uri,
              "openai/widgetAccessible": true,
            },
          },
          async (args: Record<string, unknown>) => {
            try {
              const parsed = def.schema.parse(args) as {
                sessionId?: string;
              } & Partial<Command>;
              const state = await retail(id, { ...parsed, name });
              const result = { ok: true, state };
              return {
                content: [
                  { type: "text" as const, text: JSON.stringify(result) },
                ],
                structuredContent: result,
              };
            } catch (e) {
              return {
                isError: true,
                content: [
                  {
                    type: "text" as const,
                    text: e instanceof Error ? e.message : "Action unavailable",
                  },
                ],
              };
            }
          },
        );
      }
    },
    { serverInfo },
    { basePath: `/apps/${id}`, maxDuration: 60, verboseLogs: false },
  );
  return handler(req);
}
export const GET = handle;
export const POST = handle;
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type,Mcp-Session-Id,Mcp-Protocol-Version",
    },
  });
}
