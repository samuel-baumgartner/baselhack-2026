"use client";
/* eslint-disable @next/next/no-img-element */
import { acceptsSnapshot } from "@/lib/widget-state";
import { assetUrl } from "@/lib/assets";
import { useCallback, useEffect, useRef, useState } from "react";
import { useMcpApp } from "@/app/hooks/use-mcp-app";
import type { Snapshot, View } from "@/lib/shopping";
import type { Product } from "@/lib/catalog";
import type { ToolName } from "@/lib/tools";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
type Result = {
  ok: boolean;
  state?: Snapshot;
  error?: { code: string; message: string };
};
function Icon({
  name,
  size = 18,
}: {
  name:
    | "cart"
    | "arrow"
    | "back"
    | "heart"
    | "check"
    | "refresh"
    | "sliders"
    | "plus"
    | "minus"
    | "compare"
    | "bell";
  size?: number;
}) {
  const paths = {
    cart: "M3 3h2l2.4 11.4a2 2 0 0 0 2 1.6H18a2 2 0 0 0 2-1.6L21 7H6M10 21h.01M18 21h.01",
    arrow: "M5 12h14m-6-6 6 6-6 6",
    back: "M19 12H5m6-6-6 6 6 6",
    heart:
      "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z",
    check: "m5 12 4 4L19 6",
    refresh: "M20 7v5h-5M4 17v-5h5M6 6a8 8 0 0 1 13 2M5 16a8 8 0 0 0 13 2",
    sliders: "M4 7h7m4 0h5M4 17h3m4 0h9M11 4v6M7 14v6",
    plus: "M12 5v14M5 12h14",
    minus: "M5 12h14",
    compare: "M8 3v18M16 3v18M4 7h8m0 10h8",
    bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4",
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
const money = (v: number) => `CHF ${(v / 100).toFixed(2)}`;
export default function Store() {
  const { app, connected, toolInput, toolResult } = useMcpApp();
  const [state, setState] = useState<Snapshot | null>(null),
    [view, setView] = useState<View>("catalog"),
    [selected, setSelected] = useState<string[]>([]),
    [requestBusy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [budget, setBudget] = useState("250");
  const busy =
    requestBusy || (connected && toolInput !== null && toolResult === null);
  const client = useRef<Client | null>(null),
    lock = useRef(false),
    pendingOrder = useRef<{
      operationId: string;
      expectedRevision: number;
      reviewedTotalMinor: number;
    } | null>(null),
    stateRef = useRef<Snapshot | null>(null);
  const apply = useCallback((result: Result, sourceSession?: string) => {
    if (!result.ok) {
      throw new Error(`${result.error?.code}: ${result.error?.message}`);
    }
    if (result.state) {
      const previous = stateRef.current;
      if (!acceptsSnapshot(previous, result.state, sourceSession)) return false;
      if (previous?.sessionId !== result.state.sessionId) {
        pendingOrder.current = null;
        setSelected(result.state.selectedProductIds);
      }
      if (result.state.view === "receipt") pendingOrder.current = null;
      stateRef.current = result.state;
      setState(result.state);
      setView(result.state.view);
      setBudget(String(result.state.filters.maxPriceMinor / 100));
      if (result.state.selectedProductIds.length)
        setSelected(result.state.selectedProductIds);
    }
    return true;
  }, []);
  const refreshInFlight = useRef<Promise<Snapshot | undefined> | null>(null);
  const refreshSnapshot = useCallback(async () => {
    if (refreshInFlight.current) return refreshInFlight.current;
    const before = stateRef.current;
    if (!before) return;
    const refresh = async () => {
      const request = { name: "get_shopping_session", arguments: { sessionId: before.sessionId } };
      const result = app && connected
        ? await app.callServerTool(request)
        : await client.current?.callTool(request);
      if (!result) return;
      const data = result.structuredContent as Result;
      if (!data.ok) throw new Error(data.error?.message ?? "Session refresh failed.");
      const latest = stateRef.current;
      if (!data.state || latest?.sessionId !== before.sessionId) return;
      if (data.state.revision > latest.revision) {
        apply({ ...data, state: {
          ...data.state,
          view: latest.view,
          selectedProductIds: latest.selectedProductIds,
          order: latest.view === "receipt"
            ? data.state.orders.find(order => order.id === latest.order?.id) ?? data.state.order
            : data.state.order,
        } }, before.sessionId);
      }
      return stateRef.current ?? undefined;
    };
    refreshInFlight.current = refresh();
    try { return await refreshInFlight.current; }
    finally { refreshInFlight.current = null; }
  }, [app, connected, apply]);
  useEffect(() => {
    if (toolResult) {
      try {
        apply(toolResult as Result);
        setError("");
      } catch (e) {
        setError(String(e));
      }
    }
  }, [toolResult, apply]);
  useEffect(() => {
    if (window.self !== window.top) return;
    let active = true;
    async function init() {
      try {
        const [{ Client }, { StreamableHTTPClientTransport }] =
          await Promise.all([
            import("@modelcontextprotocol/sdk/client/index.js"),
            import("@modelcontextprotocol/sdk/client/streamableHttp.js"),
          ]);
        const c = new Client({
          name: "galaxus-browser-preview",
          version: "1.0",
        });
        client.current = c;
        await c.connect(
          new StreamableHTTPClientTransport(
            new URL("/mcp", window.location.origin),
          ),
        );
        let saved: string | null = null;
        try {
          saved = localStorage.getItem("prism-demo-session");
        } catch {}
        const result = await c.callTool({
          name: saved ? "get_shopping_session" : "search_products",
          arguments: saved ? { sessionId: saved } : {},
        });
        if (active) {
          const data = result.structuredContent as Result;
          apply(data);
          try {
            localStorage.setItem("prism-demo-session", data.state!.sessionId);
          } catch {}
        }
      } catch (e) {
        if (active) setError(`Could not load your demo session. ${e}`);
      }
    }
    void init();
    return () => {
      active = false;
      void client.current?.close();
      client.current = null;
    };
  }, [apply]);
  useEffect(() => {
    if (!state?.sessionId || (window.self !== window.top && !connected)) return;
    const refresh = () => {
      if (document.hidden || lock.current) return;
      void refreshSnapshot().catch((e) => setError(`Could not refresh your session: ${e instanceof Error ? e.message : String(e)}`));
    };
    refresh();
    const timer = setInterval(refresh, 5000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [state?.sessionId, connected, toolResult, refreshSnapshot]);
  async function call(name: ToolName, args: Record<string, unknown> = {}) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      let current = stateRef.current;
      if (["update_filters", "update_cart", "set_update_preferences", "place_demo_order"].includes(name)) {
        const fresh = await refreshSnapshot();
        if (fresh && fresh.sessionId === current?.sessionId && fresh.revision !== args.expectedRevision) {
          if (name === "update_filters") args = { ...args, expectedRevision: fresh.revision };
          else {
            if (name === "place_demo_order") pendingOrder.current = null;
            setNotice("Your session changed in chat. The app is refreshed; review the current details and try again.");
            return;
          }
        }
        current = stateRef.current;
      }
      const input =
        name === "search_products"
          ? args
          : { sessionId: current?.sessionId, ...args };
      const result =
        app && connected
          ? await app.callServerTool({ name, arguments: input })
          : await client.current?.callTool({ name, arguments: input });
      if (!result)
        throw new Error(
          "Host bridge is not connected yet. Wait for the tool result or reopen the app.",
        );
      const data = result.structuredContent as Result;
      if (
        name === "place_demo_order" &&
        !data.ok &&
        data.error &&
        data.error.code !== "SERVICE_UNAVAILABLE"
      )
        pendingOrder.current = null;
      if (!apply(data, current?.sessionId)) return;
      if (
        name === "search_products" &&
        data.state &&
        window.self === window.top
      ) {
        try {
          localStorage.setItem("prism-demo-session", data.state.sessionId);
        } catch {}
      }
      return data.state;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (message.includes("STALE_REVISION") || message.includes("CONCURRENT_UPDATE")) {
        if (name === "place_demo_order") pendingOrder.current = null;
        try {
          await refreshSnapshot();
          setNotice("Your session changed in chat. The app is refreshed; review it and retry. Your last action was not repeated.");
        } catch (refreshError) {
          setError(`The session changed and could not be refreshed: ${refreshError instanceof Error ? refreshError.message : String(refreshError)}`);
        }
      } else setError(message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function select(id: string) {
    const next = selected.includes(id)
      ? selected.filter((x) => x !== id)
      : [...selected, id].slice(-2);
    setSelected(next);
    if (app && connected) {
      try {
        await app.updateModelContext({
          content: [
            {
              type: "text",
              text: JSON.stringify({
                sessionId: state?.sessionId,
                revision: state?.revision,
                selectedProductIds: next,
                filters: state?.filters,
              }),
            },
          ],
        });
        setNotice("Selection shared with ChatGPT.");
      } catch (e) {
        setError(`Selection could not be shared: ${e}`);
      }
    } else setNotice("Shortlist updated. Select two products to compare.");
  }
  async function compare() {
    const result = await call("get_products", { productIds: selected });
    if (result && app && connected) {
      try {
        await app.sendMessage({
          role: "user",
          content: [
            {
              type: "text",
              text: `Compare selected products ${result.selectedProductIds.join(" and ")} in my existing session ${result.sessionId}. Retrieve stored facts; battery test conditions are unknown.`,
            },
          ],
        });
      } catch (e) {
        setError(`Comparison loaded, but chat message failed: ${e}`);
      }
    }
  }
  const current = state;
  const compared =
    current?.allProducts.filter((p) => selected.includes(p.id)) ?? [];
  function photo(p: Product, small = false) {
    return (
      <img
        className={small ? "product-photo small" : "product-photo"}
        src={assetUrl(p.image)}
        alt={`${p.brand} ${p.name}`}
        width={240}
        height={180}
        loading="eager"
      />
    );
  }
  function add(p: Product) {
    return call("update_cart", {
      expectedRevision: current?.revision,
      productId: p.id,
      quantity:
        (current?.cart.items.find((i) => i.productId === p.id)?.quantity ?? 0) +
        1,
    });
  }
  function watch(id: string) {
    const watched = current!.preferences.watchedProductIds;
    return call("set_update_preferences", {
      expectedRevision: current!.revision,
      watchedProductIds: watched.includes(id)
        ? watched.filter((x) => x !== id)
        : [...watched, id],
    });
  }
  const count =
    current?.cart.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const activeTab =
    view === "catalog" || view === "compare"
      ? "catalog"
      : view === "updates" || view === "preferences"
        ? "updates"
        : "cart";
  const filter = (patch: Record<string, unknown>) =>
    call("update_filters", { expectedRevision: current?.revision, patch });
  const back = (
    <button
      className="text-button back-link"
      disabled={busy}
      onClick={() => call("get_shopping_session")}
    >
      <Icon name="back" size={16} /> All headphones
    </button>
  );
  return (
    <main className="store" aria-busy={busy}>
      <div className="colour-band" />
      <header className="shop-header">
        <img
          className="wordmark"
          src={assetUrl("/merchants/galaxus/logo.svg")}
          width={140}
          height={24}
          alt="Galaxus"
        />
        <span className="demo-label">
          <span /> Demo store · no charge
        </span>
      </header>
      <nav className="shop-nav" aria-label="Shop navigation">
        <button
          aria-current={activeTab === "catalog" ? "page" : undefined}
          disabled={busy || !current}
          onClick={() => call("get_shopping_session")}
        >
          Headphones
        </button>
        <button
          aria-current={activeTab === "updates" ? "page" : undefined}
          disabled={busy || !current}
          onClick={() => call("get_updates")}
        >
          News + Trends
        </button>
        <button
          className="cart-tab"
          aria-current={activeTab === "cart" ? "page" : undefined}
          disabled={busy || !current}
          onClick={() => call("get_cart")}
        >
          <Icon name="cart" size={17} /> Cart{" "}
          <span className="cart-count">{count}</span>
        </button>
      </nav>
      <div
        className={`request-progress ${busy ? "is-busy" : ""}`}
        role="status"
      >
        <span className="sr-only">
          {busy ? "Updating your shopping session…" : ""}
        </span>
      </div>
      {error && (
        <div role="alert" className="message error">
          <strong>That action wasn’t confirmed.</strong>
          <p>{error}</p>
          <button
            className="text-button"
            disabled={busy}
            onClick={() =>
              current
                ? call("get_shopping_session")
                : connected || client.current?.getServerVersion()
                  ? call("search_products")
                  : window.location.reload()
            }
          >
            {current ? "Reload your session" : "Try again"}{" "}
            <Icon name="refresh" size={15} />
          </button>
        </div>
      )}
      {notice && (
        <p role="status" className="selection-notice">
          <Icon name="check" size={14} />
          {notice}
        </p>
      )}
      {!current ? (
        <section className="loading-view">
          <p className="eyebrow">SOUND + VISION</p>
          <h1>Your next sound discovery.</h1>
          <p className="muted">Connecting to your shopping session…</p>
          <div className="skeleton-grid" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div key={i}>
                <span />
                <span />
                <span />
              </div>
            ))}
          </div>
        </section>
      ) : (
        <>
          {view === "catalog" && (
            <>
              <section className="catalog-heading">
                <div>
                  <p className="eyebrow">Audio › Headphones</p>
                  <h1>Headphones</h1>
                  <p className="muted">Find your everyday pair.</p>
                </div>
                <span className="category-note">
                  Handpicked headphones
                  <br />
                  <strong>Small details. Big difference.</strong>
                </span>
              </section>
              <div className="filter-area">
                <form
                  className="filter-top"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const max = Number(budget);
                    if (
                      !budget.trim() ||
                      !Number.isFinite(max) ||
                      max < 0 ||
                      max > 10000
                    ) {
                      setError("Enter a budget between CHF 0 and CHF 10,000.");
                      return;
                    }
                    void filter({ maxPriceMinor: Math.round(max * 100) });
                  }}
                >
                  <label className="budget-control">
                    <span>Budget</span>
                    <span className="budget-input">
                      <span>CHF</span>
                      <input
                        aria-label="Budget CHF"
                        type="number"
                        min="0"
                        max="10000"
                        step="0.1"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                      />
                      <button
                        className="icon-button"
                        disabled={busy}
                        type="submit"
                        aria-label="Apply budget"
                      >
                        <Icon name="arrow" size={16} />
                      </button>
                    </span>
                  </label>
                  <button
                    type="button"
                    className={`student-button ${current.filters.maxPriceMinor === 10000 ? "is-selected" : ""}`}
                    disabled={busy}
                    onClick={() => filter({ maxPriceMinor: 10000 })}
                  >
                    Student budget <span>Under CHF 100</span>
                  </button>
                  <label className="sort-control">
                    <span className="sr-only">Sort products</span>
                    <select
                      aria-label="Sort products"
                      disabled={busy}
                      value={current.filters.sort}
                      onChange={(e) => filter({ sort: e.target.value })}
                    >
                      <option value="price_asc">Price: low to high</option>
                      <option value="price_desc">Price: high to low</option>
                    </select>
                  </label>
                </form>
                <div className="filter-chips">
                  <Icon name="sliders" size={16} />
                  <label className="fit-control">
                    <span className="sr-only">Fit</span>
                    <select
                      aria-label="Fit"
                      disabled={busy}
                      value={current.filters.formFactor}
                      onChange={(e) => filter({ formFactor: e.target.value })}
                    >
                      <option value="in-ear">In-ear</option>
                      <option value="open-ear">Open-ear</option>
                      <option value="any">Any fit</option>
                    </select>
                  </label>
                  {(
                    [
                      ["wireless", "Wireless"],
                      ["noiseCancelling", "Noise cancelling"],
                    ] as const
                  ).map(([key, label]) => (
                    <label
                      key={key}
                      className={`filter-chip ${current.filters[key] ? "is-selected" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={current.filters[key]}
                        disabled={busy}
                        onChange={(e) => filter({ [key]: e.target.checked })}
                      />
                      <Icon
                        name={current.filters[key] ? "check" : "plus"}
                        size={14}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="results-bar">
                <p>
                  <strong>{current.products.length} products</strong>
                  <span> · up to {money(current.filters.maxPriceMinor)}</span>
                </p>
                <span className="caption">Snapshot prices</span>
              </div>
              <div className="product-grid">
                {current.products.map((p) => (
                  <article
                    className={`product-card ${selected.includes(p.id) ? "is-selected" : ""}`}
                    key={p.id}
                  >
                    <div className="product-visual">
                      {photo(p)}
                      <button
                        className={`icon-button watch-button ${current.preferences.watchedProductIds.includes(p.id) ? "is-watched" : ""}`}
                        disabled={busy}
                        aria-label={`${current.preferences.watchedProductIds.includes(p.id) ? "Unwatch" : "Watch"} ${p.name}`}
                        aria-pressed={current.preferences.watchedProductIds.includes(
                          p.id,
                        )}
                        onClick={() => watch(p.id)}
                      >
                        <Icon name="heart" size={18} />
                      </button>
                    </div>
                    <div className="product-info">
                      <p className="price">{money(p.currentDemoPriceMinor)}</p>
                      <h2><strong>{p.brand}</strong> {p.name}</h2>
                      <p className="spec">
                        {p.formFactor === "in-ear" ? "In-ear" : "Open-ear"} ·{" "}
                        {p.noiseCancellation} · wireless
                      </p>
                      <p
                        className={`availability ${p.demoStock === 0 ? "out" : ""}`}
                      >
                        <span />
                        {p.demoStock > 0
                          ? "Available in demo"
                          : "Out of demo stock"}
                      </p>
                      <div className="product-actions">
                        <button
                          className="primary add-button"
                          disabled={busy || p.demoStock === 0}
                          onClick={() => add(p)}
                        >
                          <Icon name="plus" size={16} /> Add to cart
                        </button>
                        <label className="compare-choice">
                          <input
                            type="checkbox"
                            checked={selected.includes(p.id)}
                            disabled={busy}
                            onChange={() => select(p.id)}
                          />
                          <span>Compare</span>
                        </label>
                      </div>
                      <details className="product-facts">
                        <summary>Details + source</summary>
                        <p>
                          {p.listedBatteryHours} h retailer-listed battery. Test
                          conditions unverified. Colour: {p.color}. Price
                          captured {p.sourceCapturedAt.slice(0, 10)}.
                        </p>
                        <a href={p.sourceUrl} target="_blank" rel="noreferrer">
                          View on Galaxus ↗
                        </a>
                      </details>
                    </div>
                  </article>
                ))}
              </div>
              {!current.products.length && (
                <section className="empty">
                  <Icon name="sliders" size={28} />
                  <h2>No matches this time.</h2>
                  <p>Try a higher budget or a different fit.</p>
                  <button
                    className="secondary"
                    disabled={busy}
                    onClick={() =>
                      filter({
                        maxPriceMinor: 25000,
                        formFactor: "any",
                        noiseCancelling: false,
                      })
                    }
                  >
                    Show all headphones
                  </button>
                </section>
              )}
              {selected.length > 0 && (
                <div className="compare-tray">
                  <div className="shortlist-thumbs">
                    {current.allProducts
                      .filter((p) => selected.includes(p.id))
                      .map((p) => (
                        <span key={p.id}>{photo(p, true)}</span>
                      ))}
                  </div>
                  <p>
                    <strong>{selected.length} of 2 selected</strong>
                    <span>Your side-by-side shortlist</span>
                  </p>
                  <button
                    className="primary"
                    disabled={busy || selected.length !== 2}
                    onClick={compare}
                  >
                    Compare <Icon name="arrow" size={16} />
                  </button>
                </div>
              )}
            </>
          )}
          {view === "compare" && (
            <section className="view-content compare-view">
              {back}
              <div className="view-heading">
                <p className="eyebrow">YOUR SHORTLIST</p>
                <h1>The details, side by side.</h1>
                <p className="muted">
                  Two good options. Find the one that fits you.
                </p>
              </div>
              <div className="comparison-table">
                <table>
                  <caption className="sr-only">
                    Headphone comparison using captured retailer facts
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">
                        <Icon name="compare" size={23} />
                        <span className="comparison-label">At a glance</span>
                      </th>
                      {compared.map((p) => (
                        <th scope="col" key={p.id}>
                          {photo(p)}
                          <span className="brand">{p.brand}</span>
                          <strong className="compare-name">{p.name}</strong>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="comparison-price">
                      <th scope="row">Price</th>
                      {compared.map((p) => (
                        <td key={p.id}>{money(p.currentDemoPriceMinor)}</td>
                      ))}
                    </tr>
                    <tr>
                      <th scope="row">Fit</th>
                      {compared.map((p) => (
                        <td key={p.id}>{p.formFactor}</td>
                      ))}
                    </tr>
                    <tr>
                      <th scope="row">Noise control</th>
                      {compared.map((p) => (
                        <td key={p.id}>
                          <span className="spec-pill">
                            {p.noiseCancellation}
                          </span>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <th scope="row">Listed battery¹</th>
                      {compared.map((p) => (
                        <td key={p.id}>{p.listedBatteryHours} h</td>
                      ))}
                    </tr>
                    <tr>
                      <th scope="row">Colour</th>
                      {compared.map((p) => (
                        <td key={p.id}>{p.color}</td>
                      ))}
                    </tr>
                    <tr>
                      <th scope="row">
                        <span className="sr-only">Purchase</span>
                      </th>
                      {compared.map((p) => (
                        <td key={p.id}>
                          <button
                            className="primary"
                            disabled={busy || p.demoStock === 0}
                            onClick={() => add(p)}
                          >
                            <Icon name="plus" size={15} />
                            <span>Add to cart</span>
                          </button>
                          <a
                            className="source-link"
                            href={p.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View source ↗
                          </a>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="comparison-note">
                ¹ Retailer-listed durations. Test conditions differ or are
                unknown, so these figures don’t establish a performance winner.
              </p>
            </section>
          )}
          {(view === "cart" || view === "checkout") && (
            <section className="view-content cart-view">
              {back}
              <div className="view-heading">
                <p className="eyebrow">
                  {view === "checkout" ? "ORDER REVIEW" : "YOUR CART"}
                </p>
                <h1>
                  {view === "checkout"
                    ? "Everything look good?"
                    : "Good choice."}
                </h1>
                <p className="muted">
                  {view === "checkout"
                    ? "One last look before your demo order."
                    : `${count} ${count === 1 ? "item" : "items"} in your shopping cart.`}
                </p>
              </div>
              {!count ? (
                <div className="empty">
                  <Icon name="cart" size={32} />
                  <h2>Your cart is ready for a discovery.</h2>
                  <p>Find a pair you’ll want to take everywhere.</p>
                  <button
                    className="primary"
                    onClick={() => call("get_shopping_session")}
                    disabled={busy}
                  >
                    Browse headphones <Icon name="arrow" size={16} />
                  </button>
                </div>
              ) : (
                <div className="checkout-layout">
                  <div className="cart-items">
                    {current.cart.items.map((i) => (
                      <article className="cart-row" key={i.productId}>
                        {photo(i.product, true)}
                        <div className="cart-product">
                          <p className="brand">{i.product.brand}</p>
                          <h2>{i.product.name}</h2>
                          <p className="spec">{money(i.unitPriceMinor)} each</p>
                          {view === "cart" ? (
                            <div className="quantity-control">
                              <button
                                className="icon-button"
                                aria-label={`Decrease quantity ${i.product.name}`}
                                disabled={busy}
                                onClick={() =>
                                  call("update_cart", {
                                    expectedRevision: current.revision,
                                    productId: i.productId,
                                    quantity: i.quantity - 1,
                                  })
                                }
                              >
                                <Icon name="minus" size={14} />
                              </button>
                              <span aria-label={`Quantity ${i.product.name}`}>
                                {i.quantity}
                              </span>
                              <button
                                className="icon-button"
                                aria-label={`Increase quantity ${i.product.name}`}
                                disabled={
                                  busy ||
                                  i.quantity >=
                                    Math.min(
                                      5,
                                      current.allProducts.find(
                                        (p) => p.id === i.productId,
                                      )!.demoStock,
                                    )
                                }
                                onClick={() =>
                                  call("update_cart", {
                                    expectedRevision: current.revision,
                                    productId: i.productId,
                                    quantity: i.quantity + 1,
                                  })
                                }
                              >
                                <Icon name="plus" size={14} />
                              </button>
                            </div>
                          ) : (
                            <p className="caption">Quantity {i.quantity}</p>
                          )}
                        </div>
                        <strong className="line-price">
                          {money(i.unitPriceMinor * i.quantity)}
                        </strong>
                      </article>
                    ))}
                  </div>
                  <aside className="order-summary">
                    <h2>Order summary</h2>
                    <div>
                      <span>Subtotal</span>
                      <span>{money(current.cart.totalMinor)}</span>
                    </div>
                    <div>
                      <span>Demo shipping</span>
                      <span>Free</span>
                    </div>
                    <div className="total">
                      <strong>Total</strong>
                      <strong>{money(current.cart.totalMinor)}</strong>
                    </div>
                    <p className="demo-note">
                      <Icon name="check" size={15} />
                      <span>Demo checkout. No payment or delivery.</span>
                    </p>
                    {view === "cart" ? (
                      <button
                        className="primary wide"
                        disabled={busy}
                        onClick={() => {
                          void call("get_checkout");
                        }}
                      >
                        Review order <Icon name="arrow" size={16} />
                      </button>
                    ) : (
                      <>
                        <button
                          className="primary wide"
                          disabled={busy}
                          onClick={() => {
                            pendingOrder.current ??= {
                              operationId: crypto.randomUUID(),
                              expectedRevision: current.revision,
                              reviewedTotalMinor: current.cart.totalMinor,
                            };
                            void call("place_demo_order", pendingOrder.current);
                          }}
                        >
                          Place demo order <Icon name="arrow" size={16} />
                        </button>
                        <p className="caption center">
                          No charge. No real Galaxus order.
                        </p>
                        <button
                          className="text-button wide"
                          disabled={busy}
                          onClick={() => call("get_cart")}
                        >
                          Edit cart
                        </button>
                      </>
                    )}
                  </aside>
                </div>
              )}
            </section>
          )}
          {view === "receipt" && current.order && (
            <section className="view-content receipt">
              <span className="receipt-mark">
                <Icon name="check" size={28} />
              </span>
              <p className="eyebrow">DEMO ORDER CONFIRMED</p>
              <h1>That’s a sound choice.</h1>
              <p className="muted">
                Your demo order is recorded. Nothing is charged or shipped.
              </p>
              <div className="receipt-details">
                {current.order.items.map((i) => {
                  const p = current.allProducts.find(
                    (p) => p.id === i.productId,
                  )!;
                  return (
                    <div className="receipt-item" key={i.productId}>
                      {photo(p, true)}
                      <span>
                        <strong>
                          {p.brand} {p.name}
                        </strong>
                        <span>Quantity {i.quantity}</span>
                      </span>
                      <strong>{money(i.unitPriceMinor * i.quantity)}</strong>
                    </div>
                  );
                })}
                <div className="total">
                  <span>Demo total</span>
                  <strong>{money(current.order.totalMinor)}</strong>
                </div>
                <p className="caption receipt-id">
                  Order reference <code>{current.order.id}</code>
                </p>
              </div>
              <button
                className="primary"
                onClick={() => call("get_updates")}
                disabled={busy}
              >
                Make more of your audio <Icon name="arrow" size={16} />
              </button>
            </section>
          )}
          {(view === "updates" || view === "preferences") && (
            <section className="view-content updates-view">
              <div className="view-heading">
                <p className="eyebrow">NEWS + TRENDS</p>
                <h1>A little more in the know.</h1>
                <p className="muted">
                  Fresh perspectives for your everyday listening.
                </p>
              </div>
              <div className="follow-panel">
                <span className="follow-icon">
                  <Icon name="bell" size={21} />
                </span>
                <div>
                  <strong>Your audio, on your radar.</strong>
                  <p>Save your interests and check back for new editions.</p>
                </div>
                <button
                  className={
                    current.preferences.audio ? "secondary" : "primary"
                  }
                  aria-pressed={current.preferences.audio}
                  disabled={busy}
                  onClick={() =>
                    call("set_update_preferences", {
                      expectedRevision: current.revision,
                      audio: !current.preferences.audio,
                    })
                  }
                >
                  {current.preferences.audio ? (
                    <>
                      <Icon name="check" size={16} /> Following audio
                    </>
                  ) : (
                    <>
                      <Icon name="plus" size={16} /> Follow audio
                    </>
                  )}
                </button>
              </div>
              <div className="feed-header">
                <span className="caption">
                  ORIGINAL DEMO GUIDES · EDITION {current.edition}
                </span>
                <button
                  className="text-button"
                  disabled={busy}
                  onClick={() => call("get_updates")}
                >
                  <Icon name="refresh" size={15} /> Refresh
                </button>
              </div>
              <div className="editorial-feed">
                {current.editions.map((edition, index) => {
                  const imageProduct = current.allProducts.find(
                    (p) =>
                      p.id ===
                      edition.productIds[index % edition.productIds.length],
                  );
                  return (
                    <article className="edition" key={edition.id}>
                      <div className={`edition-art art-${index % 3}`}>
                        {imageProduct && photo(imageProduct)}
                      </div>
                      <div className="edition-copy">
                        <p className="eyebrow">{edition.type}</p>
                        <h2>{edition.title}</h2>
                        <p>{edition.summary}</p>
                        <div className="related-products">
                          {edition.productIds.map((id) => {
                            const p = current.allProducts.find(
                              (p) => p.id === id,
                            )!;
                            const watched =
                              current.preferences.watchedProductIds.includes(
                                id,
                              );
                            return (
                              <div className="related" key={id}>
                                <a
                                  href={p.sourceUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  {p.brand} {p.name} ↗
                                </a>
                                <button
                                  className="text-button"
                                  aria-pressed={watched}
                                  disabled={busy}
                                  onClick={() => watch(id)}
                                >
                                  <Icon
                                    name={watched ? "check" : "plus"}
                                    size={14}
                                  />
                                  {watched ? "Watching" : "Watch"}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
              <p className="caption feed-note">
                Preferences are saved to your demo session. Updates appear on
                refresh; background notifications aren’t enabled.
              </p>
            </section>
          )}
          <footer className="shop-footer">
            <div>
              <span>Unofficial PRISM demo · prices from 31.10.2026</span>
              <button
                className="text-button reset-session"
                disabled={busy}
                onClick={() => call("search_products")}
              >
                <Icon name="refresh" size={13} /> New session
              </button>
            </div>
            <details>
              <summary>About this demo</summary>
              <p>
                Snapshot prices and simulated stock. No real payments, shipping
                or Galaxus orders.
              </p>
              {current.disclosures.map((d) => (
                <p key={d}>{d}</p>
              ))}
              <p>
                Session IDs provide access to synthetic demo data. No production
                customer authentication is implemented.
              </p>
            </details>
          </footer>
        </>
      )}
    </main>
  );
}
