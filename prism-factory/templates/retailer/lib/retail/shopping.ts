import { randomBytes, randomUUID } from "node:crypto";
import {
  defaultFilters,
  filterProducts,
  merchant,
  products,
  editions,
  type Filters,
} from "./catalog";
export type Order = {
  id: string;
  operationId: string;
  reviewedRevision: number;
  totalMinor: number;
  items: { productId: string; quantity: number; unitPriceMinor: number }[];
  createdAt: string;
  status: "synthetic-no-charge";
};
export type State = {
  id: string;
  tenant: string;
  revision: number;
  filters: Filters;
  cart: Record<string, number>;
  orders: Order[];
  preferences: { audio: boolean; watchedProductIds: string[] };
  edition: number;
  stock: Record<string, number>;
};
export type View =
  | "catalog"
  | "compare"
  | "cart"
  | "checkout"
  | "receipt"
  | "updates"
  | "preferences";
export function newState(): State {
  return {
    id: randomBytes(32).toString("hex"),
    tenant: merchant.id,
    revision: 0,
    filters: { ...defaultFilters },
    cart: {},
    orders: [],
    preferences: { audio: false, watchedProductIds: [] },
    edition: 1,
    stock: Object.fromEntries(products.map((p) => [p.id, p.demoStock])),
  };
}
export class DomainError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
function fail(code: string, message: string): never {
  throw new DomainError(code, message);
}
export function requireProduct(id: string) {
  return (
    products.find((p) => p.id === id) ??
    fail("UNKNOWN_PRODUCT", "Unknown product ID.")
  );
}
export function cartSummary(s: State) {
  const items = Object.entries(s.cart).map(([productId, quantity]) => {
    const product = requireProduct(productId);
    return {
      productId,
      quantity,
      unitPriceMinor: product.currentDemoPriceMinor,
      product,
    };
  });
  return {
    items,
    totalMinor: items.reduce(
      (sum, i) => sum + i.quantity * i.unitPriceMinor,
      0,
    ),
    currency: "CHF",
    revision: s.revision,
  };
}
export function snapshot(
  s: State,
  view: View = "catalog",
  selectedProductIds: string[] = [],
  order?: Order,
) {
  return {
    view,
    merchant,
    sessionId: s.id,
    revision: s.revision,
    identity:
      "Synthetic demo session; opaque session ID is a bearer capability. No real customer identity.",
    filters: s.filters,
    products: filterProducts(s.filters).map((p) => ({
      ...p,
      demoStock: s.stock[p.id],
    })),
    allProducts: products.map((p) => ({ ...p, demoStock: s.stock[p.id] })),
    selectedProductIds,
    cart: cartSummary(s),
    preferences: s.preferences,
    editions:
      s.edition > 1
        ? [
            {
              id: `demo-edition-${s.edition}`,
              type: "News + Trends",
              title: `Audio shortlist check-in · edition ${s.edition}`,
              summary:
                "This operator-published update is now available on refresh. Galaxy Buds3 FE remains CHF 91.90 in the frozen snapshot. Revisit fit and your budget before choosing. No live price or stock change is asserted.",
              productIds: ["61065156"],
            },
            ...editions,
          ]
        : editions,
    edition: s.edition,
    order: order ?? s.orders.at(-1) ?? null,
    latestOrder: s.orders.at(-1) ?? null,
    orders: s.orders,
    push: {
      verified: false,
      status:
        "Pull feed only. ChatGPT Events account access and signed delivery are unverified.",
    },
    disclosures: [
      "Prices are 2026-10-31 snapshots, not live offers.",
      "Inventory, shipping and orders are simulated. No charge.",
      "Battery test conditions unknown; listed hours are not a controlled comparison.",
      "Arial fallback; Galactica redistribution rights unverified.",
      "Sony DNC is included in the broad noise-cancelling filter; source label retained.",
    ],
  };
}
export type Snapshot = ReturnType<typeof snapshot>;
export type Command = {
  name: string;
  expectedRevision?: number;
  patch?: Partial<Filters>;
  productId?: string;
  quantity?: number;
  operationId?: string;
  reviewedTotalMinor?: number;
  audio?: boolean;
  watchedProductIds?: string[];
  orderId?: string;
  productIds?: string[];
};
export function execute(
  s: State,
  c: Command,
): {
  state: State;
  view: View;
  order?: Order;
  selected?: string[];
  changed: boolean;
} {
  const n = structuredClone(s);
  // Idempotency lookup precedes revision validation: retries return their original receipt.
  if (c.name === "place_demo_order") {
    const old = s.orders.find((o) => o.operationId === c.operationId);
    if (old) {
      if (
        old.reviewedRevision !== c.expectedRevision ||
        old.totalMinor !== c.reviewedTotalMinor
      )
        fail(
          "IDEMPOTENCY_CONFLICT",
          "Operation ID already used for a different review.",
        );
      return { state: s, view: "receipt", order: old, changed: false };
    }
  }
  const writes = [
    "update_filters",
    "update_cart",
    "place_demo_order",
    "set_update_preferences",
    "publish_demo_update",
  ];
  if (writes.includes(c.name) && c.expectedRevision !== s.revision)
    fail(
      "STALE_REVISION",
      "State changed. Reload the current snapshot and review before retrying.",
    );
  let view: View = "catalog";
  let order: Order | undefined;
  let changed = false;
  switch (c.name) {
    case "search_products":
    case "get_shopping_session":
      break;
    case "update_filters":
      n.filters = { ...n.filters, ...c.patch };
      changed = true;
      break;
    case "get_products":
      (c.productIds ?? []).forEach(requireProduct);
      view = "compare";
      break;
    case "get_cart":
      view = "cart";
      break;
    case "get_checkout":
      view = "checkout";
      break;
    case "update_cart": {
      const p = requireProduct(c.productId!);
      if (!Number.isInteger(c.quantity) || c.quantity! < 0 || c.quantity! > 10)
        fail("INVALID_QUANTITY", "Quantity must be an integer from 0 to 10.");
      if (c.quantity! > n.stock[p.id])
        fail("OUT_OF_STOCK", "Requested quantity exceeds simulated stock.");
      if (c.quantity === 0) delete n.cart[p.id];
      else n.cart[p.id] = c.quantity!;
      changed = true;
      view = "cart";
      break;
    }
    case "place_demo_order": {
      const cart = cartSummary(n);
      if (!cart.items.length)
        fail("EMPTY_CART", "Add a product before placing an order.");
      if (cart.totalMinor !== c.reviewedTotalMinor)
        fail(
          "TOTAL_CHANGED",
          "Reviewed total no longer matches. Review checkout again.",
        );
      if (!c.operationId)
        fail("INVALID_OPERATION", "An operation ID is required.");
      for (const i of cart.items) {
        if (i.quantity > n.stock[i.productId])
          fail("OUT_OF_STOCK", "Simulated stock changed. Review cart.");
        n.stock[i.productId] -= i.quantity;
      }
      order = {
        id: `DEMO-${randomUUID()}`,
        operationId: c.operationId,
        reviewedRevision: s.revision,
        totalMinor: cart.totalMinor,
        items: cart.items.map(({ productId, quantity, unitPriceMinor }) => ({
          productId,
          quantity,
          unitPriceMinor,
        })),
        createdAt: new Date().toISOString(),
        status: "synthetic-no-charge",
      };
      n.orders.push(order);
      n.cart = {};
      view = "receipt";
      changed = true;
      break;
    }
    case "get_order":
      order =
        (c.orderId ? s.orders.find((o) => o.id === c.orderId) : s.orders.at(-1)) ??
        fail("ORDER_NOT_FOUND", "Order is not session.");
      view = "receipt";
      break;
    case "get_updates":
      view = "updates";
      break;
    case "get_update_preferences":
      view = "preferences";
      break;
    case "set_update_preferences":
      if (c.watchedProductIds) c.watchedProductIds.forEach(requireProduct);
      n.preferences = {
        audio: c.audio ?? n.preferences.audio,
        watchedProductIds:
          c.watchedProductIds ?? n.preferences.watchedProductIds,
      };
      view = "updates";
      changed = true;
      break;
    case "publish_demo_update":
      n.edition++;
      view = "updates";
      changed = true;
      break;
    default:
      fail("UNKNOWN_TOOL", "Unknown tool.");
  }
  if (changed) n.revision++;
  return { state: n, view, order, selected: c.productIds, changed };
}
