import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { randomUUID, createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";
const origin = process.env.TEST_ORIGIN || "https://galaxus.prism.mvps.ch";
const evidence = { timestamp: new Date().toISOString(), origin, checks: [] };
const check = (name, details) => {
  evidence.checks.push({ name, details });
  console.log("PASS", name, details ?? "");
};
async function connect() {
  const client = new Client({
    name: "galaxus-production-verification",
    version: "1.0",
  });
  await client.connect(
    new StreamableHTTPClientTransport(new URL("/mcp", origin)),
  );
  return client;
}
const client = await connect();
try {
  check("HTTPS initialize", client.getServerVersion());
  const tools = (await client.listTools()).tools;
  assert.equal(tools.length, 12);
  assert(tools.every((t) => t.outputSchema));
  check("12 typed tools discovered");
  assert.equal(
    tools.find((t) => t.name === "search_products").annotations.readOnlyHint,
    false,
  );
  async function invoke(name, args = {}) {
    return await client.callTool({ name, arguments: args });
  }
  async function call(name, args = {}) {
    const r = await invoke(name, args);
    assert(!r.isError, JSON.stringify(r));
    assert.equal(r.structuredContent.ok, true);
    return r.structuredContent.state;
  }
  const a = await call("search_products"),
    b = await call("search_products");
  assert.notEqual(a.sessionId, b.sessionId);
  assert.equal(a.products.length, 5);
  let s = await call("update_filters", {
    sessionId: a.sessionId,
    expectedRevision: a.revision,
    patch: { maxPriceMinor: 10000, sort: "price_asc" },
  });
  assert.deepEqual(
    s.products.map((p) => p.id),
    ["43103281", "61065156"],
  );
  assert.deepEqual(s.filters, {
    maxPriceMinor: 10000,
    formFactor: "in-ear",
    wireless: true,
    noiseCancelling: true,
    sort: "price_asc",
  });
  check(
    "student typed patch preserves requirements and excludes premium / open-ear",
    s.products.map((p) => p.name),
  );
  const stale = await invoke("update_filters", {
    sessionId: s.sessionId,
    expectedRevision: 0,
    patch: { noiseCancelling: false },
  });
  assert(stale.isError);
  assert.equal(stale.structuredContent.error.code, "STALE_REVISION");
  check("stale revisions rejected");
  const compare = await call("get_products", {
    sessionId: s.sessionId,
    productIds: ["43103281", "61065156"],
  });
  assert.equal(compare.view, "compare");
  assert.deepEqual(compare.selectedProductIds, ["43103281", "61065156"]);
  assert(
    compare.allProducts.every((p) => p.batteryTestMode === "not verified"),
  );
  check("comparison returns selected IDs and uncertainty");
  const stock = await invoke("update_cart", {
    sessionId: s.sessionId,
    expectedRevision: s.revision,
    productId: "43103281",
    quantity: 6,
  });
  assert(stock.isError);
  assert.equal(stock.structuredContent.error.code, "OUT_OF_STOCK");
  s = await call("update_cart", {
    sessionId: s.sessionId,
    expectedRevision: s.revision,
    productId: "43103281",
    quantity: 1,
  });
  assert.equal(s.cart.totalMinor, 5500);
  const other = await call("get_cart", { sessionId: b.sessionId });
  assert.equal(other.cart.items.length, 0);
  assert.equal(other.filters.maxPriceMinor, 25000);
  check("two independent sessions isolate carts and filters");
  const checkout = await call("get_checkout", { sessionId: s.sessionId });
  const orderArgs = {
    sessionId: s.sessionId,
    expectedRevision: checkout.revision,
    reviewedTotalMinor: checkout.cart.totalMinor,
    operationId: randomUUID(),
  };
  const wrong = await invoke("place_demo_order", {
    ...orderArgs,
    reviewedTotalMinor: 1,
  });
  assert(wrong.isError);
  assert.equal(wrong.structuredContent.error.code, "TOTAL_CHANGED");
  // Concurrent delivery must create exactly one receipt through atomic compare-and-swap.
  const [first, duplicate] = await Promise.all([
    call("place_demo_order", orderArgs),
    call("place_demo_order", orderArgs),
  ]);
  assert.equal(first.order.id, duplicate.order.id);
  assert.equal(first.cart.items.length, 0);
  check("atomic concurrent idempotent order", first.order.status);
  const refreshedOrder = await call("get_shopping_session", { sessionId: s.sessionId });
  assert.equal(refreshedOrder.order.id, first.order.id);
  assert.equal(refreshedOrder.latestOrder.id, first.order.id);
  assert.equal(refreshedOrder.orders.length, 1);
  const latestReceipt = await call("get_order", { sessionId: s.sessionId });
  assert.equal(latestReceipt.order.id, first.order.id);
  check("latest completed order remains visible after cart clears and session reload");
  const cross = await invoke("get_order", {
    sessionId: b.sessionId,
    orderId: first.order.id,
  });
  assert(cross.isError);
  assert.equal(cross.structuredContent.error.code, "ORDER_NOT_FOUND");
  check("receipt ownership enforced");
  const preferences = await call("set_update_preferences", {
    sessionId: s.sessionId,
    expectedRevision: first.revision,
    audio: true,
    watchedProductIds: ["61065156"],
  });
  assert.equal(preferences.preferences.audio, true);
  const client2 = await connect();
  try {
    const r = await client2.callTool({
      name: "get_update_preferences",
      arguments: { sessionId: s.sessionId },
    });
    assert.equal(r.structuredContent.state.preferences.audio, true);
    assert.deepEqual(r.structuredContent.state.preferences.watchedProductIds, [
      "61065156",
    ]);
    const cart = await client2.callTool({
      name: "get_cart",
      arguments: { sessionId: s.sessionId },
    });
    assert.equal(cart.structuredContent.state.cart.totalMinor, 0);
  } finally {
    await client2.close();
  }
  check("cross-connection durable cart and newsletter preferences");
  const feed = await call("get_updates", { sessionId: s.sessionId });
  assert.equal(feed.editions.length, 3);
  assert.equal(feed.push.verified, false);
  check("useful pull feed; push explicitly unverified");
  const resourceList = await client.listResources();
  assert.equal(resourceList.resources.length, 1);
  const resource = await client.readResource({
    uri: resourceList.resources[0].uri,
  });
  for (const oldUri of ["ui://galaxus/store-75e0b3897397.html", "ui://galaxus/store-v2.html"]) {
    const legacy = await client.readResource({ uri: oldUri });
    assert.equal(legacy.contents[0].uri, oldUri);
    assert.match(legacy.contents[0].text, /galaxus-widget\.js/);
  }
  check("cached descriptors from older deployments retain executable resource reads");
  const html = resource.contents[0].text;
  assert(html.includes("GALAXUS_WIDGET"));
  assert(!html.includes("This page is unavailable"));
  const meta = resource.contents[0]._meta;
  assert.deepEqual(meta.ui.csp.resourceDomains, [origin]);
  check("resource HTML and declared CSP", {
    mimeType: resource.contents[0].mimeType,
    bytes: html.length,
  });
  const urls = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map((m) => m[1].replaceAll("&amp;", "&"))
    .filter((u) => /\/galaxus-widget\.(js|css)/.test(u));
  assert.equal(new Set(urls).size, 2, "Standalone widget script and stylesheet are referenced");
  for (const url of new Set(urls)) {
    const response = await fetch(new URL(url, origin));
    assert(response.ok, `${url}: ${response.status}`);
    assert(Number(response.headers.get("content-length") ?? 1) > 0);
    await response.arrayBuffer();
  }
  check("all resource JS/CSS URLs reachable", new Set(urls).size);
  for (const p of a.allProducts) {
    const response = await fetch(new URL(p.image, origin));
    assert(response.ok);
    assert(response.headers.get("content-type")?.startsWith("image/"));
    const bytes=Buffer.from(await response.arrayBuffer());
    assert(bytes.byteLength > 1000);
    assert.equal(createHash("sha256").update(bytes).digest("hex"),p.referenceImageSha256);
  }
  check("six original product images served with reference SHA-256 integrity");
  const logo=await fetch(`${origin}/merchants/galaxus/logo.svg`);assert(logo.ok);const svg=await logo.text();assert(svg.includes('xmlns="http://www.w3.org/2000/svg"'));assert(svg.includes('viewBox="0 0 597 100"'));check("wordmark deployment SVG namespace and aspect ratio");
  const options = await fetch(`${origin}/mcp`, { method: "OPTIONS" });
  assert.equal(options.status, 204);
  assert.equal(options.headers.get("access-control-allow-origin"), "*");
  check("MCP OPTIONS CORS");
  const invalid = await invoke("get_products", {
    sessionId: s.sessionId,
    productIds: ["nonexistent"],
  });
  assert(invalid.isError);
  check("unknown products return explicit errors");
  await writeFile(
    "docs/production-checks.json",
    JSON.stringify(evidence, null, 2) + "\n",
  );
} finally {
  await client.close();
}
