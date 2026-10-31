import { z } from "zod";
import { inquiryInputSchema, acceptanceInputSchema } from "@/lib/contracts";
import { errorResponse } from "@/server/auth";
import { config } from "@/server/config";
import { getPublishedBusiness } from "@/server/services/commerce";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const { tenant } = await getPublishedBusiness(slug);
    return Response.json({
      openapi: "3.1.0",
      info: { title: `${tenant.name} commerce`, version: "1.0.0" },
      servers: [{ url: `${config().APP_URL}/customers/${slug}/api/v1` }],
      components: {
        securitySchemes: { buyer: { type: "http", scheme: "bearer" } },
      },
      paths: {
        "/capabilities": {
          get: {
            operationId: "readCapabilities",
            summary: "Read owner-approved facts and capabilities",
            responses: { "200": { description: "Published business facts" } },
          },
        },
        "/inquiries": {
          post: {
            operationId: "requestOffer",
            security: [{ buyer: [] }],
            summary: "Request an owner-approved offer; does not book",
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: z.toJSONSchema(inquiryInputSchema),
                },
              },
            },
            responses: {
              "202": { description: "Pending task with status URL" },
            },
          },
        },
        "/tasks/{taskId}": {
          get: {
            operationId: "getTask",
            security: [{ buyer: [] }],
            parameters: [
              {
                name: "taskId",
                in: "path",
                required: true,
                schema: { type: "string", format: "uuid" },
              },
            ],
            responses: { "200": { description: "Authorized current task" } },
          },
        },
        "/offers/{offerId}": {
          get: {
            operationId: "readOffer",
            security: [{ buyer: [] }],
            parameters: [
              {
                name: "offerId",
                in: "path",
                required: true,
                schema: { type: "string", format: "uuid" },
              },
            ],
            responses: { "200": { description: "Exact approved offer terms" } },
          },
        },
        "/offers/{offerId}/accept": {
          post: {
            operationId: "acceptOffer",
            description:
              "approvalId must come from an authenticated human approval of this exact offer. A buyer cannot self-issue human consent.",
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: z.toJSONSchema(acceptanceInputSchema),
                },
              },
            },
            security: [{ buyer: [] }],
            parameters: [
              {
                name: "offerId",
                in: "path",
                required: true,
                schema: { type: "string", format: "uuid" },
              },
            ],
            summary:
              "Accept the exact revision with explicit traveller approval",
            responses: {
              "200": { description: "Confirmed fictional reservation" },
              "409": {
                description: "Expired offer, changed terms or unavailable room",
              },
            },
          },
        },
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
