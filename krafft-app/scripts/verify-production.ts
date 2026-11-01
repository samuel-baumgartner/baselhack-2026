import assert from "node:assert/strict";
import { smokeHotelApp } from "./hotel-smoke";
const origin = process.argv[2] ?? "https://krafft.prism.mvps.ch";
await smokeHotelApp(origin, ["discover", "purchase", "updates"]);
const response = await fetch(`${origin}/mcp`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream", Origin: "http://127.0.0.1:3051" },
  body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "krafft-cors-verifier", version: "1" } } }),
});
assert.equal(response.status, 200);
assert.equal(response.headers.get("access-control-allow-origin"), "*");
await response.arrayBuffer();
console.log("PASS: production room/date/filter/image, quote, booking replay/latest receipt, saved interests, isolation, resource assets and MCP CORS checks.");
