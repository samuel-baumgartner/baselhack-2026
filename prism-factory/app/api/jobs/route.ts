import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { createJob } from "@/lib/db";
import { normalizeUrl } from "@/lib/url";
import { failure, isSameOrigin } from "@/lib/http";
export async function POST(req: NextRequest) {
  try {
    if (!isSameOrigin(req))
      return failure(Error("Request origin is not allowed"), 403);
    const body = await req.json();
    if (typeof body.url !== "string" || body.url.length > 2000)
      throw Error("Enter a company website");
    const owner =
      req.cookies.get("prism-owner")?.value ?? randomBytes(20).toString("hex");
    const job = await createJob(normalizeUrl(body.url), owner);
    const res = NextResponse.json(job);
    res.cookies.set("prism-owner", owner, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 86400,
    });
    return res;
  } catch (e) {
    return failure(e);
  }
}
