/* eslint-disable @next/next/no-img-element */
import { baseURL } from "@/baseUrl";
export default function Setup() {
  return (
    <main className="setup">
      <img src="/merchants/galaxus/logo.svg" alt="Galaxus" width="190" />
      <p className="eyebrow">PRISM · MCP APPS DEMO</p>
      <h1>A shop you can talk to.</h1>
      <p>
        Discover real product snapshots. Adjust the filters through
        conversation. Compare, then place a synthetic order — no charge.
      </p>
      <a className="button" href="/widget">
        Open browser preview →
      </a>
      <section>
        <h2>Connect in ChatGPT</h2>
        <ol>
          <li>
            Open chatgpt.com/plugins. Select the plus button, then Add custom
            MCP server. Account and workspace policies apply.
          </li>
          <li>
            Name it “Galaxus demo”. Enter the HTTPS MCP server URL below, select
            No authentication, review the warning and select Create as a plugin.
          </li>
          <li>
            Review the 12 discovered tools. In a new chat, type @ and select the
            plugin. Ask: “Find wireless noise-cancelling in-ear headphones for
            studying and the train.”
          </li>
          <li>Then say: “Adjust the filters, I’m a student.”</li>
        </ol>
        <code>{baseURL}/mcp</code>
        <p>
          Keep the returned session ID across turns. It is a private capability
          for this synthetic session. Cart, orders and follows persist in
          Postgres.
        </p>
      </section>
      <section>
        <h2>What this demonstrates</h2>
        <p>
          Six observed products and source photos. A shared revisioned session,
          deterministic filters, stored cart, idempotent receipts and original
          audio guides.
        </p>
        <p>
          Prices are frozen observations from 31 October 2026. Inventory,
          shipping and purchases are simulated. No Galaxus account or card is
          needed. This is an unofficial demonstration, with Arial as a disclosed
          font fallback.
        </p>
        <p>
          Actual ChatGPT rendering and MCP Events push require host account
          access. A browser preview verifies presentation only. Following audio
          saves a preference; it does not wake an agent.
        </p>
      </section>
    </main>
  );
}
