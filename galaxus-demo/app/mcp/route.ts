import { widgetVersion } from "@/lib/widget-version";
import { assetOrigin } from "@/lib/assets";
import { createMcpHandler } from "mcp-handler";
import {
  registerAppTool,
} from "@modelcontextprotocol/ext-apps/server";
import { definitions, resultSchema } from "@/lib/tools";
import { openSession, runCommand } from "@/lib/db";
import { DomainError, type Command } from "@/lib/shopping";
export const maxDuration = 60;
import { registerStoreResource, STORE_RESOURCE_URI as RESOURCE_URI } from "@/lib/widget-resource";
const serverInfo = {
  name: "Galaxus",
  version: "1.0.0",
  icons: [{ src: `${assetOrigin}/merchants/galaxus/icon.svg`, mimeType: "image/svg+xml", sizes: ["any"] }],
};
const handler = createMcpHandler(
  async (server) => {
    registerStoreResource(server, widgetVersion);
    for (const [name, definition] of Object.entries(definitions)) {
      registerAppTool(
        server,
        name,
        {
          title: name.replaceAll("_", " "),
          description: definition.description,
          inputSchema: definition.schema.shape,
          outputSchema: resultSchema.shape,
          annotations: {
            readOnlyHint: !definition.write,
            destructiveHint: name === "place_demo_order",
            idempotentHint: name !== "search_products",
            openWorldHint: false,
          },
          _meta: {
            ui: { resourceUri: RESOURCE_URI },
            "openai/outputTemplate": RESOURCE_URI,
            "openai/widgetAccessible": true,
          },
        },
        async (args: Record<string, unknown>) => {
          const parsed = definition.schema.safeParse(args);
          try {
            if (!parsed.success)
              throw new DomainError("INVALID_ARGUMENTS", parsed.error.message);
            const input = parsed.data as { sessionId?: string } & Omit<
              Command,
              "name"
            >;
            const state =
              name === "search_products" && !input.sessionId
                ? await openSession()
                : await runCommand(input.sessionId!, { ...input, name });
            const result = { ok: true, state };
            return {
              content: [
                { type: "text" as const, text: JSON.stringify(result) },
              ],
              structuredContent: result,
            };
          } catch (error) {
            const known = error instanceof DomainError;
            const result = {
              ok: false,
              error: {
                code: known ? error.code : "SERVICE_UNAVAILABLE",
                message: known
                  ? error.message
                  : "Durable storage unavailable. No change confirmed; retry the same operation ID.",
              },
            };
            if (!known)
              console.error(
                "Shopping storage failure",
                error instanceof Error ? error.name : "unknown",
              );
            return {
              isError: true,
              content: [
                { type: "text" as const, text: JSON.stringify(result) },
              ],
              structuredContent: result,
            };
          }
        },
      );
    }
  },
  { serverInfo },
  { basePath: "", maxDuration: 60, verboseLogs: false },
);
export const GET = handler;
export const POST = handler;
