export const platforms = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    capability: "mcp-apps",
    channel: "consumer",
    requiresPublicHttps: true,
    kind: "Embedded app",
    line: "Find me something for studying.",
    docsUrl: "https://developers.openai.com/apps-sdk/deploy/connect-chatgpt",
  },
  {
    id: "claude",
    name: "Claude",
    capability: "mcp-apps",
    channel: "consumer",
    requiresPublicHttps: true,
    kind: "Embedded app",
    line: "Something quiet for the train?",
    docsUrl:
      "https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp",
  },
  {
    id: "perplexity",
    name: "Perplexity",
    capability: "tools",
    channel: "consumer",
    requiresPublicHttps: true,
    kind: "Tools only",
    line: "Help me choose with the facts.",
    docsUrl:
      "https://www.perplexity.ai/help-center/en/articles/13915507-adding-custom-remote-connectors",
  },
  {
    id: "mistral",
    name: "Mistral",
    capability: "tools",
    channel: "consumer",
    requiresPublicHttps: true,
    kind: "Tools only",
    line: "Find an option that fits my plans.",
    docsUrl: "https://docs.mistral.ai/vibe/work/connectors/mcp-connectors",
  },
  {
    id: "cursor",
    name: "Cursor",
    capability: "mcp-apps",
    channel: "developer",
    requiresPublicHttps: false,
    kind: "Developer · embedded app",
    line: "Open this merchant’s MCP app.",
    docsUrl: "https://prod.cursor.com/docs/mcp",
  },
  {
    id: "vscode",
    name: "VS Code Copilot",
    capability: "mcp-apps",
    channel: "developer",
    requiresPublicHttps: false,
    kind: "Developer · embedded app",
    line: "Explore this merchant in agent mode.",
    docsUrl:
      "https://code.visualstudio.com/docs/agents/reference/mcp-configuration",
  },
  {
    id: "goose",
    name: "Goose",
    capability: "mcp-apps",
    channel: "developer",
    requiresPublicHttps: false,
    kind: "Desktop · experimental app",
    line: "Bring this experience into my assistant.",
    docsUrl: "https://goose.vcorp.ai/docs/getting-started/using-extensions/",
  },
  {
    id: "gemini",
    name: "Gemini",
    capability: "mcp-apps",
    channel: "consumer",
    requiresPublicHttps: true,
    kind: "Embedded app · limited preview",
    line: "Compare options for my next trip.",
    docsUrl: "https://developers.google.com/connected-apps/mcp",
  },
  {
    id: "grok",
    name: "Grok",
    capability: "preview",
    channel: "consumer",
    requiresPublicHttps: false,
    kind: "Visual preview only",
    line: "Cheapest noise cancelling pair.",
    docsUrl: "https://docs.x.ai/docs/guides/tools/remote-mcp-tools",
  },
] as const;
export type PlatformId = (typeof platforms)[number]["id"];
export function hasPublicHttpsEndpoint(endpoint: string) {
  try {
    const url = new URL(endpoint);
    const host = url.hostname.toLowerCase();
    return (
      url.protocol === "https:" &&
      !/^(?:localhost|127\.|0\.|10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.|100\.(?:6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.)/.test(
        host,
      ) &&
      !host.endsWith(".local") &&
      !host.endsWith(".ts.net") &&
      !host.includes(":")
    );
  } catch {
    return false;
  }
}
export function platformConnection(
  id: string,
  endpoint: string,
  companyName: string,
) {
  const platform = platforms.find((p) => p.id === id);
  if (!platform) throw Error("Unknown platform");
  const key = `prism-${
    companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "merchant"
  }`;
  const instructions: string[] = [];
  let filename = `${key}-${id}.md`,
    mimeType = "text/markdown",
    content = "";
  if (platform.capability === "preview") {
    instructions.push(
      `${platform.name} is a visual preview in PRISM. A native consumer-app installation is not implemented.`,
      "Use a supported MCP client to connect to the real merchant tools.",
    );
  } else if (id === "cursor") {
    filename = "mcp.json";
    mimeType = "application/json";
    content = JSON.stringify(
      { mcpServers: { [key]: { url: endpoint } } },
      null,
      2,
    );
    instructions.push(
      "Merge this configuration into .cursor/mcp.json in your project, or ~/.cursor/mcp.json for your desktop user.",
      "Enable the server in Cursor’s MCP settings and approve its tools. Local/Tailscale endpoints must be reachable from the computer running Cursor.",
      "Use the merchant tools in chat. Compatible Cursor desktop versions can display the MCP app; native account behavior has not been verified by PRISM.",
    );
  } else if (id === "vscode") {
    filename = "mcp.json";
    mimeType = "application/json";
    content = JSON.stringify(
      { servers: { [key]: { type: "http", url: endpoint } } },
      null,
      2,
    );
    instructions.push(
      "Merge this configuration into .vscode/mcp.json, then start the server and review its trust prompt.",
      "Use Copilot agent mode. Local/Tailscale endpoints must be reachable from VS Code’s execution environment.",
      "Embedded MCP Apps require a compatible VS Code version; chat.mcp.apps.enabled is experimental. Tool and UI behavior still need verification in your client.",
    );
  } else if (id === "goose") {
    filename = `${key}-goose.yaml`;
    mimeType = "application/yaml";
    content = `extensions:\n  ${key}:\n    type: streamable_http\n    name: ${key}\n    display_name: ${JSON.stringify(companyName)}\n    enabled: true\n    uri: ${JSON.stringify(endpoint)}\n    headers: {}\n    timeout: 300\n`;
    instructions.push(
      "Merge the extension entry into ~/.config/goose/config.yaml. Preserve your existing extensions and settings.",
      "Enable the extension in Goose Desktop. The endpoint must be reachable from that computer; local/Tailscale HTTP is supported by this transport.",
      "MCP Apps rendering in Goose Desktop is experimental. Confirm tool access and embedded behavior in your installed version.",
    );
  } else if (id === "chatgpt") {
    instructions.push(
      "Use an account/workspace with custom MCP app access. Open ChatGPT’s app/connector settings and add a custom MCP server.",
      `Enter ${endpoint} and choose no authentication for this synthetic demo.`,
      "Start a new conversation with the app enabled. Verify the embedded view and real tool results; protocol checks alone do not prove host rendering.",
    );
  } else if (id === "claude") {
    instructions.push(
      "Open Claude Customize → Connectors → Add → Add custom connector in an eligible account/workspace.",
      `Enter the merchant name and ${endpoint}. This synthetic demo does not require authentication.`,
      "Enable the connector in a conversation. Claude supports MCP Apps in compatible clients; cloud connectors need a publicly reachable HTTPS server.",
    );
  } else if (id === "perplexity") {
    instructions.push(
      "In an eligible Pro, Max or Enterprise account, open Plugins or Customize → Connectors → Add custom → Add MCP connector → Remote.",
      `Enter a name of at most 64 characters and the server URL ${endpoint}.`,
      "Under advanced settings choose Auth: None, Transport: Streamable HTTP, Network: Public for this demo. Enable the connector for a conversation.",
      "PRISM exposes merchant tools here. A branded embedded MCP Apps interface is not claimed for Perplexity.",
    );
  } else if (id === "gemini") {
    instructions.push(
      "Custom apps are currently a limited preview: US users aged 18+, a personal Google account, English, and Keep Activity enabled. Work/school accounts and other regions may not have access.",
      "In Gemini Settings → Connected Apps (or Personal Intelligence → Connected Apps), open Custom apps and enter the publicly reachable HTTPS MCP URL.",
      `Use ${endpoint}. Review the connection and authentication prompts, then select the app with @ in a conversation.`,
      "Gemini’s connected-app platform supports UI resources, but PRISM has not verified this account-level preview. Published distribution requires the applicable console/review access.",
    );
  } else if (id === "mistral") {
    instructions.push(
      "In Mistral Work (formerly Le Chat), open Connectors → Add Connector → Custom MCP Connector.",
      `Use a unique identifier without spaces, such as ${key}, and the full endpoint ${endpoint}.`,
      "Choose the no-auth option for this synthetic demo, then connect and enable the connector.",
      "This target is tools-only: the documented connector does not support MCP resources, so PRISM does not claim an embedded merchant view.",
    );
  }
  if (platform.requiresPublicHttps && !hasPublicHttpsEndpoint(endpoint))
    instructions.unshift(
      "Publish this output on a publicly reachable HTTPS origin first. This private/local endpoint cannot be reached by the provider’s cloud connector.",
    );
  if (!content)
    content = `# ${companyName} × ${platform.name}\n\n${platform.kind}. Native host behavior remains unverified.\n\n${platform.capability !== "preview" ? `Endpoint: ${endpoint}\n\n` : ""}${instructions.map((line, index) => `${index + 1}. ${line}`).join("\n\n")}\n\nOfficial documentation: ${platform.docsUrl}\n\nDemo only: no real payments, reservations or deliveries.\n`;
  return {
    filename,
    mimeType,
    content,
    instructions,
    requiresPublicHttps: platform.requiresPublicHttps,
  };
}
