import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAppResource, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { assetOrigin } from "./assets";

export const STORE_RESOURCE_URI = "ui://galaxus/store.html";

export function registerStoreResource(server: McpServer, version: string) {
  const read = (uri: URL) => ({
    contents: [{
      uri: uri.href,
      mimeType: RESOURCE_MIME_TYPE,
      text: `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Galaxus shopping</title><link rel="stylesheet" href="${assetOrigin}/galaxus-widget.css?v=${version}"></head><body><span hidden>GALAXUS_WIDGET</span><div id="root"></div><script src="${assetOrigin}/galaxus-widget.js?v=${version}"></script></body></html>`,
      _meta: {
        ui: { csp: { connectDomains: [assetOrigin], resourceDomains: [assetOrigin] }, prefersBorder: true },
        "openai/widgetDescription": "Galaxus shopping demo. This embedded interface is returned by the Galaxus tool itself; no GenUI Search is needed. Read the tool result to describe shopping state, not whether the host rendered the view.",
        "openai/widgetCSP": { connect_domains: [assetOrigin], resource_domains: [assetOrigin] },
      },
    }],
  });
  registerAppResource(server, "galaxus-store", STORE_RESOURCE_URI, { mimeType: RESOURCE_MIME_TYPE }, read);
  // ChatGPT can retain an earlier tool descriptor after the app is redeployed.
  server.registerResource("galaxus-store-previous-version", new ResourceTemplate("ui://galaxus/store-{version}.html", { list: undefined }), { mimeType: RESOURCE_MIME_TYPE }, read);
}
