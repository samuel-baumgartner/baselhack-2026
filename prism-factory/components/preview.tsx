"use client";
/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUp,
  SquarePen,
  Check,
  LoaderCircle,
  RotateCcw,
} from "lucide-react";
import { RetailView } from "./retail";
import { PlatformMark, platformName, platforms, type PlatformId } from "./platforms";
import { requestJson, errorText } from "./request";
import { readStored, removeStored, writeStored } from "./storage";
import type { Job } from "@/lib/contracts";
import type { Command, Snapshot } from "@/lib/retail/shopping";

type Message = { role: "user" | "assistant"; content: string; calls?: string[] };
/** What failed last, so “Try again” replays exactly that and nothing else. */
type Failure =
  | { kind: "open" }
  | { kind: "action"; name: string; args: Partial<Command> }
  | { kind: "chat"; text: string };

const MESSAGE_LIMIT = 1600;
const HISTORY_ITEM_LIMIT = 2000;
const reducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function Preview({
  job,
  platform = "chatgpt",
  widgetOnly = false,
}: {
  job: Job;
  platform?: string;
  widgetOnly?: boolean;
}) {
  const [state, setState] = useState<Snapshot | null>(null),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState<"" | "action" | "chat" | "open">("open"),
    [error, setError] = useState(""),
    [failure, setFailure] = useState<Failure | null>(null),
    [messages, setMessages] = useState<Message[]>([]);
  const inflight = useRef(false);
  const stateRef = useRef<Snapshot | null>(null);
  const retailRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const composerWrapRef = useRef<HTMLDivElement>(null);
  const storageKey = `prism-retail-${job.id}`;
  const id = (platforms.some((p) => p.id === platform) ? platform : "chatgpt") as PlatformId;
  const name = platformName(id);

  const commit = useCallback(
    (next: Snapshot) => {
      stateRef.current = next;
      setState(next);
      writeStored(storageKey, next.sessionId);
    },
    [storageKey],
  );

  /** One request at a time: double taps and Enter repeats are dropped. */
  const exclusive = useCallback(
    async (kind: "action" | "chat" | "open", work: () => Promise<void>) => {
      if (inflight.current) return;
      inflight.current = true;
      setBusy(kind);
      setError("");
      setFailure(null);
      try {
        await work();
      } finally {
        inflight.current = false;
        setBusy("");
      }
    },
    [],
  );

  const retail = useCallback(
    (body: Record<string, unknown>) =>
      requestJson<{ state: Snapshot }>(`/api/retail/${job.id}`, {
        method: "POST",
        body,
      }).then((d) => d.state),
    [job.id],
  );

  const open = useCallback(
    () =>
      exclusive("open", async () => {
        const saved = readStored(storageKey);
        try {
          if (saved) {
            try {
              commit(await retail({ name: "get_shopping_session", sessionId: saved }));
              return;
            } catch {
              // An expired or foreign session: start fresh instead of failing.
              removeStored(storageKey);
            }
          }
          commit(await retail({ name: "search_products" }));
        } catch (e) {
          setError(errorText(e, "We couldn’t open the experience."));
          setFailure({ kind: "open" });
        }
      }),
    [commit, exclusive, retail, storageKey],
  );

  useEffect(() => {
    void open();
  }, [open]);

  async function action(name: string, args: Partial<Command> = {}) {
    await exclusive("action", async () => {
      const current = stateRef.current;
      try {
        commit(
          await retail({
            name,
            ...args,
            sessionId: current?.sessionId,
            expectedRevision: current?.revision,
          }),
        );
      } catch (e) {
        const message = errorText(e, "We couldn’t update the experience.");
        // Another tab or the assistant changed the cart: resync so a retry
        // is reviewed against the latest state instead of failing again.
        if (/state changed/i.test(message) && current) {
          try {
            commit(await retail({ name: "get_shopping_session", sessionId: current.sessionId }));
          } catch {
            // Keep the original error.
          }
          setError("This experience changed in the meantime. Review it and try again.");
        } else setError(message);
        setFailure({ kind: "action", name, args });
      }
    });
  }

  async function send(raw: string) {
    const text = raw.trim();
    const current = stateRef.current;
    if (!current || !text || inflight.current) return;
    const history = messages.slice(-12).map(({ role, content }) => ({
      role,
      content: content.slice(0, HISTORY_ITEM_LIMIT),
    }));
    setMessage("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    await exclusive("chat", async () => {
      try {
        const data = await requestJson<{ text: string; state: Snapshot; calls?: string[] }>(
          `/api/chat/${job.id}`,
          {
            method: "POST",
            body: { message: text, sessionId: current.sessionId, history },
          },
        );
        commit(data.state);
        setMessages((m) => [...m, { role: "assistant", content: data.text, calls: data.calls }]);
      } catch (e) {
        // Take the unanswered message back out of the transcript and return
        // it to the composer, so nothing is lost and nothing is duplicated.
        setMessages((m) => m.slice(0, -1));
        setMessage((m) => m || text);
        setError(errorText(e, "The assistant is unavailable right now."));
        setFailure({ kind: "chat", text });
      }
    });
  }

  function retry() {
    if (!failure) return;
    if (failure.kind === "open") void open();
    else if (failure.kind === "action") void action(failure.name, failure.args);
    else {
      setMessage("");
      void send(failure.text);
    }
  }

  function reset() {
    if (inflight.current) return;
    setMessages([]);
    setMessage("");
    setError("");
    setFailure(null);
    composerRef.current?.focus();
  }

  // Expose the sticky composer's height so in-view sticky controls (the
  // merchant's compare bar) can sit above it instead of underneath.
  useEffect(() => {
    const wrap = composerWrapRef.current,
      main = mainRef.current;
    if (!wrap || !main || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) =>
      main.style.setProperty(
        "--composer-height",
        `${Math.ceil(entry.borderBoxSize?.[0]?.blockSize ?? wrap.offsetHeight)}px`,
      ),
    );
    observer.observe(wrap);
    return () => observer.disconnect();
  }, []);

  // Keep the newest message in view after each turn.
  const count = messages.length;
  useEffect(() => {
    if (count)
      lastMessageRef.current?.scrollIntoView({
        behavior: reducedMotion() ? "auto" : "smooth",
        block: "nearest",
      });
  }, [count]);

  // When a control changes the view (cart, compare, receipt), the new view
  // can start above the fold. Bring its top back instead of stranding the
  // reader somewhere in the middle of a shorter page.
  const view = state?.view;
  const lastView = useRef(view);
  useEffect(() => {
    const changed = lastView.current !== undefined && lastView.current !== view;
    lastView.current = view;
    const el = retailRef.current;
    if (!changed || !el) return;
    // Already visible below the sticky host header: leave the page alone.
    const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
    if (el.getBoundingClientRect().top >= margin - 1) return;
    el.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
  }, [view]);

  const retailView = state ? (
    <div className="retail-frame" ref={retailRef}>
      <RetailView
        state={state}
        enabled={job.selected}
        headline={job.config?.headline}
        accent={job.config?.company.accent}
        busy={!!busy}
        onAction={action}
      />
    </div>
  ) : !failure ? (
    <div className="preview-loading" role="status">
      <LoaderCircle className="spin" aria-hidden="true" />
      Opening your experience…
    </div>
  ) : null;

  const errorBox = error && (
    <div className="preview-error" role="alert">
      <p>{error}</p>
      {failure && (
        <button type="button" onClick={retry} disabled={!!busy}>
          <RotateCcw size={13} aria-hidden="true" />
          {failure.kind === "chat" ? "Send again" : "Try again"}
        </button>
      )}
    </div>
  );

  if (widgetOnly)
    return (
      <div className="widget-page">
        {errorBox}
        {retailView}
      </div>
    );

  const prompts = [
    "Find earbuds for studying",
    "Adjust the filters — I’m a student",
    ...(job.selected.includes("updates") ? ["Show me audio updates"] : []),
  ];

  return (
    <div className={`host-shell host-${id}`}>
      <aside className="host-sidebar">
        <Link href={`/build/${job.id}`} className="back-factory">
          <ArrowLeft size={16} aria-hidden="true" />
          Back to factory
        </Link>
        <button type="button" className="host-new" onClick={reset} disabled={!!busy}>
          <SquarePen size={16} aria-hidden="true" />
          New conversation
        </button>
        <span className="sidebar-caption">Today</span>
        <div className="sidebar-conversation" aria-current="true">
          {job.profile?.name} · shopping
        </div>
        <div className="sidebar-bottom">
          <span className="avatar" aria-hidden="true">
            P
          </span>
          <div>
            PRISM sandbox<small>Live tools · demo commerce</small>
          </div>
        </div>
      </aside>
      <main className="host-main" ref={mainRef}>
        <header className="host-header">
          <Link href={`/build/${job.id}`} className="host-mobile-back">
            <ArrowLeft size={18} aria-hidden="true" />
            <span>Factory</span>
          </Link>
          <div className="host-title">
            <PlatformMark platform={id} size={18} />
            <strong>{name}</strong>
          </div>
          <span className="preview-label">PRISM preview</span>
          <button
            type="button"
            className="host-mobile-new"
            onClick={reset}
            disabled={!!busy}
            aria-label="New conversation"
          >
            <SquarePen size={18} aria-hidden="true" />
          </button>
        </header>
        {id !== "chatgpt" && (
          <p className="host-notice">
            {name} visual preview, powered by PRISM’s shared demo runtime. Not a
            native {name} connection.
          </p>
        )}
        <div className="conversation">
          <p className="preview-intro">
            {job.profile?.name.toLowerCase() === "galaxus" ? <img className="conversation-merchant-logo" src="/merchants/galaxus/icon.svg" alt="" width={22} height={22} /> : <span className="integration-dot" aria-hidden="true" />}
            {job.profile?.name} is part of this conversation
          </p>
          {messages.length === 0 && (
            <>
              <h1>
                Good choices start
                <br />
                with a conversation.
              </h1>
              <p className="preview-subtitle">
                {job.config?.welcome ?? "Try the experience you just created."}
              </p>
            </>
          )}
          <div className="messages" aria-live="polite">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`message ${m.role}`}
                ref={i === messages.length - 1 ? lastMessageRef : undefined}
              >
                {m.role === "assistant" && (
                  <PlatformMark platform={id} size={16} />
                )}
                <div>
                  <p>{m.content}</p>
                  {!!m.calls?.length && (
                    <span className="tool-call">
                      <Check size={12} aria-hidden="true" />
                      Used {m.calls.map((n) => n.replaceAll("_", " ")).join(", ")}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {busy === "chat" && (
              <div className="message assistant pending" role="status">
                <PlatformMark platform={id} size={16} />
                <span className="thinking">
                  <i />
                  <i />
                  <i />
                  <span className="sr-only">{name} is working on it</span>
                </span>
              </div>
            )}
          </div>
          {errorBox}
          {retailView}
        </div>
        <div className="composer-wrap" ref={composerWrapRef}>
          {messages.length === 0 && (
            <div className="prompt-suggestions" aria-label="Suggested prompts">
              {prompts.map((p) => (
                <button
                  type="button"
                  disabled={!!busy || !state}
                  key={p}
                  onClick={() => void send(p)}
                >
                  {p}
                  <ArrowUp size={13} aria-hidden="true" />
                </button>
              ))}
            </div>
          )}
          <form
            className="composer"
            onSubmit={(e) => {
              e.preventDefault();
              void send(message);
            }}
          >
            <label className="sr-only" htmlFor="chat-message">
              Message {name} about {job.profile?.name}
            </label>
            <textarea
              id="chat-message"
              ref={composerRef}
              placeholder={`Ask ${name} about ${job.profile?.name}…`}
              value={message}
              maxLength={MESSAGE_LIMIT}
              onChange={(e) => setMessage(e.target.value)}
              rows={1}
              enterKeyHint="send"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  void send(message);
                }
              }}
            />
            <button
              type="submit"
              aria-label={busy === "chat" ? `${name} is replying` : "Send message"}
              disabled={!state || !!busy || !message.trim()}
            >
              {busy === "chat" ? (
                <LoaderCircle size={18} className="spin" aria-hidden="true" />
              ) : (
                <ArrowUp size={18} aria-hidden="true" />
              )}
            </button>
          </form>
          <p className="composer-note">
            Live AI tool calls. Snapshot prices. Demo orders, never charged.
          </p>
        </div>
      </main>
    </div>
  );
}
