import { createMcpHandler } from "mcp-handler";
import { registerAppTool, registerAppResource, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { getJob } from "@/lib/db";
import { toolsFor } from "@/lib/contracts";
import { definitions as retailDefinitions } from "@/lib/retail/tools";
import { definitions as hotelDefinitions } from "@/lib/hotel/tools";
import { retail } from "@/lib/retail/store";
import { stay } from "@/lib/hotel/store";
import { requestOrigin } from "@/lib/http";
import { DomainError as RetailError } from "@/lib/retail/shopping";
import { DomainError as HotelError } from "@/lib/hotel/stay";
export const maxDuration = 60;
async function handle(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-f0-9]{40}$/.test(id)) return new Response("Not found", { status: 404 });
  const job = await getJob(id);
  if (!job?.config || job.stage !== "ready") return new Response("Not found", { status: 404 });
  const hotel = job.profile?.industry === "hotel";
  const origin = requestOrigin(req);
  const uri = `ui://prism/${id}/${hotel ? "hotel" : "retailer"}.html`;
  const icon = hotel ? "/merchants/krafft/logo.png" : "/merchants/galaxus/icon.svg";
  const serverInfo = { name: job.config.company.name, version: "1.1.0", icons: [{ src: `${origin}${icon}`, mimeType: hotel ? "image/png" : "image/svg+xml", sizes: ["any"] }] };
  const handler = createMcpHandler(async server => {
    const widget = hotel ? { css: "hotel-widget.css", js: "hotel-widget-runtime.js", global: "__PRISM_HOTEL__", config: { jobId: id, enabled: job.selected, name: job.config!.company.name, headline: job.config!.headline, accent: job.config!.company.accent } } : { css: "widget.css", js: "widget-runtime.js", global: "__PRISM_WIDGET__", config: { jobId: id, origin, flows: job.selected, headline: job.config!.headline, accent: job.config!.company.accent } };
    registerAppResource(server, hotel ? "prism-hotel" : "prism-retailer", uri, { mimeType: RESOURCE_MIME_TYPE }, async () => ({ contents: [{
      uri, mimeType: RESOURCE_MIME_TYPE,
      text: `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="${origin}/${widget.css}"></head><body><div id="root"></div><script>window.${widget.global}=${JSON.stringify(widget.config).replace(/</g,"\\u003c")}</script><script src="${origin}/${widget.js}"></script></body></html>`,
      _meta: {
        ui: { csp: { connectDomains: [origin], resourceDomains: [...new Set([origin, "https://prism.mvps.ch"])] }, prefersBorder: true },
        "openai/widgetCSP": { connect_domains: [origin], resource_domains: [...new Set([origin, "https://prism.mvps.ch"])] },
        "openai/widgetDescription": hotel ? "Hotel room discovery, reviewed synthetic reservations and guest updates. This tool already supplies its embedded app. No GenUI lookup is needed. Rates and reservations are demo data." : "Retail product discovery, comparison, synthetic shopping and saved interests. This tool already supplies its embedded app. No GenUI lookup is needed.",
      },
    }] }));
    for (const name of toolsFor(job.selected, job.profile?.industry)) {
      const definition = hotel ? hotelDefinitions[name as keyof typeof hotelDefinitions] : retailDefinitions[name as keyof typeof retailDefinitions];
      registerAppTool(server, name, {
        title: name.replaceAll("_", " "), description: definition.description, inputSchema: definition.schema.shape,
        annotations: { readOnlyHint: !definition.write, destructiveHint: name === "place_demo_order" || name === "reserve_demo_stay", idempotentHint: !["search_rooms","search_products"].includes(name), openWorldHint: false },
        _meta: { ui: { resourceUri: uri }, "openai/outputTemplate": uri, "openai/widgetAccessible": true },
      }, async (args: Record<string, unknown>) => {
        try {
          const parsed = definition.schema.parse(args);
          const state = hotel ? await stay(id, { ...parsed, name } as Parameters<typeof stay>[1]) : await retail(id, { ...parsed, name } as Parameters<typeof retail>[1]);
          const result = { ok: true, state };
          return { content: [{ type: "text" as const, text: JSON.stringify(result) }], structuredContent: result };
        } catch (error) {
          const known = error instanceof RetailError || error instanceof HotelError;
          const result = { ok: false, error: { code: known ? error.code : "REQUEST_FAILED", message: known ? error.message : "This operation could not be confirmed. Reload the current session before trying again." } };
          return { isError: true, content: [{ type: "text" as const, text: JSON.stringify(result) }], structuredContent: result };
        }
      });
    }
  }, { serverInfo }, { basePath: `/apps/${id}`, maxDuration: 60, verboseLogs: false });
  return handler(req);
}
export const GET = handle;
export const POST = handle;
export async function OPTIONS() { return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type,Mcp-Session-Id,Mcp-Protocol-Version" } }); }
