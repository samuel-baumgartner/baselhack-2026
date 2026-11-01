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
  if (!isSameOrigin(req)) throw Error("Request origin is not allowed");
}

export function isSameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    const actual = new URL(req.url);
    const supplied = new URL(origin);
    return (
      supplied.host === (req.headers.get("host") ?? actual.host) &&
      supplied.protocol === actual.protocol
    );
  } catch {
    return false;
  }
}

export function requestOrigin(req: Request) {
  const url = new URL(req.url);
  if (req.headers.get("host")) url.host = req.headers.get("host")!;
  return url.origin;
}
