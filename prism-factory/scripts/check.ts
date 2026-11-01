import assert from "node:assert/strict";
import { writeFile, mkdir } from "node:fs/promises";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
const base = process.env.CHECK_BASE ?? "http://localhost:3040",
  id = process.env.CHECK_JOB ?? "0371f90bdac0643f688a58437d9ef45d6a0969ff";
const checks: { name: string; passed: boolean; detail?: unknown }[] = [];
const check = (name: string, ok: unknown, detail?: unknown) => {
  assert.ok(ok, name);
  checks.push({ name, passed: true, detail });
};
async function post(path: string, data: unknown) {
  const r = await fetch(base + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const j = await r.json();
  assert.ok(r.ok, JSON.stringify(j));
  return j;
}
const job = await (await fetch(`${base}/api/jobs/${id}`)).json();
check("Actual factory build is ready", job.stage === "ready");
check(
  "Planner and independent reviewer persisted",
  job.threadId && job.reviewThreadId && job.threadId !== job.reviewThreadId,
);
check(
  "Immutable configuration and deterministic checks",
  job.artifactHash?.length === 64 &&
    job.checks.every((c: { passed: boolean }) => c.passed),
);
let { state } = await post(`/api/retail/${id}`, { name: "search_products" });
const sessionId = state.sessionId;
const chat = await post(`/api/chat/${id}`, {
  message: "Adjust the filters, I'm a student and want to spend less",
  sessionId,
  history: [],
});
state = chat.state;
check(
  "Real model calls update_filters",
  chat.calls.includes("update_filters"),
  chat.calls,
);
check(
  "Student followup sets CHF100 and two matches",
  state.filters.maxPriceMinor === 10000 && state.products.length === 2,
  chat.text,
);
const persisted = await post(`/api/retail/${id}`, {
  name: "get_shopping_session",
  sessionId,
});
check(
  "Reload preserves conversational filters",
  persisted.state.filters.maxPriceMinor === 10000,
);
({ state } = await post(`/api/retail/${id}`, {
  name: "get_products",
  sessionId,
  productIds: ["43103281", "61065156"],
}));
check(
  "Comparison selects two real products",
  state.view === "compare" && state.selectedProductIds.length === 2,
);
({ state } = await post(`/api/retail/${id}`, {
  name: "update_cart",
  sessionId,
  expectedRevision: state.revision,
  productId: "43103281",
  quantity: 1,
}));
const command = {
  name: "place_demo_order",
  sessionId,
  expectedRevision: state.revision,
  operationId: `verify-${Date.now()}`,
  reviewedTotalMinor: state.cart.totalMinor,
};
const receipt = await post(`/api/retail/${id}`, command);
const retry = await post(`/api/retail/${id}`, command);
check(
  "Checkout is synthetic and repeat-safe",
  receipt.state.order.id === retry.state.order.id &&
    receipt.state.order.status === "synthetic-no-charge",
);
const second = await post(`/api/retail/${id}`, { name: "search_products" });
check(
  "Shopping sessions isolated",
  second.state.sessionId !== sessionId &&
    second.state.cart.items.length === 0 &&
    second.state.filters.maxPriceMinor === 25000,
);
const followed = await post(`/api/chat/${id}`, {
  message: "Follow audio updates for me.",
  sessionId,
  history: [],
});
check(
  "Conversation can follow audio using the shared preference tool",
  followed.calls.includes("set_update_preferences") &&
    followed.state.preferences.audio,
);
const preferences = await post(`/api/retail/${id}`, {
  name: "get_update_preferences",
  sessionId,
});
check(
  "Conversational follow preference is durable",
  preferences.state.preferences.audio,
);
const updates = await post(`/api/retail/${id}`, {
  name: "get_updates",
  sessionId,
});
check(
  "Pull updates work",
  updates.state.editions.length >= 3 && updates.state.push.verified === false,
);
const client = new Client({ name: "prism-e2e", version: "1.0" });
await client.connect(
  new StreamableHTTPClientTransport(new URL(`${base}/apps/${id}/mcp`)),
);
const tools = await client.listTools();
check("Generated MCP publishes selected tools", tools.tools.length >= 10);
const result = await client.callTool({
  name: "search_products",
  arguments: {},
});
check(
  "MCP search returns real canonical state",
  (result.structuredContent as { ok?: boolean })?.ok,
);
const resources = await client.listResources();
const resource = await client.readResource({ uri: resources.resources[0].uri });
check(
  "MCP Apps resource has executable widget",
  String(
    "text" in resource.contents[0] ? resource.contents[0].text : "",
  ).includes("widget-runtime.js"),
);
await client.close();
for (const path of [
  "/",
  `/build/${id}`,
  `/build/${id}/preview/chatgpt`,
  `/build/${id}/preview/claude`,
  `/build/${id}/preview/gemini`,
  `/build/${id}/preview/grok`,
  `/companies/galaxus?build=${id}`,
  `/apps/${id}/widget`,
  "/widget-runtime.js",
  "/widget.css",
]) {
  const r = await fetch(base + path);
  check(`HTTPS/page ${path}`, r.ok);
}
await mkdir("docs/verification", { recursive: true });
await writeFile(
  "docs/verification/api-checks.json",
  JSON.stringify({ at: new Date().toISOString(), base, id, checks }, null, 2),
);
console.log(
  JSON.stringify({ passed: checks.length, base, id, checks }, null, 2),
);
