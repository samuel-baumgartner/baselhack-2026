"use client";
/* eslint-disable @next/next/no-img-element */
import { useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, ExternalLink, ArrowLeft, Download } from "lucide-react";
import { Header } from "./factory";
import { Button, CopyButton } from "./ui";
import { PlatformMark, platforms } from "./platforms";
import type { Job } from "@/lib/contracts";

export function Setup({ job, origin }: { job: Job; origin: string }) {
  const [tab, setTab] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const endpoint = job.generatedApp?.mcpUrl ?? `${origin}/apps/${job.id}/mcp`;
  const platform = platforms[tab];
  const native = tab === 0;

  // WAI-ARIA tabs: arrows move and select, Home/End jump. Focus follows.
  function onKeyDown(e: KeyboardEvent) {
    const last = platforms.length - 1;
    const next =
      e.key === "ArrowRight"
        ? tab === last ? 0 : tab + 1
        : e.key === "ArrowLeft"
          ? tab === 0 ? last : tab - 1
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? last
              : null;
    if (next === null) return;
    e.preventDefault();
    setTab(next);
    tabs.current[next]?.focus();
  }

  return (
    <div className="app-stage">
      <Header />
      <main className="setup-main">
        <Link href={`/build/${job.id}`} className="back-link">
          <ArrowLeft size={14} aria-hidden="true" />
          Back to your workspace
        </Link>
        {job.generatedApp && <section className="setup-content"><h2>Your independently built app</h2><p>Generated source passed TypeScript, domain tests, a production build and live MCP checks. It runs on your local machine. ChatGPT needs a public HTTPS deployment to connect directly.</p><a href={job.generatedApp.previewUrl} target="_blank" rel="noreferrer">Open local app <ArrowUpRight size={14} /></a><p><code>{job.generatedApp.mcpUrl}</code></p></section>}
        <div className="setup-intro">
          {job.profile?.name.toLowerCase() === "galaxus" && <span className="setup-merchant-wordmark"><img src="/merchants/galaxus/logo.svg" alt="Galaxus" width={125} height={22} /></span>}
          <p className="eyebrow">
            <Check size={12} aria-hidden="true" />A new dimension for {job.profile?.name}
          </p>
          <h1>
            Your business.
            <br />
            <span>Ready to be part of it.</span>
          </h1>
          <p>Everything you need to bring your experience into the conversation.</p>
        </div>
        <div className="setup-tabs" role="tablist" aria-label="Conversation host" onKeyDown={onKeyDown}>
          {platforms.map((p, i) => (
            <button
              type="button"
              id={`setup-tab-${p.id}`}
              role="tab"
              aria-selected={tab === i}
              aria-controls="setup-panel"
              tabIndex={tab === i ? 0 : -1}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              key={p.id}
              onClick={() => setTab(i)}
            >
              <PlatformMark platform={p.id} size={16} />
              {p.name}
            </button>
          ))}
        </div>
        <section
          id="setup-panel"
          role="tabpanel"
          aria-labelledby={`setup-tab-${platform.id}`}
          className="setup-content"
          tabIndex={0}
        >
          <span className="setup-status" data-native={native || undefined}>
            {native
              ? "Published · ChatGPT host connection unverified"
              : "Interactive visual preview · native connection not implemented"}
          </span>
          <h2>
            {native ? "One endpoint. A new conversation." : `Meet your ${platform.name} preview.`}
          </h2>
          <p>
            {native
              ? "Your MCP server and embedded app resource are published. Add the endpoint to a compatible host to try the experience. The private ChatGPT connector must still be tested in your account."
              : `Explore the ${platform.name}-style interface powered by PRISM’s shared shopping tools. This preview is not a native ${platform.name} integration and has no installation steps yet.`}
          </p>
          {native && (
            <>
              <div className="endpoint">
                <code>{endpoint}</code>
                <CopyButton value={endpoint} label="Copy endpoint" />
              </div>
              <ol className="setup-steps">
                <li>
                  Open ChatGPT’s app and connector settings in an account with developer-mode
                  custom MCP access.
                </li>
                <li>
                  Create a custom MCP connection with the endpoint above. This synthetic demo uses
                  no authentication.
                </li>
                <li>
                  Start a conversation with the app enabled. Try a prompt below and check that the
                  embedded view loads.
                </li>
              </ol>
              <p className="setup-footnote">
                Menu names and account availability can vary.{" "}
                <a
                  href="https://developers.openai.com/apps-sdk/deploy/connect-chatgpt"
                  target="_blank"
                  rel="noreferrer"
                >
                  Official connection guide
                  <ExternalLink size={11} aria-hidden="true" />
                </a>
              </p>
            </>
          )}
          <div className="setup-actions">
            <Button asChild>
              <Link href={`/build/${job.id}/preview/${platform.id}`}>
                Try the {platform.name} preview
                <ArrowUpRight size={15} aria-hidden="true" />
              </Link>
            </Button>
            {native && (
              <Button variant="outline" asChild>
                <a href={`/apps/${job.id}/widget`} target="_blank" rel="noreferrer">
                  Open standalone widget
                  <ArrowRight size={15} aria-hidden="true" />
                </a>
              </Button>
            )}
          </div>
        </section>
        {!!job.config?.suggestedPrompts?.length && (
          <section className="setup-prompts">
            <h3>A few ways to begin</h3>
            <ul>
              {job.config.suggestedPrompts.map((p) => (
                <li className="setup-prompt" key={p}>
                  <span>{p}</span>
                  <CopyButton value={p} />
                </li>
              ))}
            </ul>
          </section>
        )}
        <div className="setup-meta">
          <dl>
          <div>
            <dt>Experiences</dt>
            <dd>{job.selected.length}</dd>
          </div>
          <div>
            <dt>Published</dt>
            <dd>
              {new Date(job.publishedAt ?? job.createdAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </dd>
          </div>
          <div>
            <dt>Artifact</dt>
            <dd>
              <code>{job.artifactHash?.slice(0, 10)}</code>
            </dd>
          </div>
          </dl>
          <a href={`/companies/${job.profile?.slug}/instructions?build=${job.id}`}>
            <Download size={13} aria-hidden="true" />
            Download instructions
          </a>
        </div>
      </main>
    </div>
  );
}
