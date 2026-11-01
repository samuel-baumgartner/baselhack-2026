import { createMcpHandler } from "mcp-handler";
import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { config } from "@/lib/config";
import { toolsFor } from "@/lib/contracts";
import { definitions } from "@/lib/hotel/tools";
import { DomainError, type Command } from "@/lib/hotel/stay";
import { openSession, runCommand } from "@/lib/store";
import { assetOrigin } from "@/lib/assets";
export const dynamic = "force-dynamic";
const uri = "ui://prism/stay.html";
const serverInfo = { name: config.company.name, version: "1.0.0" };
const handler = createMcpHandler(async server => {
  registerAppResource(server, "merchant-store", uri, { mimeType: RESOURCE_MIME_TYPE }, async () => ({ contents: [{
    uri, mimeType: RESOURCE_MIME_TYPE,
    text: `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="${assetOrigin}/widget.css"></head><body><div id="root"></div><script src="${assetOrigin}/widget.js"></script></body></html>`,
    _meta: { ui: { csp: { connectDomains: [assetOrigin], resourceDomains: [assetOrigin] }, prefersBorder: true }, "openai/widgetCSP": { connect_domains: [assetOrigin], resource_domains: [assetOrigin] }, "openai/widgetDescription": "The hotel stay interface is provided by this tool result. No additional GenUI search is needed. Do not infer rendering failure from missing model-visible UI data." },
  }] }));
  for (const name of toolsFor(config.flows)) {
    const definition = definitions[name as keyof typeof definitions];
    registerAppTool(server, name, {
      title: name.replaceAll("_", " "), description: definition.description,
      inputSchema: definition.schema.shape,
      annotations: { readOnlyHint: !definition.write, destructiveHint: name === "reserve_demo_stay", openWorldHint: false },
      _meta: { ui: { resourceUri: uri }, "openai/outputTemplate": uri, "openai/widgetAccessible": true },
    }, async (args: Record<string, unknown>) => {
      try {
        const parsed = definition.schema.parse(args) as Command & { sessionId?: string };
        const state = name === "search_rooms" && !parsed.sessionId ? await openSession() : await runCommand(parsed.sessionId!, { ...parsed, name });
        return { content: [{ type: "text" as const, text: JSON.stringify({ ok: true, state }) }], structuredContent: { ok: true, state } };
      } catch (error) {
        const result = { ok: false, error: { code: error instanceof DomainError ? error.code : "REQUEST_FAILED", message: error instanceof DomainError ? error.message : "The operation could not be completed. Reload your session before retrying." } };
        return { isError: true, content: [{ type: "text" as const, text: JSON.stringify(result) }], structuredContent: result };
      }
    });
  }
}, { serverInfo }, { basePath: "", verboseLogs: false });
export const POST = handler;
export const GET = handler;
export async function OPTIONS() { return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type,Mcp-Session-Id,Mcp-Protocol-Version" } }); }
