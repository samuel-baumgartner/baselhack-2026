import { test } from "node:test";
import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { registerStoreResource, STORE_RESOURCE_URI } from "./widget-resource";

test("cached descriptors from a previous deployment still resolve to an executable widget", async () => {
  const server = new McpServer({ name: "resource-regression", version: "1" });
  registerStoreResource(server, "bbbbbbbbbbbb");
  const client = new Client({ name: "cached-chatgpt-host", version: "1" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  try {
    for (const uri of [STORE_RESOURCE_URI, "ui://galaxus/store-aaaaaaaaaaaa.html", "ui://galaxus/store-v2.html"]) {
      const result = await client.readResource({ uri });
      assert.equal(result.contents[0].uri, uri);
      assert.equal(result.contents[0].mimeType, "text/html;profile=mcp-app");
      assert.ok("text" in result.contents[0]);
      assert.match(String(result.contents[0].text), /galaxus-widget\.js\?v=bbbbbbbbbbbb/);
    }
  } finally {
    await client.close();
    await server.close();
  }
});
