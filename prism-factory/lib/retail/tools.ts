import { z } from "zod";
export const filterPatch = z
  .object({
    maxPriceMinor: z
      .number()
      .int()
      .min(0)
      .max(1000000)
      .optional()
      .describe(
        "Adjustable budget in CHF cents. For the student demo explain CHF 100 and set 10000; no student discount.",
      ),
    formFactor: z.enum(["any", "in-ear", "open-ear"]).optional(),
    wireless: z.boolean().optional(),
    noiseCancelling: z.boolean().optional(),
    sort: z.enum(["price_asc", "price_desc"]).optional(),
  })
  .strict();
const sessionId = z
  .string()
  .regex(/^[a-f0-9]{64}$/)
  .describe(
    "Server-issued opaque demo session capability from the previous tool result. Reuse across turns; never invent or use another session.",
  );
const revision = z
  .number()
  .int()
  .nonnegative()
  .describe(
    "Current canonical revision from latest result. Reload on conflict.",
  );
const ids = z.array(z.string()).max(6);
const scope = { sessionId };
const write = { sessionId, expectedRevision: revision };
export const definitions = {
  search_products: {
    description:
      "Open a synthetic Galaxus shopping session with wireless in-ear noise-cancelling requirements. Reuse sessionId for an existing shopper. Snapshot prices from 2026-10-31, no live shopping. Returns canonical filters and products. If user requests student budget, use update_filters on this session next.",
    schema: z.object({ sessionId: sessionId.optional() }),
    write: true,
  },
  get_shopping_session: {
    description:
      "Reload canonical filters, products, shared cart, latestOrder, order history and saved preferences for this session. An empty cart does not mean no order: inspect latestOrder or call get_order without orderId.",
    schema: z.object(scope),
    write: false,
  },
  update_filters: {
    description:
      'Patch only requested filters in the EXISTING session. Preserve in-ear, wireless and noiseCancelling requirements. For "I am a student" explain an adjustable CHF100 demo cap (not a discount), patch maxPriceMinor=10000 and sort=price_asc. Model and UI use this same revisioned state.',
    schema: z.object({ ...write, patch: filterPatch }),
    write: true,
  },
  get_products: {
    description:
      "Compare the selected productIds from model context using stored source facts. Return exact IDs; listed battery conditions are unverified: never declare a tested battery winner.",
    schema: z.object({ ...scope, productIds: ids.min(1) }),
    write: false,
  },
  get_cart: {
    description: "Read the durable shared synthetic cart.",
    schema: z.object(scope),
    write: false,
  },
  update_cart: {
    description:
      "Set absolute quantity for a stored product in the durable demo cart. Zero removes. Validates revision and simulated stock. No real order.",
    schema: z.object({
      ...write,
      productId: z.string(),
      quantity: z.number().int().min(0).max(10),
    }),
    write: true,
  },
  get_checkout: {
    description:
      "Review cart total and current revision before placing an explicitly synthetic no-charge order.",
    schema: z.object(scope),
    write: false,
  },
  place_demo_order: {
    description:
      "Place a SYNTHETIC DEMO order with NO CHARGE, no card or Galaxus order. Only after explicit user confirmation and reviewed checkout. Reuse the same operationId on retry for idempotency; preserve reviewed total/revision. Conflicts require another review.",
    schema: z.object({
      ...write,
      operationId: z.string().min(8).max(100),
      reviewedTotalMinor: z.number().int().nonnegative(),
    }),
    write: true,
  },
  get_order: {
    description: "Read a synthetic receipt belonging to this session. Omit orderId to retrieve the latest completed order; supply an ID for an earlier receipt. No charge or shipment.",
    schema: z.object({ ...scope, orderId: z.string().optional() }),
    write: false,
  },
  get_updates: {
    description:
      "Read original demo audio guides and saved interests. Pull feed only: autonomous MCP Events push is unverified.",
    schema: z.object(scope),
    write: false,
  },
  get_update_preferences: {
    description: "Read persisted audio follows and watched product IDs.",
    schema: z.object(scope),
    write: false,
  },
  set_update_preferences: {
    description:
      "Persist audio follows and watched product IDs. Follow does not subscribe ChatGPT to background events.",
    schema: z.object({
      ...write,
      audio: z.boolean().optional(),
      watchedProductIds: ids.optional(),
    }),
    write: true,
  },
} as const;
export type ToolName = keyof typeof definitions;
export const resultSchema = z.object({
  ok: z.boolean(),
  state: z
    .object({
      view: z.enum([
        "catalog",
        "compare",
        "cart",
        "checkout",
        "receipt",
        "updates",
        "preferences",
      ]),
      sessionId,
      revision,
      filters: filterPatch.required(),
      products: z.array(
        z
          .object({
            id: z.string(),
            brand: z.string(),
            name: z.string(),
            sourcePriceMinor: z.number().int(),
            currentDemoPriceMinor: z.number().int(),
            listedBatteryHours: z.number(),
            batteryTestMode: z.string(),
            noiseCancellation: z.string(),
            image: z.string(),
            sourceUrl: z.string(),
          })
          .passthrough(),
      ),
      cart: z
        .object({
          totalMinor: z.number().int(),
          revision,
          items: z.array(
            z
              .object({
                productId: z.string(),
                quantity: z.number().int(),
                unitPriceMinor: z.number().int(),
              })
              .passthrough(),
          ),
        })
        .passthrough(),
    })
    .passthrough()
    .optional(),
  error: z.object({ code: z.string(), message: z.string() }).optional(),
});
