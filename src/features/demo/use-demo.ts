"use client";

import type { DemoSnapshot } from "@/server/services/snapshot";
import { useCallback, useEffect, useState } from "react";

export function useDemo() {
  const [state, setState] = useState<DemoSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  useEffect(() => {
    let source: EventSource | undefined;
    let cancelled = false;
    async function connect() {
      const bootstrap = await fetch("/api/demo/bootstrap", { method: "POST" });
      if (!bootstrap.ok) {
        const data = await bootstrap.json();
        throw new Error(
          data.error?.message ?? "The demo session could not be started.",
        );
      }
      if (cancelled) return;
      source = new EventSource("/api/demo/events");
      source.addEventListener("state", (event) => {
        setState(JSON.parse(event.data) as DemoSnapshot);
        setConnected(true);
      });
      source.onopen = () => setConnected(true);
      source.onerror = () => setConnected(false);
    }
    connect().catch((err) =>
      setError(err instanceof Error ? err.message : "Could not connect."),
    );
    return () => {
      cancelled = true;
      source?.close();
    };
  }, []);
  const act = useCallback(async (action: Record<string, unknown>) => {
    setPending(String(action.action));
    setError(null);
    try {
      const response = await fetch("/api/demo/action", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(action),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.error?.message ?? "This action could not be completed.",
        );
      const snapshot = await fetch("/api/demo/state").then((r) => r.json());
      setState(snapshot);
      return true;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "This action could not be completed.",
      );
      return false;
    } finally {
      setPending(null);
    }
  }, []);
  return {
    state,
    error,
    connected,
    pending,
    act,
    clearError: () => setError(null),
  };
}
