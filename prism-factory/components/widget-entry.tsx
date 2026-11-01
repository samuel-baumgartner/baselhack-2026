import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@modelcontextprotocol/ext-apps";
import { RetailView } from "./retail";
import type { Snapshot, Command } from "../lib/retail/shopping";
import type { FlowId } from "../lib/contracts";
declare global {
  interface Window {
    __PRISM_WIDGET__: { jobId: string; origin: string; flows: FlowId[]; headline?:string; accent?:string };
  }
}
function Widget() {
  const config = window.__PRISM_WIDGET__;
  const [state, setState] = useState<Snapshot | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const app = useRef<App | null>(null);
  const inflight = useRef(false);
  useEffect(() => {
    const a = new App(
      { name: "prism-retailer", version: "1.0.0" },
      {},
      { autoResize: true },
    );
    app.current = a;
    a.ontoolresult = (r) => {
      const d = r.structuredContent as { state?: Snapshot };
      if (d?.state) {
        setState(d.state);
        setError("");
      }
    };
    a.connect().catch(() =>
      setError("Open this app through a compatible MCP Apps host."),
    );
    return () => {
      void a.close();
    };
  }, []);
  async function action(name: string, args: Partial<Command> = {}) {
    // One tool call at a time; a double tap must not race the revision check.
    if (!state || !app.current || inflight.current) return;
    inflight.current = true;
    setBusy(true);
    setError("");
    try {
      const r = await app.current.callServerTool({
        name,
        arguments: {
          ...args,
          sessionId: state.sessionId,
          expectedRevision: state.revision,
        },
      });
      const d = r.structuredContent as {
        ok: boolean;
        state?: Snapshot;
        error?: { message: string };
      };
      if (!d?.ok) throw Error(d?.error?.message ?? "That didn’t work. Try again.");
      if (d.state) setState(d.state);
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "That didn’t work. Try again.");
    } finally {
      inflight.current = false;
      setBusy(false);
    }
  }
  return (
    <>
      {error && (
        <p role="alert" className="widget-error">
          {error}
        </p>
      )}
      {state ? (
        <RetailView
          state={state}
          enabled={config.flows} headline={config.headline} accent={config.accent}
          onAction={action}
          busy={busy}
        />
      ) : (
        !error && (
          <p className="widget-loading" role="status">
            Opening your shopping experience…
          </p>
        )
      )}
    </>
  );
}
createRoot(document.getElementById("root")!).render(<Widget />);
