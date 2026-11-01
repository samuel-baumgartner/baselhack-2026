import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import {
  AppBridge,
  PostMessageTransport,
} from "@modelcontextprotocol/ext-apps/app-bridge";
import { CallToolResultSchema } from "@modelcontextprotocol/sdk/types.js";
const origin = "https://galaxus.prism.mvps.ch";
const status = document.querySelector("#status");
const proof = (window.bridgeProof = {
  messages: [],
  contexts: [],
  state: null,
});
async function main() {
  const client = new Client({
    name: "galaxus-isolated-host-regression",
    version: "1.0",
  });
  await client.connect(
    new StreamableHTTPClientTransport(new URL("/mcp", origin)),
  );
  const listing = await client.listResources();
  const resource = await client.readResource({ uri: listing.resources[0].uri });
  const content = resource.contents.find((c) => "text" in c);
  if (!content) throw Error("HTML missing");
  const iframe = document.querySelector("iframe");
  const bridge = new AppBridge(
    client,
    { name: "Isolated image-test host", version: "1.0" },
    { serverTools: {}, logging: {} },
  );
  proof.mutate = async (name, args) =>
    client.callTool({
      name,
      arguments: { sessionId: proof.state.sessionId, ...args },
    });
  bridge.oncalltool = async (params) => {
    const result = await client.callTool(params);
    if (result.structuredContent?.state)
      proof.state = result.structuredContent.state;
    return CallToolResultSchema.parse(result);
  };
  bridge.onmessage = async (params) => {
    proof.messages.push(params);
    return {};
  };
  bridge.onupdatemodelcontext = async (params) => {
    proof.contexts.push(params);
    return {};
  };
  bridge.oninitialized = () => {
    void (async () => {
      await bridge.sendToolInput({ arguments: {} });
      const opened = await client.callTool({
        name: "search_products",
        arguments: {},
      });
      const s = opened.structuredContent.state;
      if (new URLSearchParams(location.search).get("stale") === "1") {
        await client.callTool({ name: "update_filters", arguments: { sessionId: s.sessionId, expectedRevision: s.revision, patch: { maxPriceMinor: 10000 } } });
        proof.state = s;
        await bridge.sendToolResult(CallToolResultSchema.parse(opened));
        status.textContent = "Connected · deliberately stale initial snapshot delivered";
        return;
      }
      const compared = await client.callTool({
        name: "get_products",
        arguments: {
          sessionId: s.sessionId,
          productIds: ["43103281", "61065156"],
        },
      });
      proof.state = compared.structuredContent.state;
      await bridge.sendToolResult(CallToolResultSchema.parse(compared));
      status.textContent =
        "Connected · get_products delivered · <base> removed to reproduce host behavior";
    })();
  };
  await bridge.connect(
    new PostMessageTransport(iframe.contentWindow, iframe.contentWindow),
  );
  iframe.srcdoc = content.text.replace(/<base\b[^>]*>/gi, "");
}
main().catch((e) => {
  status.textContent = "FAILED: " + e.message;
});
