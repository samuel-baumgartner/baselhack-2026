"use client";

import { useSyncExternalStore, useEffect } from "react";
import type { App } from "@modelcontextprotocol/ext-apps";

// One bridge per iframe; tool data belongs only to this iframe's lifetime.
let memConnected = false;
let memToolInput: Record<string, unknown> | null = null;
let memToolResult: Record<string, unknown> | null = null;

const listeners = new Set<() => void>();
function notify() {
  for (const l of listeners) l();
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

let singletonApp: App | null = null;
let connecting = false;

async function ensureConnected() {
  if (singletonApp || connecting) return;
  connecting = true;

  const { App } = await import("@modelcontextprotocol/ext-apps");

  const app = new App(
    { name: "mcp-nextjs-widget", version: "0.1.0" },
    {},
    { autoResize: true },
  );

  app.ontoolinput = (params) => {
    memToolInput = params.arguments ?? null;
    memToolResult = null;
    notify();
  };

  app.ontoolcancelled = () => {
    memToolInput = null;
    notify();
  };

  app.ontoolresult = (result) => {
    memToolInput = null;
    memToolResult =
      (result.structuredContent as Record<string, unknown>) ?? null;
    notify();
  };

  app.onerror = (error) => {
    console.error("[mcp-app] error:", error);
  };

  try {
    await app.connect();
    singletonApp = app;
    memConnected = true;
    notify();
  } catch (err) {
    memConnected = false;
    connecting = false;
    notify();
    console.warn("[mcp-app] connect failed:", err);
  }
}



export function useMcpApp(enabled = true) {
  useEffect(() => { if (enabled && window.self !== window.top) void ensureConnected(); }, [enabled]);
  const connected = useSyncExternalStore(
    subscribe,
    () => memConnected,
    () => false,
  );
  const toolInput = useSyncExternalStore(
    subscribe,
    () => memToolInput,
    () => null,
  );
  const toolResult = useSyncExternalStore(
    subscribe,
    () => memToolResult,
    () => null,
  );

  return { app: singletonApp, connected, toolInput, toolResult };
}
