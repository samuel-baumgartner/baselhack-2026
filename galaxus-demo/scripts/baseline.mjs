import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
const client = new Client({ name: "prism-baseline-test", version: "1.0" });
await client.connect(
  new StreamableHTTPClientTransport(
    new URL("https://galaxus.prism.mvps.ch/mcp"),
  ),
);
console.log("initialize", client.getServerVersion());
console.log(
  "tools",
  (await client.listTools()).tools.map((t) => t.name),
);
console.log(
  "greet",
  await client.callTool({ name: "greet", arguments: { name: "Galaxus" } }),
);
const resources = await client.listResources();
const resource = await client.readResource({ uri: resources.resources[0].uri });
console.log(
  "resource",
  resource.contents.map((c) => ({
    mimeType: c.mimeType,
    bytes: c.text.length,
    csp: c._meta,
  })),
);
await client.close();
