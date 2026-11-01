"use client";
import { useEffect, useRef, useState } from "react";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { useMcpApp } from "./use-mcp-app";
import MerchantExperience from "./merchant-experience";
import { config } from "../lib/config";
import type { Snapshot, Command } from "../lib/retail/shopping";
type Result = { ok: boolean; state?: Snapshot; error?: { code: string; message: string } };
export default function Runtime() {
  const { app, connected, toolInput, toolResult } = useMcpApp();
  const [contextNotice, setContextNotice] = useState("");
  const [state, setState] = useState<Snapshot | null>(null), [error, setError] = useState(""), [pending, setPending] = useState(false);
  const stateRef = useRef<Snapshot | null>(null), client = useRef<Client | null>(null), lock = useRef(false);
  const caller = useRef<(name: string, args: Record<string, unknown>) => Promise<Result>>(null);
  const storage = `prism-output-${config.appId}`;
  function commit(next: Snapshot, keepView = false) {
    const current = stateRef.current;
    if (current?.sessionId === next.sessionId && current.revision > next.revision) return;
    const value = keepView && current?.sessionId === next.sessionId ? { ...next, view: current.view, selectedProductIds: current.selectedProductIds } : next;
    stateRef.current = value;
    setState(value);
    if (window.self === window.top) { try { localStorage.setItem(storage, next.sessionId); } catch {} }
  }
  function unpack(value: unknown): Result { return value as Result; }
  useEffect(() => {
    if (!app || !connected) return;
    caller.current = async (name, args) => unpack((await app.callServerTool({ name, arguments: args })).structuredContent);
    return () => { caller.current = null; };
  }, [app, connected]);
  useEffect(() => {
    if (!toolResult) return;
    const data = unpack(toolResult);
    if (data.ok && data.state) commit(data.state);
    else if (data.error) setError(data.error.message);
  }, [toolResult]);
  useEffect(() => {
    if (window.self !== window.top) return;
    let active = true;
    void (async () => {
      try {
        const [{ Client }, { StreamableHTTPClientTransport }] = await Promise.all([import("@modelcontextprotocol/sdk/client/index.js"), import("@modelcontextprotocol/sdk/client/streamableHttp.js")]);
        const c = new Client({ name: "prism-generated-browser", version: "1.0" }); client.current = c;
        await c.connect(new StreamableHTTPClientTransport(new URL("/mcp", location.origin)));
        if (!active) { await c.close(); return; }
        caller.current = async (name, args) => unpack((await c.callTool({ name, arguments: args })).structuredContent);
        let saved: string | null = null; try { saved = localStorage.getItem(storage); } catch {}
        let data = await caller.current(saved ? "get_shopping_session" : "search_products", saved ? { sessionId: saved } : {});
        if (!data.ok && saved) data = await caller.current("search_products", {});
        if (data.ok && data.state && active) commit(data.state); else if (!data.ok) throw Error(data.error?.message ?? "Could not open this session.");
      } catch (e) { if (active) setError(e instanceof Error ? e.message : "Could not connect."); }
    })();
    return () => { active = false; caller.current = null; void client.current?.close(); client.current = null; };
  }, []);
  useEffect(() => {
    let refreshing = false;
    async function refresh() {
      const before = stateRef.current;
      if (!before || !caller.current || lock.current || refreshing || document.hidden) return;
      refreshing = true;
      try {
        const result = await caller.current("get_shopping_session", { sessionId: before.sessionId });
        if (result.ok && result.state && stateRef.current?.sessionId === before.sessionId) commit(result.state, true);
      } catch { /* A failed passive refresh must not hide the last confirmed state. */ }
      finally { refreshing = false; }
    }
    void refresh();
    const timer = setInterval(() => void refresh(), 5000);
    const visible = () => { if (!document.hidden) void refresh(); };
    window.addEventListener("focus", visible); document.addEventListener("visibilitychange", visible);
    return () => { clearInterval(timer); window.removeEventListener("focus", visible); document.removeEventListener("visibilitychange", visible); };
  }, [connected, state?.sessionId]);
  async function action(name: string, args: Partial<Command> = {}) {
    if (lock.current || !caller.current) return;
    lock.current = true; setPending(true); setError(""); setContextNotice("");
    const before = stateRef.current;
    try {
      if (!before) throw Error("Wait for your session to load.");
      let revision = before.revision;
      if (["update_cart", "place_demo_order", "update_filters", "set_update_preferences"].includes(name)) {
        const latest = await caller.current("get_shopping_session", { sessionId: before.sessionId });
        if (!latest.ok || !latest.state) throw Error("Could not refresh the session. No change was attempted.");
        if (latest.state.revision !== before.revision) {
          commit(latest.state, true);
          if (name !== "update_filters") throw Error("Your session changed. The current state is now loaded; review it before trying again.");
        }
        revision = latest.state.revision;
      }
      const input = { ...args, sessionId: before.sessionId, expectedRevision: revision };
      const result = await caller.current(name, input);
      if (!result.ok || !result.state) {
        if (result.error?.code === "STALE_REVISION") {
          const fresh = await caller.current("get_shopping_session", { sessionId: before.sessionId });
          if (fresh.ok && fresh.state) commit(fresh.state, true);
        }
        throw Error(result.error?.message ?? "The action was not confirmed.");
      }
      if (stateRef.current?.sessionId === before.sessionId) commit(result.state);
      if (app && connected) {
        try { await app.updateModelContext({ content: [{ type: "text", text: JSON.stringify({ sessionId: result.state.sessionId, revision: result.state.revision, filters: result.state.filters, cart: result.state.cart, latestOrder: result.state.latestOrder, preferences: result.state.preferences }) }] }); }
        catch { setContextNotice("Your change was saved. The assistant could not refresh its context; ask it to retrieve your current shopping session."); }
      }
    } catch (e) { setError(e instanceof Error ? e.message : "The action was not confirmed."); }
    finally { lock.current = false; setPending(false); }
  }
  const busy = pending || (connected && toolInput !== null && toolResult === null);
  return <main className="output-shell">{contextNotice && <p role="status" className="output-disclosure">{contextNotice}</p>}{error && <div role="alert" className="output-error">{error} <button onClick={() => state ? void action("get_shopping_session") : location.reload()}>Reload</button></div>}{state ? <MerchantExperience state={state} onAction={action} busy={busy} enabled={config.flows} headline={config.headline} accent={config.company.accent} /> : <p className="output-status" role="status">Connecting to {config.company.name}…</p>}<footer className="output-disclosure">PRISM local prototype · prepared Galaxus demo catalogue · frozen prices · synthetic orders, no charge.</footer></main>;
}
