import { test } from "node:test";
import assert from "node:assert/strict";
import { newState, execute, snapshot, DomainError } from "./shopping";
import { filterProducts, defaultFilters, products } from "./catalog";
const throws = (fn: () => unknown, code: string) =>
  assert.throws(
    fn,
    (e: unknown) => e instanceof DomainError && e.code === code,
  );
test("student budget patch preserves requirements and includes only both budget models", () => {
  const initial = newState();
  assert.equal(snapshot(initial).products.length, 5);
  const { state } = execute(initial, {
    name: "update_filters",
    expectedRevision: 0,
    patch: { maxPriceMinor: 10000, sort: "price_asc" },
  });
  assert.deepEqual(state.filters, { ...defaultFilters, maxPriceMinor: 10000 });
  assert.deepEqual(
    snapshot(state).products.map((p) => p.id),
    ["43103281", "61065156"],
  );
  assert.equal(initial.filters.maxPriceMinor, 25000);
  throws(
    () =>
      execute(state, {
        name: "update_filters",
        expectedRevision: 0,
        patch: { wireless: false },
      }),
    "STALE_REVISION",
  );
});
test("negative fixture and DNC mapping are deliberate and generic filter accepts another catalogue", () => {
  assert(!filterProducts(defaultFilters).some((p) => p.brand === "Shokz"));
  assert(
    filterProducts(defaultFilters).some((p) => p.noiseCancellation === "DNC"),
  );
  const another = products.map((p) => ({
    ...p,
    brand: "Fixture retailer",
    id: `fixture-${p.id}`,
  }));
  assert.equal(
    filterProducts({ ...defaultFilters, maxPriceMinor: 10000 }, another).length,
    2,
  );
  assert.equal(
    filterProducts({
      ...defaultFilters,
      noiseCancelling: false,
      formFactor: "any",
    }).length,
    6,
  );
});
test("stale cart, invalid products, quantities, totals and stock never succeed", () => {
  const s = newState();
  throws(
    () =>
      execute(s, {
        name: "update_cart",
        expectedRevision: 0,
        productId: "bad",
        quantity: 1,
      }),
    "UNKNOWN_PRODUCT",
  );
  throws(
    () =>
      execute(s, {
        name: "update_cart",
        expectedRevision: 0,
        productId: "43103281",
        quantity: 6,
      }),
    "OUT_OF_STOCK",
  );
  throws(
    () =>
      execute(s, {
        name: "update_cart",
        expectedRevision: 0,
        productId: "43103281",
        quantity: -1,
      }),
    "INVALID_QUANTITY",
  );
  throws(
    () =>
      execute(s, {
        name: "place_demo_order",
        expectedRevision: 0,
        operationId: "empty-cart",
        reviewedTotalMinor: 0,
      }),
    "EMPTY_CART",
  );
  const cart = execute(s, {
    name: "update_cart",
    expectedRevision: 0,
    productId: "43103281",
    quantity: 1,
  }).state;
  throws(
    () =>
      execute(cart, {
        name: "place_demo_order",
        expectedRevision: 1,
        operationId: "wrong-total",
        reviewedTotalMinor: 1,
      }),
    "TOTAL_CHANGED",
  );
  cart.stock["43103281"] = 0;
  throws(
    () =>
      execute(cart, {
        name: "place_demo_order",
        expectedRevision: 1,
        operationId: "no-stock",
        reviewedTotalMinor: 5500,
      }),
    "OUT_OF_STOCK",
  );
  assert.equal(cart.orders.length, 0);
});
test("receipt idempotency before revision check, conflict and session order isolation", () => {
  const a = execute(newState(), {
    name: "update_cart",
    expectedRevision: 0,
    productId: "43103281",
    quantity: 1,
  }).state;
  const command = {
    name: "place_demo_order",
    expectedRevision: 1,
    operationId: "repeat-123",
    reviewedTotalMinor: 5500,
  };
  const placed = execute(a, command);
  assert.equal(placed.state.orders.length, 1);
  assert.deepEqual(placed.state.cart, {});
  assert.equal(execute(placed.state, command).order?.id, placed.order?.id);
  throws(
    () => execute(placed.state, { ...command, reviewedTotalMinor: 9190 }),
    "IDEMPOTENCY_CONFLICT",
  );
  throws(
    () => execute(newState(), { name: "get_order", orderId: placed.order!.id }),
    "ORDER_NOT_FOUND",
  );
});
test("two sessions have independent filters cart and preferences", () => {
  const a = newState(),
    b = newState();
  assert.notEqual(a.id, b.id);
  const modified = execute(a, {
    name: "set_update_preferences",
    expectedRevision: 0,
    audio: true,
    watchedProductIds: ["61065156"],
  }).state;
  assert.equal(modified.preferences.audio, true);
  assert.equal(b.preferences.audio, false);
  assert.deepEqual(b.cart, {});
});

test("a generic session reload exposes the latest completed order and its history", () => {
  const cart = execute(newState(), { name: "update_cart", expectedRevision: 0, productId: "43103281", quantity: 1 }).state;
  const first = execute(cart, { name: "place_demo_order", expectedRevision: 1, operationId: "latest-receipt-first", reviewedTotalMinor: 5500 });
  const reloaded = snapshot(first.state);
  assert.equal(reloaded.order?.id, first.order?.id);
  assert.equal(reloaded.orders.length, 1);
  assert.equal(execute(first.state, { name: "get_order" }).order?.id, first.order?.id);
  const secondCart = execute(first.state, { name: "update_cart", expectedRevision: first.state.revision, productId: "61065156", quantity: 1 }).state;
  const second = execute(secondCart, { name: "place_demo_order", expectedRevision: secondCart.revision, operationId: "latest-receipt-second", reviewedTotalMinor: 9190 });
  assert.equal(snapshot(second.state).order?.id, second.order?.id);
  assert.equal(snapshot(second.state).orders.length, 2);
  assert.equal(execute(second.state, { name: "get_order", orderId: first.order!.id }).order?.id, first.order?.id);
  throws(() => execute(newState(), { name: "get_order" }), "ORDER_NOT_FOUND");
});
