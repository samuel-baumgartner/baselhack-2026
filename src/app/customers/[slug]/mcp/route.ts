import { DEMO_BUYER, requirementsSchema } from "@/lib/contracts";
import { errorResponse, requireBuyer } from "@/server/auth";
import {
  createInquiry,
  getPublishedBusiness,
} from "@/server/services/commerce";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";

export const runtime = "nodejs";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const { tenant, version } = await getPublishedBusiness(slug);
    const server = new McpServer({
      name: "presence-commerce",
      version: "1.0.0",
    });
    server.registerTool(
      "business_capabilities",
      {
        description:
          "Read approved business facts and supported commerce actions.",
        inputSchema: {},
      },
      async () => ({
        content: [
          {
            type: "text",
            text: JSON.stringify({
              business: version.profile,
              businessVersion: version.id,
              bookingAuthority: "fictional_inventory",
            }),
          },
        ],
      }),
    );
    server.registerTool(
      "request_stay_offer",
      {
        description:
          "Send a scoped inquiry to the owner by email. This is not a booking.",
        inputSchema: {
          requirements: requirementsSchema,
          prompt: z.string().min(5),
          idempotencyKey: z.string().min(8),
        },
      },
      async (input) => {
        requireBuyer(request);
        const row = await createInquiry(
          tenant.id,
          DEMO_BUYER,
          input.idempotencyKey,
          input.prompt,
          input.requirements,
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ id: row.id, status: row.status }),
            },
          ],
        };
      },
    );
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    await server.connect(transport);
    return await transport.handleRequest(request);
  } catch (error) {
    return errorResponse(error);
  }
}
