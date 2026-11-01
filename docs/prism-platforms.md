# PRISM platform expansion

Research date: 1 November 2026. These are documented capabilities, not successful account connections. A downloadable configuration proves configuration generation; it does not prove a host has connected or rendered the merchant app.

## Decision

Add Perplexity, Mistral Work, Cursor, VS Code / GitHub Copilot, and Goose Desktop. The first two broaden customer-facing assistant reach. The last three are developer/local-assistant distribution channels and must be labelled accordingly. They are useful for local testing and demos, but must not be presented as five additional consumer AI providers.

Keep Galaxus and hotel integrations on the same MCP endpoint implementation. Generate client-specific connection artifacts rather than separate merchant codebases. Keep the merchant website preview visibly distinct from a host-verified native integration.

## Five additions

| Target / ID | Genuine supported surface | Connection, auth and access | Artifact and local network |
|---|---|---|---|
| Perplexity / `perplexity` | Consumer/work assistant; custom MCP tools. Embedded MCP Apps UI was not established in the official material inspected. | Pro, Max and Enterprise. Remote Streamable HTTP or SSE. OAuth, API key or None. Organization policies can restrict additions. | Markdown setup instructions, endpoint and authentication selection. Public HTTPS; Cloudflare Access has an explicit integration. Do not assume a private Tailscale URL works through the cloud remote connector. |
| Mistral Work / `mistral` | Customer/work assistant tools. Current docs place Chat under legacy navigation. Resources are explicitly unsupported, so no claim of custom embedded merchant UI. | Admin adds a connector; Free/Pro/Student account owner is admin. HTTPS with valid TLS. No auth, Basic/Bearer, OAuth 2.1 with dynamic registration. | Markdown setup instructions. Use a public HTTPS endpoint for this implementation; the docs' mention of internal services does not establish private Tailscale connectivity. |
| Cursor / `cursor` | Developer channel; tools, resources and native MCP Apps. | Streamable HTTP, SSE or stdio. OAuth and configured request headers. Enterprise policy may restrict endpoints. | `.cursor/mcp.json` or `~/.cursor/mcp.json`. Desktop HTTP connections support local/remote URLs; localhost/private URLs must be reachable by the client. Cloud-agent network behavior is different. |
| VS Code / GitHub Copilot / `vscode` | Developer channel; native MCP Apps. `chat.mcp.apps.enabled` remains experimental. | HTTP stream transport, SSE fallback; optional headers/OAuth. Server trust and organization policies apply. | `.vscode/mcp.json` with `servers`, not Cursor's `mcpServers`. Local/private HTTP endpoints work from the runtime's network; remote windows resolve configuration in the remote environment. |
| Goose Desktop / `goose` | Local assistant/developer channel. Native inline MCP Apps, currently experimental. | Streamable HTTP; configured headers are supported. No-auth demo needs none. Do not promise every OAuth server works without testing its flow. | Merge an extension into `~/.config/goose/config.yaml`, or use the documented deep link. Local/private URLs are reachable from the desktop runtime if its network permits. |

Sources: [Perplexity connector setup](https://www.perplexity.ai/help-center/en/articles/13915507-adding-custom-remote-connectors), [Perplexity March 13 release](https://www.perplexity.ai/en-GB/changelog/what-we-shipped---march-13-2026), [Mistral connectors](https://docs.mistral.ai/vibe/work/connectors/mcp-connectors), [Cursor MCP](https://prod.cursor.com/docs/mcp), [VS Code configuration](https://code.visualstudio.com/docs/agents/reference/mcp-configuration), [Goose configuration](https://goose.vcorp.ai/docs/guides/config-files/), [Goose MCP Apps](https://goose.vcorp.ai/docs/guides/interactive-chat/mcp-ui/).

## Generated artifacts

Use the actual per-company endpoint in place of `ENDPOINT`. Demo servers use no authentication. Never generate or embed a credential in a shareable download.

Cursor JSON, to merge into `.cursor/mcp.json`:

```json
{"mcpServers":{"prism":{"url":"ENDPOINT"}}}
```

VS Code JSON, to merge into `.vscode/mcp.json`:

```json
{"servers":{"prism":{"type":"http","url":"ENDPOINT"}}}
```

The CLI alternative is `code --add-mcp` with a JSON object containing `name`, `type: "http"`, and `url`. Instructions should say to inspect and merge files; replacing an existing configuration can remove unrelated servers. [VS Code reference](https://code.visualstudio.com/docs/agents/reference/mcp-configuration)

Goose YAML, to merge under `extensions`:

```yaml
extensions:
  prism:
    type: streamable_http
    name: prism
    display_name: PRISM merchant
    enabled: true
    uri: ENDPOINT
    headers: {}
    timeout: 300
```

Goose also documents `goose://extension?url=ENCODED_ENDPOINT&type=streamable_http&id=prism&name=ENCODED_NAME&description=ENCODED_DESCRIPTION`. Encode each parameter value. Prefer the manual extension path as a fallback when a browser does not open the protocol handler. [Extension setup and deep links](https://goose.vcorp.ai/docs/getting-started/using-extensions/)

Perplexity setup: Plugins (or Customize → Connectors) → Add custom → Add MCP connector → Remote. Enter name (maximum 64 characters), endpoint, then Advanced: Authentication None, Transport Streamable HTTP, Network Public. Generate a `.md` guide, not an invented import manifest. [Official setup](https://www.perplexity.ai/help-center/en/articles/13915507-adding-custom-remote-connectors)

Mistral setup: Connectors → + Add Connector → Custom MCP Connector. Enter a unique identifier without spaces/special characters, full endpoint and optional description; Connect. Authentication is detected. Generate a `.md` guide. [Official setup](https://docs.mistral.ai/vibe/work/connectors/mcp-connectors)

## Correct the existing platform claims

**Claude:** native MCP Apps is real. Remote connectors originate from Anthropic's cloud even in Claude Desktop and Cowork: a localhost or Tailscale-only URL will fail. Desktop's local-server mechanism is separate. Free users have one custom connector; paid/team access and admin controls vary. Individual setup is Customize → Connectors → Add → Add custom connector, name and public endpoint. No-sign-in and fixed headers are available alongside OAuth. [Claude remote connector requirements](https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp), [official MCP Apps announcement](https://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/)

**Gemini:** current October 27–28 documentation now confirms native custom MCP tools **and MCP Apps iframe UI**. The Connected Apps Platform remains a preview. Consumer custom apps require a personal account, age 18+, US location, English and Keep Activity enabled; work/school accounts are excluded. This is a material limit for the Swiss demo. Add via Settings → Connected Apps → Custom apps → server URL; non-DCR OAuth servers need advanced client credentials. Developer Mode uses a deployed public HTTPS endpoint and exposes request/result telemetry. Publishing through Connected Console requires preview access/review. Do not label it impossible, and do not label a Swiss-account preview as a verified native connection. [Consumer eligibility/setup](https://support.google.com/gemini/answer/17209137?co=GENIE.Platform%3DDesktop&hl=en-PR), [MCP integration and UI bindings](https://developers.google.com/connected-apps/mcp), [Developer Mode](https://developers.google.com/connected-apps/mcp/dev-mode)

**Grok:** official remote MCP support is established in the API, not a general custom-app installation workflow on grok.com. The API accepts `server_url`, `server_label`, optional `authorization`, headers and allowed tools; Streaming HTTP and SSE are supported. This requires an API-backed client. Label the existing Grok screen a PRISM simulation/API integration preview, not a published consumer connector. No official native MCP Apps UI support was established. [Remote MCP API](https://docs.x.ai/developers/tools/remote-mcp)

**Gemini CLI** is a separate developer client with `mcpServers.prism.httpUrl` in `settings.json`. It supports local HTTP, headers and OAuth, but terminal tools/resources do not establish graphical MCP Apps rendering. Avoid conflating this with Gemini Apps. [Gemini CLI MCP](https://geminicli.com/docs/tools/mcp-server/)

## Implementation boundary and verification

Native UI support requires standard MCP Apps resources and the standard app bridge. Advertising `_meta.ui.resourceUri` alone does not make a widget that depends only on `window.openai` portable. Keep the OpenAI bridge where needed and implement/test a standard bridge for other visual hosts.

Use separate status labels: configuration ready, endpoint verified, host tools verified, host UI verified. A public-HTTPS requirement should disable claims that a private local endpoint is ready for that target. Browser screenshots of a PRISM simulation are not host evidence.

For each target, test initialize, tools/list and a real merchant read tool; then mutate a synthetic cart or hotel enquiry and retrieve the same session. Visual hosts additionally require resource read, real iframe rendering, images, button-to-tool callbacks and subsequent chat-state retrieval. Account-dependent connections remain unverified until exercised in that provider.

Microsoft Copilot Studio is a meaningful future enterprise channel, but it requires tenant/agent setup and is distinct from generic consumer Copilot. It supports Streamable MCP and manual server configuration; it is not a substitute for a native consumer app installation. Defer it rather than inflate the five-target count. [Copilot Studio MCP setup](https://learn.microsoft.com/en-us/microsoft-copilot-studio/mcp-add-existing-server-to-agent)
