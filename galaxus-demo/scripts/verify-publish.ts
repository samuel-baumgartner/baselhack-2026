import { loadEnvConfig } from "@next/env";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import assert from "node:assert/strict";
import { runCommand } from "../lib/db";
loadEnvConfig(process.cwd());
async function main() {
  const c = new Client({ name: "prism-operator-feed-test", version: "1.0" });
  await c.connect(
    new StreamableHTTPClientTransport(
      new URL("https://galaxus.prism.mvps.ch/mcp"),
    ),
  );
  try {
    const opened = await c.callTool({ name: "search_products", arguments: {} });
    const initial = (
      opened.structuredContent as {
        state: { sessionId: string; revision: number };
      }
    ).state;
    await runCommand(initial.sessionId, {
      name: "publish_demo_update",
      expectedRevision: initial.revision,
    });
    const result = await c.callTool({
      name: "get_updates",
      arguments: { sessionId: initial.sessionId },
    });
    const state = (
      result.structuredContent as {
        state: {
          edition: number;
          editions: { title: string }[];
          push: { verified: boolean };
        };
      }
    ).state;
    assert.equal(state.edition, 2);
    assert.equal(state.editions.length, 4);
    assert.equal(state.push.verified, false);
    console.log(
      "PASS restricted DB operator publish -> actual HTTPS MCP pull feed shows persisted edition 2, no push claim.",
    );
  } finally {
    await c.close();
  }
}
void main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
