import { test } from "node:test";
import assert from "node:assert/strict";
import { selectionSchema, toolsFor } from "./contracts";
import { normalizeUrl, publicIp } from "./url";
test("purchase selection includes discovery, removes duplicates and rejects unknown capabilities", () => {
  assert.deepEqual(selectionSchema.parse(["purchase", "purchase"]), [
    "discover",
    "purchase",
  ]);
  assert.equal(selectionSchema.safeParse([]).success, false);
  assert.equal(selectionSchema.safeParse(["deploy-shell"]).success, false);
});
test("deselected experiences expose no write or updates tools", () => {
  const t = toolsFor(["discover"]);
  assert.ok(t.includes("update_filters"));
  assert.ok(!t.includes("place_demo_order"));
  assert.ok(!t.includes("get_updates"));
});
test("URL normalization rejects credentials, HTTP, private address ranges", () => {
  assert.equal(normalizeUrl("galaxus.ch"), "https://galaxus.ch/");
  for (const u of [
    "http://galaxus.ch",
    "https://user:pw@example.com",
    "https://example.com:444",
  ])
    assert.throws(() => normalizeUrl(u));
  for (const ip of [
    "127.0.0.1",
    "10.0.0.2",
    "192.168.1.3",
    "172.16.0.1",
    "169.254.169.254",
    "::1",
    "fc00::1",
    "::ffff:127.0.0.1",
  ])
    assert.equal(publicIp(ip), false, ip);
  assert.equal(publicIp("8.8.8.8"), true);
});
