import { DEMO_TENANT } from "@/lib/contracts";
import { betterAuth } from "better-auth";
import { and, eq } from "drizzle-orm";
import { timingSafeEqual } from "node:crypto";
import { config } from "./config";
import { db, pool } from "./db";
import { memberships, tenants } from "./db/schema";

export const auth = betterAuth({
  database: pool,
  secret: config().BETTER_AUTH_SECRET,
  baseURL: config().APP_URL,
  trustedOrigins: [config().APP_URL],
  emailAndPassword: { enabled: true, disableSignUp: true },
  advanced: { cookiePrefix: "presence" },
});

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

export function secretMatches(actual: string, expected: string) {
  const a = Buffer.from(actual),
    b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function requireSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin !== config().APP_URL)
    throw new AppError(
      "ORIGIN_DENIED",
      "This action requires the local app origin.",
      403,
    );
}

export async function requireOperator(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session)
    throw new AppError(
      "UNAUTHENTICATED",
      "Open the local demo to start a session.",
      401,
    );
  const [membership] = await db
    .select()
    .from(memberships)
    .where(
      and(
        eq(memberships.userId, session.user.id),
        eq(memberships.tenantId, DEMO_TENANT),
      ),
    );
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, DEMO_TENANT));
  if (!membership || !tenant?.seeded || config().DEMO_MODE !== "true")
    throw new AppError(
      "FORBIDDEN",
      "This session cannot control the demo hotel.",
      403,
    );
  return session.user.id;
}

export function requireBuyer(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  if (!secretMatches(authorization, `Bearer ${config().BUYER_API_KEY}`))
    throw new AppError(
      "UNAUTHORIZED_BUYER",
      "A valid buyer credential is required.",
      401,
    );
}

export function errorResponse(error: unknown) {
  if (error instanceof AppError)
    return Response.json(
      { error: { code: error.code, message: error.message } },
      { status: error.status },
    );
  if (error instanceof Error && error.name === "ZodError")
    return Response.json(
      {
        error: {
          code: "INVALID_INPUT",
          message: "Please check the supplied fields.",
        },
      },
      { status: 422 },
    );
  console.error(
    "Request failed",
    error instanceof Error ? error.message : "Unknown error",
  );
  return Response.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message:
          "The request could not be completed. Your saved progress is preserved.",
      },
    },
    { status: 500 },
  );
}
