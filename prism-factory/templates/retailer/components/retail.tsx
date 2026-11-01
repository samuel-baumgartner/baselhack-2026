"use client";
/* eslint-disable @next/next/no-img-element */
import { useState, type CSSProperties, type ReactNode } from "react";
import {
  ShoppingBag,
  ArrowRight,
  Check,
  ArrowLeft,
  Plus,
  Minus,
  RefreshCw,
  Heart,
  LoaderCircle,
} from "lucide-react";
import type { Snapshot, Command } from "@/lib/retail/shopping";
import type { FlowId } from "@/lib/contracts";

/**
 * Shared merchant view. Rendered by PRISM's host previews and bundled into
 * the standalone MCP Apps widget, so it must not depend on Next.js or on
 * factory CSS variables. Styles live in the `.retail` block of globals.css.
 */
export type RetailAction = (
  name: string,
  args?: Partial<Command>,
) => Promise<void>;
const money = (n: number) => `CHF ${(n / 100).toFixed(2)}`;
const BUDGETS = [5000, 10000, 15000, 25000, 1000000];
const MAX_QUANTITY = 10;

export function RetailView({
  state,
  onAction,
  busy = false,
  headline,
  accent = "#f3dc00",
  enabled = ["discover", "purchase", "updates"],
}: {
  state: Snapshot;
  onAction: RetailAction;
  busy?: boolean;
  enabled?: FlowId[];
  headline?: string;
  accent?: string;
}) {
  const [compare, setCompare] = useState<string[]>([]);
  const [pending, setPending] = useState("");
  const orderKey = `order-${state.sessionId.slice(0, 20)}-${state.revision}`;
  const itemCount = state.cart.items.reduce((n, i) => n + i.quantity, 0);
  const watched = state.preferences.watchedProductIds;
  const view = state.view;
  const canBuy = enabled.includes("purchase"),
    hasUpdates = enabled.includes("updates");

  /** Runs one action and marks the control that started it. */
  const run = (key: string, name: string, args?: Partial<Command>) => {
    if (busy) return;
    setPending(key);
    void onAction(name, args)
      .catch(() => undefined)
      .finally(() => setPending(""));
  };
  const icon = (id: string, idle: ReactNode) =>
    pending === id ? (
      <LoaderCircle size={14} className="spin" aria-hidden="true" />
    ) : (
      idle
    );
  const toDiscover = () => {
    setCompare([]);
    run("discover", "get_shopping_session");
  };

  const list =
    view === "compare"
      ? state.allProducts.filter((p) => state.selectedProductIds.includes(p.id))
      : state.products;

  return (
    <section
      className="retail"
      style={{ "--merchant-accent": accent } as CSSProperties}
      aria-label={`${state.merchant.name} shopping experience`}
      aria-busy={busy}
      data-view={view}
      data-merchant={state.merchant.name.toLowerCase()}
    >
      <header className="retail-head">
        <span className="merchant-wordmark">
          {state.merchant.name === "Galaxus" ? (
            <img
              src={state.merchant.logo}
              alt="Galaxus"
              width={125}
              height={22}
            />
          ) : (
            state.merchant.name
          )}
        </span>
        <nav aria-label={`${state.merchant.name} sections`}>
          <button
            type="button"
            aria-current={view === "catalog" || view === "compare" ? "page" : undefined}
            onClick={toDiscover}
            disabled={busy}
          >
            Discover
          </button>
          {hasUpdates && (
            <button
              type="button"
              aria-current={view === "updates" ? "page" : undefined}
              onClick={() => run("updates", "get_updates")}
              disabled={busy}
            >
              Stories
            </button>
          )}
          {canBuy && (
            <button
              type="button"
              className="retail-cart"
              aria-label={`Cart, ${itemCount} ${itemCount === 1 ? "item" : "items"}`}
              aria-current={view === "cart" || view === "checkout" ? "page" : undefined}
              onClick={() => run("cart", "get_cart")}
              disabled={busy}
            >
              <ShoppingBag size={16} aria-hidden="true" />
              <span data-filled={itemCount > 0 || undefined}>{itemCount}</span>
            </button>
          )}
        </nav>
      </header>

      {view === "catalog" || view === "compare" ? (
        <>
          {view === "compare" && (
            <button type="button" className="retail-back" onClick={toDiscover} disabled={busy}>
              <ArrowLeft size={15} aria-hidden="true" />
              All products
            </button>
          )}
          <div className="retail-heading">
            <div>
              <span className="retail-eyebrow">
                {view === "compare" ? "Side by side" : state.merchant.name === "Galaxus" ? "Audio › Headphones" : "Product range"}
              </span>
              <h3>
                {view === "compare" ? "A closer look." : state.merchant.name === "Galaxus" ? "Headphones" : (headline ?? "Find your quiet.")}
              </h3>
            </div>
          </div>
          {view === "catalog" && (
            <div className="filter-row">
              <span className="filter-chip">
                <Check size={12} aria-hidden="true" />
                Noise cancelling
              </span>
              <label className="filter-chip">
                Up to
                <select
                  aria-label="Maximum budget"
                  value={state.filters.maxPriceMinor}
                  disabled={busy}
                  onChange={(e) =>
                    run("budget", "update_filters", {
                      patch: { maxPriceMinor: Number(e.target.value) },
                    })
                  }
                >
                  {BUDGETS.map((v) => (
                    <option key={v} value={v}>
                      {v === 1000000 ? "Any price" : `CHF ${v / 100}`}
                    </option>
                  ))}
                </select>
              </label>
              <span className="filter-count" role="status">
                {pending === "budget" ? (
                  <LoaderCircle size={12} className="spin" aria-hidden="true" />
                ) : null}
                {state.products.length} {state.products.length === 1 ? "match" : "matches"}
              </span>
            </div>
          )}
          <div className="products">
            {list.map((p) => {
              const isWatched = watched.includes(p.id);
              const inCompare = compare.includes(p.id);
              return (
                <article className="product" key={p.id}>
                  <div className="product-photo">
                    <img
                      src={p.image}
                      alt={`${p.brand} ${p.name}`}
                      width="280"
                      height="220"
                      loading="lazy"
                    />
                    {hasUpdates && (
                      <button
                        type="button"
                        className="save-product"
                        aria-label={`Watch ${p.brand} ${p.name}`}
                        aria-pressed={isWatched}
                        disabled={busy}
                        onClick={() =>
                          run(`watch-${p.id}`, "set_update_preferences", {
                            watchedProductIds: isWatched
                              ? watched.filter((x) => x !== p.id)
                              : [...watched, p.id],
                          })
                        }
                      >
                        {icon(
                          `watch-${p.id}`,
                          <Heart
                            size={15}
                            fill={isWatched ? "currentColor" : "none"}
                            aria-hidden="true"
                          />,
                        )}
                      </button>
                    )}
                  </div>
                  <strong className="product-price">{money(p.currentDemoPriceMinor)}</strong>
                  <h4><strong>{p.brand}</strong> {p.name}</h4>
                  <p className="product-spec">
                    {p.noiseCancellation} · Wireless · {p.listedBatteryHours}h listed
                  </p>
                  <div className="product-actions">
                    {canBuy && (
                      <button
                        type="button"
                        className="retail-add"
                        disabled={busy}
                        onClick={() =>
                          run(`add-${p.id}`, "update_cart", {
                            productId: p.id,
                            quantity: Math.min(
                              (state.cart.items.find((i) => i.productId === p.id)
                                ?.quantity ?? 0) + 1,
                              MAX_QUANTITY,
                              p.demoStock,
                            ),
                          })
                        }
                      >
                        {icon(`add-${p.id}`, <Plus size={14} aria-hidden="true" />)}
                        Add to cart
                      </button>
                    )}
                    {view === "catalog" && (
                      <button
                        type="button"
                        className="compare-toggle"
                        aria-pressed={inCompare}
                        onClick={() =>
                          setCompare((c) =>
                            inCompare ? c.filter((x) => x !== p.id) : [...c, p.id],
                          )
                        }
                      >
                        <span className="compare-box" aria-hidden="true">
                          {inCompare && <Check size={11} strokeWidth={3} />}
                        </span>
                        Compare
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
          {view === "catalog" && !state.products.length && (
            <div className="retail-empty">
              <h4>Nothing at this budget yet.</h4>
              <p>The quietest pairs start a little higher.</p>
              <button
                type="button"
                onClick={() =>
                  run("budget", "update_filters", { patch: { maxPriceMinor: 25000 } })
                }
                disabled={busy}
              >
                Show up to CHF 250
              </button>
            </div>
          )}
          {view === "catalog" && compare.length > 0 && (
            <div className="compare-bar">
              <button
                type="button"
                className="compare-clear"
                onClick={() => setCompare([])}
              >
                Clear
              </button>
              <button
                type="button"
                className="compare-button"
                disabled={busy}
                onClick={() => run("compare", "get_products", { productIds: compare })}
              >
                {compare.length === 1
                  ? "View 1 product"
                  : `Compare ${compare.length} products`}
                {icon("compare", <ArrowRight size={15} aria-hidden="true" />)}
              </button>
            </div>
          )}
        </>
      ) : view === "cart" || view === "checkout" ? (
        <>
          <button type="button" className="retail-back" onClick={toDiscover} disabled={busy}>
            <ArrowLeft size={15} aria-hidden="true" />
            Keep exploring
          </button>
          <div className="retail-heading">
            <div>
              <span className="retail-eyebrow">
                {view === "checkout" ? "Review" : "Cart"}
              </span>
              <h3>{view === "checkout" ? "One last look." : "Your good choices."}</h3>
            </div>
          </div>
          {state.cart.items.length ? (
            <>
              <ul className="cart-items">
                {state.cart.items.map((i) => {
                  const limit = Math.min(MAX_QUANTITY, i.product.demoStock);
                  return (
                    <li className="cart-item" key={i.productId}>
                      <img src={i.product.image} width="64" height="64" alt="" />
                      <div>
                        <h4>
                          {i.product.brand} {i.product.name}
                        </h4>
                        <p>{money(i.unitPriceMinor)}</p>
                      </div>
                      <div className="quantity" role="group" aria-label={`Quantity of ${i.product.name}`}>
                        <button
                          type="button"
                          aria-label={
                            i.quantity === 1
                              ? `Remove ${i.product.name}`
                              : `One less ${i.product.name}`
                          }
                          disabled={busy}
                          onClick={() =>
                            run(`less-${i.productId}`, "update_cart", {
                              productId: i.productId,
                              quantity: i.quantity - 1,
                            })
                          }
                        >
                          {icon(`less-${i.productId}`, <Minus size={14} aria-hidden="true" />)}
                        </button>
                        <output aria-live="polite">{i.quantity}</output>
                        <button
                          type="button"
                          aria-label={`One more ${i.product.name}`}
                          disabled={busy || i.quantity >= limit}
                          onClick={() =>
                            run(`more-${i.productId}`, "update_cart", {
                              productId: i.productId,
                              quantity: i.quantity + 1,
                            })
                          }
                        >
                          {icon(`more-${i.productId}`, <Plus size={14} aria-hidden="true" />)}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="cart-total">
                <span>Total</span>
                <strong>{money(state.cart.totalMinor)}</strong>
              </div>
              <p className="demo-note">A demo order. No payment, no charge, no real delivery.</p>
              <button
                type="button"
                className="retail-checkout"
                disabled={busy}
                onClick={() =>
                  view === "checkout"
                    ? run("order", "place_demo_order", {
                        operationId: orderKey,
                        reviewedTotalMinor: state.cart.totalMinor,
                      })
                    : run("order", "get_checkout")
                }
              >
                {view === "checkout" ? "Place demo order · no charge" : "Review demo order"}
                {icon("order", <ArrowRight size={17} aria-hidden="true" />)}
              </button>
            </>
          ) : (
            <div className="retail-empty">
              <ShoppingBag aria-hidden="true" />
              <h4>Your cart is a blank canvas.</h4>
              <p>Find something you love first.</p>
              <button type="button" onClick={toDiscover} disabled={busy}>
                Explore products
              </button>
            </div>
          )}
        </>
      ) : view === "receipt" ? (
        <div className="receipt" role="status">
          <div className="receipt-check" aria-hidden="true">
            <Check size={26} />
          </div>
          <span className="retail-eyebrow">Demo order confirmed</span>
          <h3>
            A good choice.
            <br />
            All yours to imagine.
          </h3>
          <p>Your synthetic order is saved. Nothing has been charged.</p>
          <code>{state.order?.id.slice(0, 18)}</code>
          <strong>{money(state.order?.totalMinor ?? 0)}</strong>
          <button
            type="button"
            className="retail-checkout"
            disabled={busy}
            onClick={() =>
              hasUpdates ? run("next", "get_updates") : toDiscover()
            }
          >
            {hasUpdates ? "Explore your updates" : "Keep exploring"}
            {icon("next", <ArrowRight size={17} aria-hidden="true" />)}
          </button>
        </div>
      ) : (
        <div className="updates">
          <div className="retail-heading">
            <div>
              <span className="retail-eyebrow">A little more worth knowing</span>
              <h3>Your audio edit.</h3>
            </div>
            <button
              type="button"
              className="retail-icon"
              aria-label="Refresh updates"
              onClick={() => run("refresh", "get_updates")}
              disabled={busy}
            >
              <RefreshCw
                size={17}
                className={pending === "refresh" ? "spin" : undefined}
                aria-hidden="true"
              />
            </button>
          </div>
          <button
            type="button"
            className="follow"
            aria-pressed={state.preferences.audio}
            disabled={busy}
            onClick={() =>
              run("follow", "set_update_preferences", {
                audio: !state.preferences.audio,
              })
            }
          >
            {icon(
              "follow",
              state.preferences.audio ? (
                <Check size={15} aria-hidden="true" />
              ) : (
                <Plus size={15} aria-hidden="true" />
              ),
            )}
            {state.preferences.audio ? "Following audio" : "Follow audio"}
          </button>
          {state.editions.map((e, i) => (
            <article className="edition" key={e.id}>
              <span className="edition-num" aria-hidden="true">
                0{i + 1}
              </span>
              <div>
                <span className="retail-eyebrow">{e.type}</span>
                <h4>{e.title}</h4>
                <p>{e.summary}</p>
                <div className="edition-products">
                  {state.allProducts
                    .filter((p) => e.productIds.includes(p.id))
                    .map((p) => (
                      <button
                        type="button"
                        key={p.id}
                        disabled={busy}
                        onClick={() =>
                          run(`story-${e.id}-${p.id}`, "get_products", {
                            productIds: [p.id],
                          })
                        }
                      >
                        <img src={p.image} width="40" height="40" alt="" />
                        {p.name}
                        {icon(`story-${e.id}-${p.id}`, <ArrowRight size={13} aria-hidden="true" />)}
                      </button>
                    ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      <footer className="retail-footer">
        Curated Galaxus catalog · 31 Oct 2026 price snapshots · Synthetic commerce
      </footer>
    </section>
  );
}
