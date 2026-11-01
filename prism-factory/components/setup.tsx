"use client";
/* eslint-disable @next/next/no-img-element */
import { useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowUpRight,
  Check,
  ExternalLink,
  ArrowLeft,
  Download,
  Info,
} from "lucide-react";
import { Header } from "./factory";
import { Button, CopyButton } from "./ui";
import { PlatformMark, platforms } from "./platforms";
import {
  hasPublicHttpsEndpoint,
  platformConnection,
} from "@/lib/platform-targets";
import type { Job } from "@/lib/contracts";

export function Setup({ job, origin }: { job: Job; origin: string }) {
  const requested = useSearchParams().get("platform");
  const requestedIndex = Math.max(
    platforms.findIndex((p) => p.id === requested),
    0,
  );
  const [selection, setSelection] = useState({
    requested,
    index: requestedIndex,
  });
  const tab =
    selection.requested === requested ? selection.index : requestedIndex;
  const setTab = (index: number) => setSelection({ requested, index });
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const endpoint = `${origin}/apps/${job.id}/mcp`;
  const platform = platforms[tab];
  const native = platform.capability !== "preview";
  const connection = platformConnection(
    platform.id,
    endpoint,
    job.profile?.name ?? "Merchant",
  );
  const needsHttps =
    connection.requiresPublicHttps && !hasPublicHttpsEndpoint(endpoint);
  const hotel = job.profile?.industry === "hotel";
  function onKeyDown(e: KeyboardEvent) {
    const last = platforms.length - 1;
    const next =
      e.key === "ArrowRight"
        ? tab === last
          ? 0
          : tab + 1
        : e.key === "ArrowLeft"
          ? tab === 0
            ? last
            : tab - 1
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? last
              : null;
    if (next === null) return;
    e.preventDefault();
    setTab(next);
    tabs.current[next]?.focus();
    tabs.current[next]?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }
  return (
    <div className="app-stage">
      <Header />
      <main className="setup-main">
        <Link href={`/build/${job.id}`} className="back-link">
          <ArrowLeft size={14} aria-hidden="true" />
          Back to your workspace
        </Link>
        <div className="setup-intro">
          {(hotel || job.profile?.name.toLowerCase() === "galaxus") && (
            <span className="setup-merchant-wordmark">
              <img
                src={
                  hotel
                    ? "/merchants/krafft/logo.png"
                    : "/merchants/galaxus/logo.svg"
                }
                alt={job.profile?.name}
                width={125}
                height={hotel ? 38 : 22}
              />
            </span>
          )}
          <p className="eyebrow">
            <Check size={12} aria-hidden="true" />A new dimension for{" "}
            {job.profile?.name}
          </p>
          <h1>
            Your business.
            <br />
            <span>Part of the conversation.</span>
          </h1>
          <p>
            One merchant endpoint, with connection packages for the hosts that
            support it.
          </p>
        </div>
        <div
          className="setup-tabs"
          role="tablist"
          aria-label="Conversation host"
          onKeyDown={onKeyDown}
        >
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
          <div className="connection-capabilities">
            <span className="setup-status" data-native={native || undefined}>
              {platform.kind}
            </span>
            <span>
              {platform.channel === "developer"
                ? "Developer distribution"
                : "Personal assistant"}
            </span>
          </div>
          <h2>
            {native
              ? `Connect ${job.profile?.name} to ${platform.name}`
              : `${platform.name}: visual preview only`}
          </h2>
          <p>
            {platform.capability === "mcp-apps"
              ? "This host documents support for MCP tools and embedded app resources. The connection package is ready; installation and rendering in your account remain unverified."
              : platform.capability === "tools"
                ? "Expose the merchant’s structured tools in this host. This is a tools-only connection; PRISM does not claim a branded embedded view here."
                : "A native consumer-app connection is not implemented. You can explore PRISM’s visual shell, but it is not an installed integration."}
          </p>
          {platform.id === "gemini" && (
            <p className="connection-note">
              <Info size={15} aria-hidden="true" />
              <span>
                Limited preview: US-only eligible personal accounts, age 18+,
                English, Keep Activity enabled. Availability in Switzerland is
                not established.
              </span>
            </p>
          )}
          {platform.id === "goose" && (
            <p className="connection-note">
              <Info size={15} aria-hidden="true" />
              <span>
                Embedded app support is experimental in Goose Desktop. Verify it
                in your installed version.
              </span>
            </p>
          )}
          {needsHttps && (
            <p className="connection-note">
              <Info size={15} aria-hidden="true" />
              <span>
                This provider’s cloud connector needs a publicly reachable HTTPS
                endpoint. The current local/private address cannot be used
                there.
              </span>
            </p>
          )}
          {native && (
            <div className="endpoint">
              <code>{endpoint}</code>
              <CopyButton value={endpoint} label="Copy endpoint" />
            </div>
          )}
          <ol className="setup-steps">
            {connection.instructions.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
          {native && connection.mimeType !== "text/markdown" && (
            <details className="connection-config">
              <summary>View configuration</summary>
              <pre>
                <code>{connection.content}</code>
              </pre>
              <CopyButton
                value={connection.content}
                label="Copy configuration"
              />
            </details>
          )}
          <p className="setup-footnote">
            <a href={platform.docsUrl} target="_blank" rel="noreferrer">
              Official {platform.name} documentation
              <ExternalLink size={11} aria-hidden="true" />
            </a>
          </p>
          <div className="setup-actions">
            {native ? (
              <Button asChild>
                <a
                  href={`/apps/${job.id}/widget`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open merchant browser preview
                  <ArrowUpRight size={15} aria-hidden="true" />
                </a>
              </Button>
            ) : (
              <Button asChild>
                <Link href={`/build/${job.id}/preview/${platform.id}`}>
                  Open visual preview
                  <ArrowUpRight size={15} aria-hidden="true" />
                </Link>
              </Button>
            )}
            {native && (
              <Button variant="outline" asChild>
                <a href={`/api/jobs/${job.id}/integrations/${platform.id}`}>
                  <Download size={14} aria-hidden="true" />
                  {connection.mimeType === "text/markdown"
                    ? "Download setup guide"
                    : "Download configuration"}
                </a>
              </Button>
            )}
          </div>
        </section>
        {job.generatedApp && (
          <section className="setup-source-output">
            <div>
              <p className="eyebrow">INDEPENDENT SOURCE BUILD</p>
              <h2>Your built application</h2>
              <p>
                The generated TSX/CSS passed its own build and checks. This
                local source output is separate from the public
                configured-template endpoint above.
              </p>
            </div>
            <a
              href={job.generatedApp.previewUrl}
              target="_blank"
              rel="noreferrer"
            >
              Open local source app
              <ArrowUpRight size={14} aria-hidden="true" />
            </a>
            <code>{job.generatedApp.mcpUrl}</code>
          </section>
        )}
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
              <dt>Built</dt>
              <dd>
                {new Date(job.publishedAt ?? job.createdAt).toLocaleDateString(
                  "en-GB",
                  { day: "numeric", month: "short", year: "numeric" },
                )}
              </dd>
            </div>
            <div>
              <dt>Artifact</dt>
              <dd>
                <code>{job.artifactHash?.slice(0, 10)}</code>
              </dd>
            </div>
          </dl>
          <a
            href={`/companies/${job.profile?.slug}/instructions?build=${job.id}`}
          >
            <Download size={13} aria-hidden="true" />
            Download overview
          </a>
        </div>
      </main>
    </div>
  );
}
