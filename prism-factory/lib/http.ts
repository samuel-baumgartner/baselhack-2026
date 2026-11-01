import { NextResponse } from "next/server";
export function failure(error: unknown, status = 400) {
  return NextResponse.json(
    {
      error:
        error instanceof Error
          ? error.message
          : "Request could not be completed",
    },
    { status },
  );
}
export function safeId(id: string) {
  if (!/^[a-f0-9]{40}$/.test(id)) throw Error("Build not found");
  return id;
}
export async function requireOwner(req: Request, id: string) {
  const { cookies } = await import("next/headers");
  const { db, jobs } = await import("./db");
  const { and, eq } = await import("drizzle-orm");
  const owner = (await cookies()).get("prism-owner")?.value;
  if (!owner)
    throw Error("Only the browser that started this build can change it.");
  const [row] = await db()
    .select({ id: jobs.id })
    .from(jobs)
    .where(and(eq(jobs.id, id), eq(jobs.owner, owner)));
  if (!row)
    throw Error("Only the browser that started this build can change it.");
  if (
    req.headers.get("origin") &&
    req.headers.get("origin") !== new URL(req.url).origin
  )
    throw Error("Request origin is not allowed");
}
