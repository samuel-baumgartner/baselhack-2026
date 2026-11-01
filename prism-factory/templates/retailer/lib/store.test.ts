import { test } from "node:test";
import assert from "node:assert/strict";
import { openSession, runCommand } from "./store";
test("local file store preserves latest receipt and serializes duplicate order attempts", async () => {
  const start = await openSession();
  const cart = await runCommand(start.sessionId, { name: "update_cart", expectedRevision: 0, productId: "43103281", quantity: 1 });
  const command = { name: "place_demo_order", expectedRevision: cart.revision, reviewedTotalMinor: 5500, operationId: "local-store-idempotency-check" };
  const [first, second] = await Promise.all([runCommand(start.sessionId, command), runCommand(start.sessionId, command)]);
  assert.equal(first.order?.id, second.order?.id);
  const restored = await runCommand(start.sessionId, { name: "get_shopping_session" });
  assert.equal(restored.latestOrder?.id, first.order?.id);
  const other = await openSession();
  await assert.rejects(runCommand(other.sessionId, { name: "get_order", orderId: first.order!.id }));
});
