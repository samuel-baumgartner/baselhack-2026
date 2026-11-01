import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { toolsFor, type FlowId } from "../lib/contracts";
export async function smokeGeneratedApp(origin: string, flows: FlowId[], endpoint = "/mcp") {
  const client = new Client({
    name: "prism-source-build-verifier",
    version: "1.0",
  });
  try {
    await client.connect(
      new StreamableHTTPClientTransport(new URL(endpoint, origin)),
    );
    const available = await client.listTools();
    assert.deepEqual(
      available.tools.map((t) => t.name).sort(),
      toolsFor(flows).sort(),
    );
    const invoke = async (name: string, args: Record<string, unknown> = {}) => {
      const result = await client.callTool({ name, arguments: args });
      const data = result.structuredContent as {
        ok: boolean;
        state: {
          sessionId: string;
          revision: number;
          products: { id: string; image: string }[];
          cart: { totalMinor: number };
          order?: { id: string };
          latestOrder?: { id: string };
          preferences: { audio: boolean };
        };
        error?: unknown;
      };
      assert.equal(data.ok, true, JSON.stringify(data.error));
      return data.state;
    };
    let state = await invoke("search_products");
    const sessionId = state.sessionId;
    state = await invoke("update_filters", {
      sessionId,
      expectedRevision: state.revision,
      patch: { maxPriceMinor: 10000 },
    });
    assert.equal(state.products.length, 2);
    for (const product of state.products) {
      const response = await fetch(
        new URL(new URL(product.image).pathname, origin),
      );
      assert.equal(response.status, 200);
      assert.match(response.headers.get("content-type") ?? "", /^image\//);
      await response.arrayBuffer();
    }
    if (flows.includes("purchase")) {
      state = await invoke("update_cart", {
        sessionId,
        expectedRevision: state.revision,
        productId: "43103281",
        quantity: 1,
      });
      assert.equal(state.cart.totalMinor, 5500);
      const order = {
        sessionId,
        expectedRevision: state.revision,
        operationId: "factory-acceptance-order",
        reviewedTotalMinor: 5500,
      };
      state = await invoke("place_demo_order", order);
      const receiptId = state.order!.id;
      const repeated = await invoke("place_demo_order", order);
      assert.equal(repeated.order!.id, receiptId);
      state = await invoke("get_shopping_session", { sessionId });
      assert.equal(state.latestOrder!.id, receiptId);
    }
    if (flows.includes("updates")) {
      state = await invoke("set_update_preferences", {
        sessionId,
        expectedRevision: state.revision,
        audio: true,
      });
      assert.equal(state.preferences.audio, true);
    }
    const resources = await client.listResources();
    const resource = await client.readResource({
      uri: resources.resources[0].uri,
    });
    const html = resource.contents.find((c) => "text" in c)?.text;
    assert.ok(html);
    for (const match of html.matchAll(/(?:href|src)="([^\"]+\.(?:js|css))"/g)) {
      const response = await fetch(new URL(new URL(match[1]).pathname, origin));
      assert.equal(response.status, 200);
      await response.arrayBuffer();
    }
    const separate = await invoke("search_products");
    assert.notEqual(separate.sessionId, sessionId);
    assert.equal(separate.cart.totalMinor, 0);
    assert.equal(separate.preferences.audio, false);
    return { sessionId, latestOrderId: state.latestOrder?.id };
  } finally {
    await client.close();
  }
}
