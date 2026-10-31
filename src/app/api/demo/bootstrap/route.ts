import { DEMO_EMAIL } from "@/lib/contracts";
import {
  AppError,
  auth,
  errorResponse,
  requireSameOrigin,
} from "@/server/auth";
import { config } from "@/server/config";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const url = new URL(request.url);
    if (
      config().DEMO_MODE !== "true" ||
      !["127.0.0.1", "localhost"].includes(url.hostname)
    )
      throw new AppError(
        "LOCAL_ONLY",
        "Demo auto-login is available only on localhost.",
        403,
      );
    return await auth.api.signInEmail({
      body: { email: DEMO_EMAIL, password: config().DEMO_PASSWORD },
      headers: request.headers,
      asResponse: true,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
