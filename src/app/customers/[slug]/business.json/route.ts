import { errorResponse } from "@/server/auth";
import { getPublishedBusiness } from "@/server/services/commerce";
export const dynamic = "force-dynamic";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const { version } = await getPublishedBusiness(slug);
    return Response.json({
      version: version.id,
      approvedAt: version.createdAt,
      sourceUrl: version.sourceUrl,
      ...version.profile,
      capabilities: `/customers/${slug}/api/v1/capabilities`,
      openapi: `/customers/${slug}/openapi.json`,
      mcp: `/customers/${slug}/mcp`,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
