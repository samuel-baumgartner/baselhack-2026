import { createHmac } from "node:crypto";
import { AppError, secretMatches } from "../auth";
import { config } from "../config";

export function signedHeaders(body: string, timestamp = Date.now().toString()) {
  return {
    "content-type": "application/json",
    "x-presence-timestamp": timestamp,
    "x-presence-signature": createHmac("sha256", config().CALLBACK_SECRET)
      .update(`${timestamp}.${body}`)
      .digest("hex"),
  };
}
export function verifyCallback(request: Request, body: string) {
  const timestamp = request.headers.get("x-presence-timestamp") ?? "";
  if (
    !/^\d+$/.test(timestamp) ||
    Math.abs(Date.now() - Number(timestamp)) > 300000
  )
    throw new AppError(
      "CALLBACK_EXPIRED",
      "Callback timestamp is not current.",
      401,
    );
  const expected = signedHeaders(body, timestamp)["x-presence-signature"];
  if (
    !secretMatches(request.headers.get("x-presence-signature") ?? "", expected)
  )
    throw new AppError("BAD_SIGNATURE", "Callback signature is invalid.", 401);
}
export async function sendCallback(payload: {
  id: string;
  type: "offer" | "event";
  tenantId: string;
  recordId: string;
}) {
  const body = JSON.stringify(payload);
  const response = await fetch(
    new URL("/api/demo/agent-events", config().APP_URL),
    {
      method: "POST",
      headers: signedHeaders(body),
      body,
      signal: AbortSignal.timeout(10000),
    },
  );
  if (!response.ok)
    throw new Error(`Buyer callback returned HTTP ${response.status}`);
}
