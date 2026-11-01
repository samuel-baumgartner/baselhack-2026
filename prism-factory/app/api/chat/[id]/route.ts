import { NextResponse } from "next/server";
import { generateText, tool, stepCountIs, gateway } from "ai";
import { z } from "zod";
import { retail } from "@/lib/retail/store";
import { getJob } from "@/lib/db";
import { toolsFor } from "@/lib/contracts";
import { failure, safeId } from "@/lib/http";
import type { Command, Snapshot } from "@/lib/retail/shopping";
export const maxDuration = 60;
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const id = safeId((await params).id),
      job = await getJob(id);
    if (!job?.config || job.stage !== "ready")
      throw Error("This app is still being built");
    const input = z
      .object({
        message: z.string().min(1).max(1600),
        sessionId: z.string().regex(/^[a-f0-9]{64}$/),
        history: z
          .array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string().max(2000),
            }),
          )
          .max(14)
          .default([]),
      })
      .parse(await req.json());
    let state = await retail(id, {
      name: "get_shopping_session",
      sessionId: input.sessionId,
    });
    const calls: string[] = [];
    const commerceEnabled = job.selected.includes("purchase");
    const updatesEnabled = job.selected.includes("updates");
    const availableViews: ("catalog" | "cart" | "checkout" | "updates")[] = [
      "catalog",
    ];
    if (commerceEnabled) availableViews.push("cart", "checkout");
    if (updatesEnabled) availableViews.push("updates");
    const act = async (name: string, args: Partial<Command> = {}) => {
      if (!toolsFor(job.selected).includes(name))
        throw Error("Flow not enabled");
      state = await retail(id, {
        ...args,
        name,
        sessionId: input.sessionId,
        expectedRevision: state.revision,
      });
      calls.push(name);
      return {
        view: state.view,
        filters: state.filters,
        products: state.products.map((p) => ({
          id: p.id,
          name: p.name,
          priceCHF: p.currentDemoPriceMinor / 100,
        })),
        cart: state.cart,
        order: state.order,
        updates: state.editions,
      };
    };
    const result = await generateText({
      model: gateway(process.env.PRISM_CHAT_MODEL ?? "openai/gpt-4.1-mini"),
      system: `You are a concise shopping assistant inside a PRISM preview for ${job.profile?.name}. Always use tools to show/change views. Use existing shopping session. 'student' implies an adjustable CHF100 budget (maxPriceMinor 10000), preserve noise-cancelling/in-ear/wireless. Explain budget is an assumption, never a discount. All catalog prices are frozen Oct31 2026 snapshots. Orders are synthetic, no charge. To purchase first show checkout, then require explicit confirmation in a later turn. Never place an order from vague 'buy' alone. No claims of live stock or proactive push. Never invent specifications. Listed battery hours have unknown test conditions; do not declare a tested battery winner. Reply in 1-3 sentences. Current filters:${JSON.stringify(state.filters)}. Available products:${JSON.stringify(state.allProducts.map((p) => ({ id: p.id, name: p.name, price: p.currentDemoPriceMinor / 100 })))}. Selected experiences:${job.selected}.`,
      messages: [...input.history, { role: "user", content: input.message }],
      stopWhen: stepCountIs(4),
      activeTools: [
        "update_filters",
        "compare_products",
        "show_view",
        ...(commerceEnabled ? ["update_cart" as const] : []),
        ...(updatesEnabled ? ["set_update_preferences" as const] : []),
      ],
      tools: {
        update_filters: tool({
          description:
            "Change product filters and show the catalog. Student demo = CHF100 adjustable cap.",
          inputSchema: z.object({
            maxPriceMinor: z.number().int().min(0).max(1000000).optional(),
            noiseCancelling: z.boolean().optional(),
            formFactor: z.enum(["any", "in-ear", "open-ear"]).optional(),
            sort: z.enum(["price_asc", "price_desc"]).optional(),
          }),
          execute: async (patch) => act("update_filters", { patch }),
        }),
        compare_products: tool({
          description: "Display side-by-side product comparison",
          inputSchema: z.object({
            productIds: z.array(z.string()).min(1).max(3),
          }),
          execute: async ({ productIds }) =>
            act("get_products", { productIds }),
        }),
        update_cart: tool({
          description:
            "Set absolute cart quantity. Zero removes. Only if purchase selected.",
          inputSchema: z.object({
            productId: z.string(),
            quantity: z.number().int().min(0).max(5),
          }),
          execute: async (args) => act("update_cart", args),
        }),
        set_update_preferences: tool({
          description:
            "Follow or unfollow audio and save product interests. This changes the pull feed preferences; it does not enable background push.",
          inputSchema: z.object({
            audio: z.boolean().optional(),
            watchedProductIds: z.array(z.string()).max(6).optional(),
          }),
          execute: async (preferences) =>
            act("set_update_preferences", preferences),
        }),
        show_view: tool({
          description: "Show products, cart, checkout or updates",
          inputSchema: z.object({
            view: z.enum(availableViews),
          }),
          execute: async ({ view }) =>
            act(
              {
                catalog: "get_shopping_session",
                cart: "get_cart",
                checkout: "get_checkout",
                updates: "get_updates",
              }[view],
            ),
        }),
      },
    });
    return NextResponse.json({
      text: result.text || "Your experience is updated below.",
      state: state as Snapshot,
      calls,
      model: "AI Gateway · OpenAI",
    });
  } catch (e) {
    console.error(
      "Preview chat failed",
      e instanceof Error ? e.name : "unknown",
    );
    return failure(
      Error(
        "The assistant could not respond. Your cart is saved. Try again, or use the controls below.",
      ),
      503,
    );
  }
}
