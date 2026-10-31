import { errorResponse, requireOperator } from "@/server/auth";
import { getSnapshot } from "@/server/services/snapshot";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    await requireOperator(request);
    return Response.json(await getSnapshot(), {
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
