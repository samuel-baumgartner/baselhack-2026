import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  APP_URL: z.url().default("http://127.0.0.1:3000"),
  DEMO_MODE: z.enum(["true", "false"]).default("true"),
  BETTER_AUTH_SECRET: z.string().min(32),
  DEMO_PASSWORD: z.string().min(16),
  BUYER_API_KEY: z.string().min(32),
  CALLBACK_SECRET: z.string().min(32),
  AI_GATEWAY_API_KEY: z.string().optional(),
  AI_MODEL: z.string().default("anthropic/claude-sonnet-4.6"),
  AGENT_RUNTIME: z.enum(["codex", "gateway"]).default("codex"),
  ONBOARDING_PROVIDER: z.enum(["codex", "gateway", "fixture"]).default("codex"),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM: z.string().optional(),
  RESEND_RECEIVING_DOMAIN: z.string().optional(),
  OWNER_EMAIL: z.string().optional(),
  RESEND_WEBHOOK_SECRET: z.string().optional(),
  MAIL_TRANSPORT: z.enum(["local", "resend"]).default("local"),
});

let cached: z.infer<typeof schema> | undefined;
export function config() {
  cached ??= schema.parse(process.env);
  return cached;
}
