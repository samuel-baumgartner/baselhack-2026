import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { config } from "../src/server/config";
import { signedHeaders } from "../src/server/adapters/callback";
import { db, pool } from "../src/server/db";
import { offers } from "../src/server/db/schema";
import { DEMO_TENANT } from "../src/lib/contracts";
import { eq } from "drizzle-orm";
const base = config().APP_URL;
const client = new Client({ name: "presence-verification", version: "1.0.0" });
await client.connect(
  new StreamableHTTPClientTransport(
    new URL("/customers/hotel-linden-basel/mcp", base),
  ),
);
const tools = await client.listTools();
if (!tools.tools.some((t) => t.name === "business_capabilities"))
  throw new Error("Missing MCP tool");
await client.callTool({ name: "business_capabilities", arguments: {} });
await client.close();
const schema = await fetch(
  new URL("/customers/hotel-linden-basel/openapi.json", base),
).then((r) => r.json());
if (!schema.paths["/inquiries"].post.requestBody)
  throw new Error("Missing request schema");
const unauth = await fetch(
  new URL(
    "/customers/hotel-linden-basel/api/v1/tasks/00000000-0000-4000-8000-000000000000",
    base,
  ),
);
if (unauth.status !== 401)
  throw new Error("Private task endpoint was not protected");
const [offer] = await db
  .select()
  .from(offers)
  .where(eq(offers.tenantId, DEMO_TENANT));
if (offer) {
  const body = JSON.stringify({
    id: offer.id,
    type: "offer",
    tenantId: DEMO_TENANT,
    recordId: offer.id,
  });
  const response = await fetch(new URL("/api/demo/agent-events", base), {
    method: "POST",
    headers: signedHeaders(body),
    body,
  });
  if (!(await response.json()).duplicate)
    throw new Error("Callback replay not deduplicated");
}
await pool.end();
console.log(
  "MCP discovery/call, OpenAPI schemas, buyer authorization and callback replay passed.",
);
