"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  Check,
  ChevronDown,
  LoaderCircle,
  Search,
  ShoppingBag,
  Bell,
  Globe,
  ExternalLink,
  RotateCcw,
  X,
  CornerDownLeft,
} from "lucide-react";
import { Prism } from "./prism";
import { LandingPrism } from "./landing-prism";
import { Button, Input } from "./ui";
import { PlatformMark, platforms } from "./platforms";
import { requestJson, errorText } from "./request";
import { useStored, writeStored } from "./storage";
import { flows, flowIds, type Job, type FlowId, type Stage } from "@/lib/contracts";

const LAST_BUILD = "prism-last-build";
const plural = (n: number, one: string, many = `${one}s`) =>
  `${n} ${n === 1 ? one : many}`;

export function Header() {
  return (
    <header className="site-header">
      <Link href="/" className="brand" aria-label="PRISM home">
        <img src="/images/prism-mark-144-v2.png" className="brand-symbol" width={36} height={36} alt="" />
        <span>prism</span>
      </Link>
      <span className="header-caption">A new dimension of commerce</span>
      <a
        className="header-link"
        href="https://galaxus.prism.mvps.ch"
        target="_blank"
        rel="noreferrer"
      >
        Explore the example
        <ArrowUpRight size={14} aria-hidden="true" />
      </a>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Landing                                                             */
/* ------------------------------------------------------------------ */

function looksLikeWebsite(value: string) {
  const v = value.trim();
  return !/\s/.test(v) && /[a-z0-9-]\.[a-z]{2,}/i.test(v);
}

export function Landing() {
  const router = useRouter();
  const [url, setUrl] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const lock = useRef(false);
  const lastBuild = useStored(LAST_BUILD);
  async function create(value: string) {
    if (lock.current) return;
    if (!looksLikeWebsite(value)) {
      setError("Enter a website address, like galaxus.ch.");
      return;
    }
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const data = await requestJson<{ id: string }>("/api/jobs", {
        method: "POST",
        body: { url: value.trim() },
      });
      writeStored(LAST_BUILD, data.id);
      router.push(`/build/${data.id}`);
    } catch (e) {
      setError(errorText(e, "We couldn’t start your build. Try again."));
      setBusy(false);
      lock.current = false;
    }
  }
  return (
    <div className="landing">
      <Header />
      <main className="landing-main">
        <div className="landing-hero">
        <div className="landing-copy">
        <p className="eyebrow">
          <span className="eyebrow-dot" />
          A new dimension of commerce
        </p>
        <h1>
          Your business.
          <br />
          <span>Inside their AI.</span>
        </h1>
        <p className="landing-description">
          Bring your brand into the conversation. Turn your website into
          shopping experiences built for personal AI agents.
        </p>
        <div className="landing-form-wrap">
          <p className="landing-form-label">Start with your website</p>
          <form
            className="url-form"
            data-busy={busy || undefined}
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              void create(url);
            }}
          >
            <label className="url-label" htmlFor="company-url">
              <Globe size={18} aria-hidden="true" />
              <span className="sr-only">Company website</span>
            </label>
            <Input
              id="company-url"
              type="text"
              inputMode="url"
              autoComplete="url"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="go"
              placeholder="yourcompany.com"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (error) setError("");
              }}
              aria-invalid={!!error || undefined}
              aria-describedby={error ? "url-error" : undefined}
              readOnly={busy}
            />
            <Button
              type="submit"
              aria-label={busy ? "Starting your build" : "Build your experience"}
              disabled={busy || !url.trim()}
            >
              <span>{busy ? "Starting…" : "Build your experience"}</span>
              {busy ? (
                <LoaderCircle size={18} className="spin" aria-hidden="true" />
              ) : (
                <ArrowRight size={18} aria-hidden="true" />
              )}
            </Button>
          </form>
          <div className="try-row">
            {error ? (
              <p id="url-error" role="alert" className="field-error">
                {error}
              </p>
            ) : busy ? (
              <span role="status">
                Reading your website…
              </span>
            ) : lastBuild ? (
              <Link href={`/build/${lastBuild}`}>
                Continue your last build
                <ArrowRight size={12} aria-hidden="true" />
              </Link>
            ) : (
              <span>One link. A whole new relationship.</span>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setUrl("https://www.galaxus.ch");
                void create("https://www.galaxus.ch");
              }}
            >
              Try Galaxus
              <ArrowUpRight size={12} aria-hidden="true" />
            </button>
          </div>
        </div>
        </div>
        <LandingPrism active={busy} />
        </div>
        <section className="platform-strip" aria-label="Conversation hosts">
          <p>One brand. A world of conversations.</p>
          <ul>
            {platforms.map((p) => (
              <li key={p.id}>
                <PlatformMark platform={p.id} size={18} />
                {p.name}
              </li>
            ))}
          </ul>
        </section>
      </main>
      <footer className="site-footer">
        <span>One source. Many possibilities.</span>
        <span>Made for the agentic era</span>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Build                                                               */
/* ------------------------------------------------------------------ */

const flowShort: Record<FlowId, string> = {
  discover: "Discover",
  purchase: "Cart",
  updates: "Updates",
};
const terminal = (s?: Stage) => s === "ready" || s === "failed" || s === "cancelled";
const steps = [
  { stages: ["queued", "planning"], label: "Shape the experience" },
  { stages: ["reviewing", "revising"], label: "Give it a second look" },
  { stages: ["building"], label: "Bring the views to life" },
  { stages: ["checking"], label: "Check every connection" },
  { stages: ["publishing"], label: "Open the conversation" },
] as const;

function toggleFlow(current: FlowId[], id: FlowId, on: boolean): FlowId[] {
  const next = on
    ? [...current, id, ...(id === "purchase" ? (["discover"] as const) : [])]
    : current.filter((x) => x !== id && !(id === "discover" && x === "purchase"));
  return flowIds.filter((f) => next.includes(f));
}

export function Build({ id }: { id: string }) {
  const [job, setJob] = useState<Job | null>(null),
    [error, setError] = useState(""),
    [selected, setSelected] = useState<FlowId[]>([...flowIds]),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [stalled, setStalled] = useState(false),
    [activity, setActivity] = useState(false);
  const lock = useRef(false);
  const loadedRecommendations = useRef(false);
  const live = !terminal(job?.stage);

  useEffect(() => {
    if (!live) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const poll = async () => {
      clearTimeout(timer);
      let stage: Stage | undefined;
      try {
        const data = await requestJson<Job>(`/api/jobs/${id}`, {
          cache: "no-store",
        });
        if (!active) return;
        stage = data.stage;
        setJob(data);
        if (!loadedRecommendations.current && data.profile) {
          setSelected(data.profile.recommendedFlows ?? [...flowIds]);
          loadedRecommendations.current = true;
        }
        setError("");
        setStalled(
          !terminal(data.stage) &&
            data.stage !== "selection" &&
            Date.now() - new Date(data.updatedAt).getTime() > 30000,
        );
      } catch (e) {
        if (active) setError(errorText(e, "We couldn’t refresh this build."));
      }
      if (active && !terminal(stage))
        timer = setTimeout(poll, document.hidden ? 10000 : 1500);
    };
    const onVisible = () => {
      if (!document.hidden) void poll();
    };
    void poll();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      active = false;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [id, live]);

  async function send(path: "selection" | "action", body: object) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      setJob(
        await requestJson<Job>(`/api/jobs/${id}/${path}`, {
          method: "POST",
          body,
        }),
      );
    } catch (e) {
      setError(errorText(e, "That didn’t go through. Try again."));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  if (!job)
    return (
      <div className="app-stage">
        <Header />
        <main className="loading-stage">
          <Prism compact active={!error} />
          <h1>
            {error ? "We couldn’t open this build." : "Finding your perspective."}
          </h1>
          {error ? (
            <>
              <p role="alert">{error}</p>
              <Button asChild variant="outline">
                <Link href="/">Start a new build</Link>
              </Button>
            </>
          ) : (
            <LoaderCircle className="spin" aria-label="Loading" />
          )}
        </main>
      </div>
    );

  const profile = job.profile,
    host = new URL(job.url).hostname.replace(/^www\./, ""),
    name = profile?.name ?? host,
    phase =
      job.stage === "analyzing"
        ? "analysis"
        : job.stage === "selection"
          ? "selection"
          : "workspace";

  return (
    <div className="app-stage">
      <Header />
      <main className="factory-main">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link href="/">
            <ArrowLeft size={14} aria-hidden="true" />
            New build
          </Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{name}</span>
          <span className="build-id">Build {id.slice(0, 6)}</span>
        </nav>
        <div className="phase" key={phase}>
          {phase === "analysis" ? (
            <Analysis job={job} stalled={stalled} />
          ) : phase === "selection" ? (
            <Selection
              job={job}
              selected={selected}
              notice={notice}
              busy={busy}
              onToggle={(flow, on) => {
                const next = toggleFlow(selected, flow, on);
                setSelected(next);
                setNotice(
                  !on && flow === "discover" && selected.includes("purchase")
                    ? "Purchasing needs discovery, so it was removed too."
                    : on && flow === "purchase" && !selected.includes("discover")
                      ? "Discovery was added. Purchasing builds on it."
                      : "",
                );
              }}
              onSubmit={() => void send("selection", { selected })}
            />
          ) : (
            <Workspace
              job={job}
              busy={busy}
              stalled={stalled}
              activity={activity}
              onActivity={() => setActivity((v) => !v)}
              onAction={(action) => void send("action", { action })}
            />
          )}
        </div>
        {error && (
          <p className="field-error page-error" role="alert">
            {error}
          </p>
        )}
      </main>
      <footer className="site-footer">
        <span>Made with a little refraction.</span>
        <span>PRISM · Agentic commerce</span>
      </footer>
    </div>
  );
}

function Analysis({ job, stalled }: { job: Job; stalled: boolean }) {
  const last = job.events.at(-1);
  return (
    <section className="analysis-stage">
      <p className="eyebrow">
        <span className="eyebrow-dot" />A closer look at your business
      </p>
      <Prism compact active />
      <h1>
        Every website has
        <br />a conversation inside.
      </h1>
      <div className="analysis-pill" role="status">
        <LoaderCircle size={14} className="spin" aria-hidden="true" />
        {last?.title ?? "Reading your website"}
      </div>
      {last?.detail && <p className="analysis-detail">{last.detail}</p>}
      {stalled && (
        <p className="analysis-detail">
          Waiting for the local builder. Your request is saved.
        </p>
      )}
    </section>
  );
}

function Selection({
  job,
  selected,
  notice,
  busy,
  onToggle,
  onSubmit,
}: {
  job: Job;
  selected: FlowId[];
  notice: string;
  busy: boolean;
  onToggle: (flow: FlowId, on: boolean) => void;
  onSubmit: () => void;
}) {
  const profile = job.profile;
  const count = selected.length;
  return (
    <>
      <div className="section-intro">
        <p className="eyebrow">A new perspective for {profile?.name}</p>
        <h1>
          Your next customer.
          <br />
          <span>Already in the conversation.</span>
        </h1>
        <p>
          We found three ways to bring your business closer. Choose the
          experiences you want to create.
        </p>
      </div>
      <div className="company-strip">
        <span
          className="company-monogram"
          data-merchant={profile?.name.toLowerCase()}
          style={{ "--accent": profile?.accent } as CSSProperties}
          aria-hidden="true"
        >
          {profile?.name.toLowerCase() === "galaxus" ? <img src="/merchants/galaxus/icon.svg" alt="" width={30} height={30} /> : profile?.name.slice(0, 1)}
        </span>
        <div>
          <strong>{profile?.name}</strong>
          <span>{new URL(job.url).hostname}</span>
        </div>
        <span className="source-label">
          <Check size={12} aria-hidden="true" />
          {profile?.source === "curated-demo"
            ? "Curated demo catalog"
            : "Website researched"}
        </span>
        <span className="industry-label">{profile?.industry}</span>
      </div>
      <fieldset className="flow-grid" disabled={busy}>
        <legend className="sr-only">Experiences to build</legend>
        {flows.map((f, i) => {
          const checked = selected.includes(f.id);
          const required = f.id === "discover" && selected.includes("purchase");
          return (
            <label
              className="flow-card"
              data-checked={checked || undefined}
              key={f.id}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={checked}
                aria-labelledby={`flow-${f.id}-title`}
                aria-describedby={`flow-${f.id}-desc`}
                onChange={(e) => onToggle(f.id, e.target.checked)}
              />
              <span className="flow-top">
                <span>
                  0{i + 1} · {f.label}
                </span>
                <span className="checkbox-visual" aria-hidden="true">
                  <Check size={12} strokeWidth={2.5} />
                </span>
              </span>
              <FlowIllustration kind={i} />
              <span className="flow-copy">
                <span className="flow-title" id={`flow-${f.id}-title`}>
                  {f.title}
                  {required && <em className="flow-tag">Needed for purchasing</em>}
                </span>
                <span className="flow-description" id={`flow-${f.id}-desc`}>
                  {f.description}
                </span>
                <span className="flow-prompt">
                  <CornerDownLeft size={12} aria-hidden="true" />“{f.prompt}”
                </span>
              </span>
            </label>
          );
        })}
      </fieldset>
      <div className="selection-footer">
        <div>
          <p className="selected-count" aria-live="polite">
            {count
              ? `${plural(count, "experience")} selected`
              : "Choose at least one experience"}
          </p>
          <p>
            {notice ||
              (selected.includes("purchase")
                ? "Orders are simulated. No payment is ever taken."
                : `Branded for ${profile?.name}. Built for conversation.`)}
          </p>
        </div>
        <Button disabled={busy || !count} onClick={onSubmit}>
          {busy ? (
            <>
              <LoaderCircle className="spin" size={16} aria-hidden="true" />
              Starting your build…
            </>
          ) : (
            <>
              Build {count > 1 ? plural(count, "experience") : "this experience"}
              <ArrowRight size={16} aria-hidden="true" />
            </>
          )}
        </Button>
      </div>
      <details className="evidence">
        <summary>
          What we learned
          <ChevronDown size={14} aria-hidden="true" />
        </summary>
        <div className="evidence-body">
          <p>{profile?.description}</p>
          {profile?.evidence.map((e) => <p key={e}>{e}</p>)}
          <a href={job.url} target="_blank" rel="noreferrer">
            View source website
            <ExternalLink size={12} aria-hidden="true" />
          </a>
        </div>
      </details>
    </>
  );
}

function Workspace({
  job,
  busy,
  stalled,
  activity,
  onActivity,
  onAction,
}: {
  job: Job;
  busy: boolean;
  stalled: boolean;
  activity: boolean;
  onActivity: () => void;
  onAction: (action: "retry" | "cancel") => void;
}) {
  const ready = job.stage === "ready",
    failed = job.stage === "failed" || job.stage === "cancelled",
    profile = job.profile,
    last = job.events.at(-1);
  const current = ready
    ? steps.length
    : steps.findIndex((s) => (s.stages as readonly Stage[]).includes(job.stage));
  const status = ready
    ? "Published"
    : failed
      ? job.stage === "cancelled"
        ? "Stopped"
        : "Paused"
      : stalled
        ? "Waiting for the local builder. Your request is saved."
        : (last?.title ?? "Waiting for the builder");
  return (
    <>
      <div className="workspace-intro">
        <div>
          <p className="eyebrow">
            {ready
              ? "Your business has a new dimension"
              : failed
                ? "Let’s get this back on track"
                : `Building for ${profile?.name}`}
          </p>
          <h1>
            {ready ? (
              <>
                Ready for a<br />
                <span>different conversation.</span>
              </>
            ) : failed ? (
              <>
                A pause.
                <br />
                <span>Not the end.</span>
              </>
            ) : (
              <>
                One source.
                <br />
                <span>New possibilities.</span>
              </>
            )}
          </h1>
          <p>
            {ready
              ? "Your ChatGPT app is published. Three platform previews are ready to try."
              : failed
                ? (job.error ??
                  "This build was stopped. Your selected experiences are saved.")
                : "A little thought. A second look. Then your business, brought to life."}
          </p>
        </div>
        <div className="workspace-prism">
          <Prism compact active={!ready && !failed} />
        </div>
      </div>
      {!failed && (
        <ol
          className="pipeline"
          aria-label="Build progress"
          style={{ "--progress": Math.max(current, 0) / steps.length } as CSSProperties}
        >
          {steps.map((s, i) => {
            const state = i < current ? "complete" : i === current ? "current" : "upcoming";
            return (
              <li
                key={s.label}
                data-state={state}
                aria-current={state === "current" ? "step" : undefined}
              >
                <span className="step-dot" aria-hidden="true">
                  {state === "complete" ? (
                    <Check size={12} strokeWidth={2.5} />
                  ) : state === "current" ? (
                    <LoaderCircle size={12} className="spin" />
                  ) : (
                    i + 1
                  )}
                </span>
                <span>
                  {s.label}
                  <span className="sr-only">
                    {state === "complete" ? ", done" : state === "current" ? ", in progress" : ""}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
      )}
      <div className="integration-grid" aria-busy={!ready && !failed}>
        <ChatGPTCard job={job} ready={ready} status={status} />
        {platforms.slice(1).map((p) => (
          <article
            key={p.id}
            className="integration-card small-integration"
            data-platform={p.id}
            data-ready={ready || undefined}
          >
            <div className="integration-header">
              <h2>
                <PlatformMark platform={p.id} size={18} />
                {p.name}
              </h2>
              <Status ready={ready} label="Preview" />
            </div>
            <div className="host-miniature" aria-hidden="true">
              <span className="mini-bubble">{p.line}</span>
              <span className="mini-merchant">
                {profile?.name.toLowerCase() === "galaxus" ? <img className="mini-merchant-logo" src="/merchants/galaxus/icon.svg" alt="" width={22} height={22} /> : <i style={{ background: profile?.accent }} />}
                {profile?.name}
                <small>
                  {job.selected.map((f) => flowShort[f]).join(" · ")}
                </small>
              </span>
            </div>
            <div className="integration-footer">
              {ready ? (
                <Link
                  className="stretched-link"
                  href={`/build/${job.id}/preview/${p.id}`}
                >
                  Open {p.name} preview
                  <ArrowUpRight size={15} aria-hidden="true" />
                </Link>
              ) : (
                <span>{failed ? "Waiting for your build" : "Shared experience assembling"}</span>
              )}
            </div>
          </article>
        ))}
      </div>
      <div className="workspace-bottom">
        <button
          type="button"
          className="activity-toggle"
          aria-expanded={activity}
          aria-controls="build-activity"
          onClick={onActivity}
        >
          <span className="status-light" data-done={ready || undefined} />
          {ready ? "Every detail, considered" : "Build activity"}
          <span className="activity-count">{job.events.length}</span>
          <ChevronDown size={14} aria-hidden="true" />
        </button>
        {ready ? (
          <Button asChild>
            <Link href={`/companies/${profile?.slug}?build=${job.id}`}>
              Connection instructions
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </Button>
        ) : failed ? (
          <Button onClick={() => onAction("retry")} disabled={busy}>
            {busy ? (
              <LoaderCircle size={16} className="spin" aria-hidden="true" />
            ) : (
              <RotateCcw size={16} aria-hidden="true" />
            )}
            {busy ? "Resuming…" : "Resume build"}
          </Button>
        ) : (
          <Button variant="ghost" onClick={() => onAction("cancel")} disabled={busy}>
            {busy ? (
              <LoaderCircle size={14} className="spin" aria-hidden="true" />
            ) : (
              <X size={14} aria-hidden="true" />
            )}
            {busy ? "Stopping…" : "Stop build"}
          </Button>
        )}
      </div>
      <div id="build-activity" className="activity-panel" hidden={!activity}>
        <ol>
          {job.events.map((e) => (
            <li key={e.sequence}>
              <span className="event-dot" aria-hidden="true" />
              <div>
                <strong>{e.title}</strong>
                <p>{e.detail}</p>
              </div>
              <time dateTime={e.at}>
                {new Date(e.at).toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
            </li>
          ))}
        </ol>
        {job.plan && (
          <details>
            <summary>
              Build plan
              <ChevronDown size={14} aria-hidden="true" />
            </summary>
            <p>{job.plan.summary}</p>
            <ol className="plan-steps">
              {job.plan.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </details>
        )}
        {job.review && (
          <details>
            <summary>
              Independent review
              <ChevronDown size={14} aria-hidden="true" />
            </summary>
            <p>{job.review.summary}</p>
            {job.review.issues.map((s) => (
              <p key={s}>{s}</p>
            ))}
          </details>
        )}
      </div>
    </>
  );
}

const miniProducts = [
  { src: "43103281.jpg", brand: "Nothing", name: "Ear (a)", price: "CHF 55.00" },
  { src: "61065156.jpg", brand: "Samsung", name: "Galaxy Buds3 FE", price: "CHF 91.90" },
  { src: "67247923.avif", brand: "Samsung", name: "Galaxy Buds4 Pro", price: "CHF 160.00" },
];

function ChatGPTCard({
  job,
  ready,
  status,
}: {
  job: Job;
  ready: boolean;
  status: string;
}) {
  const profile = job.profile;
  return (
    <article
      className="integration-card chatgpt-card"
      data-ready={ready || undefined}
    >
      <div className="integration-header">
        <h2>
          <PlatformMark platform="chatgpt" size={18} />
          ChatGPT
          <span className="integration-kind">Apps SDK · MCP</span>
        </h2>
        <Status ready={ready} label="Published" />
      </div>
      <div
        className="mini-chat"
        aria-hidden="true"
        style={{ "--merchant-accent": profile?.accent } as CSSProperties}
      >
        <div className="mini-user">Find me something for studying.</div>
        <div className="mini-assistant">
          <PlatformMark platform="chatgpt" size={16} />
          <span>Here are quiet options from {profile?.name}.</span>
        </div>
        <div className="mini-shop" data-merchant={profile?.name.toLowerCase()}>
          <div className="mini-shop-header">
            {profile?.name === "Galaxus" ? (
              <img src="/merchants/galaxus/logo.svg" alt="" width={84} height={15} />
            ) : (
              <strong>{profile?.name}</strong>
            )}
            <span>Demo store · no charge</span>
          </div>
          <div className="mini-shop-nav"><span className="mini-tab-active">Headphones</span><span>News + Trends</span>{job.selected.includes("purchase") && <span>Cart · 0</span>}</div>
          <div className="mini-catalog-heading"><span>Audio › Headphones</span><strong>Headphones</strong></div>
          <div className="mini-filters"><span>Noise cancelling⌄</span><span>Wireless⌄</span><span>Up to CHF 250⌄</span></div>
          <div className="mini-results">3 of 5 products · Price: low to high</div>
          <div className="mini-products">
            {miniProducts.map((p) => (
              <div key={p.src}>
                <img
                  src={`/merchants/galaxus/${p.src}`}
                  width="120"
                  height="96"
                  alt=""
                />
                <strong>{p.price}</strong>
                <span><b>{p.brand}</b> {p.name}</span>
                {job.selected.includes("purchase") && <em>+ Add to cart</em>}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="integration-footer">
        {ready ? (
          <>
            {job.generatedApp ? <a href={job.generatedApp.previewUrl} target="_blank" rel="noreferrer">Open built app <ArrowUpRight size={15} aria-hidden="true" /></a> : <span>Host connection unverified</span>}
            <Link
              className="stretched-link"
              href={`/build/${job.id}/preview/chatgpt`}
            >
              Try the experience
              <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          </>
        ) : (
          <span className="integration-status" role="status">
            {status}
          </span>
        )}
      </div>
    </article>
  );
}

function Status({ ready, label }: { ready: boolean; label: string }) {
  return (
    <span className="target-status" data-ready={ready || undefined}>
      {ready ? (
        <Check size={12} strokeWidth={2.5} aria-hidden="true" />
      ) : (
        <span className="status-light" aria-hidden="true" />
      )}
      {ready ? label : "Preparing"}
    </span>
  );
}

function FlowIllustration({ kind }: { kind: number }) {
  return (
    <span className={`flow-illustration illustration-${kind}`} aria-hidden="true">
      {kind === 0 ? (
        <>
          <span className="illustration-search">
            <Search size={11} />A quieter way to study
          </span>
          <span className="illustration-products">
            <img src="/merchants/galaxus/43103281.jpg" width="80" height="76" alt="" />
            <img src="/merchants/galaxus/61065156.jpg" width="80" height="76" alt="" />
          </span>
          <span className="illustration-chips">
            <span>Under CHF 100</span>
            <span>Noise cancelling</span>
          </span>
        </>
      ) : kind === 1 ? (
        <span className="illustration-order">
          <ShoppingBag size={18} />
          <span>Your next good choice</span>
          <span className="illustration-line">
            <span>Nothing Ear (a)</span>
            <strong>55.–</strong>
          </span>
          <span className="illustration-order-btn">
            Make it yours
            <ArrowRight size={11} />
          </span>
        </span>
      ) : (
        <span className="illustration-update">
          <span className="illustration-update-top">
            <Bell size={13} />A little more worth knowing
            <span className="notification-dot" />
          </span>
          <strong>Your audio edit.</strong>
          <span className="illustration-update-copy">
            A quieter commute, without overspending.
          </span>
          <span className="illustration-read">
            Read the story
            <ArrowRight size={11} />
          </span>
        </span>
      )}
    </span>
  );
}
