import { z } from "zod";
export const flowIds = ["discover", "purchase", "updates"] as const;
export const selectionSchema = z
  .array(z.enum(flowIds))
  .min(1)
  .max(3)
  .transform((v) => [
    ...new Set(v.includes("purchase") ? ["discover" as const, ...v] : v),
  ]);
export type FlowId = (typeof flowIds)[number];
export type Stage =
  | "analyzing"
  | "selection"
  | "queued"
  | "planning"
  | "reviewing"
  | "revising"
  | "building"
  | "checking"
  | "publishing"
  | "ready"
  | "failed"
  | "cancelled";
export const profileSchema = z.object({
  name: z.string().min(1).max(80),
  slug: z.string().regex(/^[a-z0-9-]{1,60}$/),
  url: z.string().url(),
  description: z.string().max(350),
  industry: z.enum(["retail", "restaurant", "hotel", "services"]),
  accent: z.string().regex(/^#[a-fA-F0-9]{6}$/),
  source: z.enum(["website", "curated-demo"]),
  evidence: z.array(z.string().max(250)).max(5),
  recommendedFlows: z.array(z.enum(flowIds)).optional(),
});
export type Profile = z.infer<typeof profileSchema>;
export const configSchema = z.object({
  company: profileSchema,
  flows: z.array(z.enum(flowIds)).min(1).max(3),
  headline: z.string().max(100),
  welcome: z.string().max(220),
  suggestedPrompts: z.array(z.string().max(160)).min(1).max(4),
});
export type OutputConfig = z.infer<typeof configSchema>;
export type BuildEvent = {
  sequence: number;
  stage: Stage;
  title: string;
  detail: string;
  at: string;
};
export type Job = {
  id: string;
  url: string;
  stage: Stage;
  createdAt: string;
  updatedAt: string;
  profile?: Profile;
  selected: FlowId[];
  events: BuildEvent[];
  plan?: { summary: string; steps: string[] };
  review?: { summary: string; issues: string[] };
  config?: OutputConfig;
  threadId?: string;
  reviewThreadId?: string;
  error?: string;
  artifactHash?: string;
  publishedAt?: string;
  checks?: { name: string; passed: boolean }[];
  generatedApp?: {
    directory: string;
    templateHash: string;
    sourceHash: string;
    port: number;
    previewUrl: string;
    mcpUrl: string;
    container: string;
    builtAt: string;
  };
};
export const flows = [
  {
    id: "discover" as const,
    title: "Find the right product",
    label: "Discovery & comparison",
    description:
      "Turn a conversation into a considered choice. Search, refine and compare in one place.",
    prompt: "Find noise-cancelling earbuds for studying.",
    icon: "search",
  },
  {
    id: "purchase" as const,
    title: "From “that one” to done",
    label: "Cart & demo checkout",
    description:
      "Keep the decision and the purchase together. A shared cart and a seamless demo order.",
    prompt: "Add the cheapest pair to my cart.",
    icon: "bag",
  },
  {
    id: "updates" as const,
    title: "Make it a relationship",
    label: "Customer updates",
    description:
      "Give customers a reason to come back. Useful stories, saved interests and order updates.",
    prompt: "Show me the latest audio updates.",
    icon: "bell",
  },
];
export function toolsFor(flows: readonly FlowId[]) {
  return [
    "search_products",
    "get_shopping_session",
    "update_filters",
    "get_products",
    ...(flows.includes("purchase")
      ? [
          "get_cart",
          "update_cart",
          "get_checkout",
          "place_demo_order",
          "get_order",
        ]
      : []),
    ...(flows.includes("updates")
      ? ["get_updates", "get_update_preferences", "set_update_preferences"]
      : []),
  ];
}
