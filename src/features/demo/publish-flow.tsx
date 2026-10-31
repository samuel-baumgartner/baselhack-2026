"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DEMO_SOURCE_URL,
  DEMO_SOURCE_NAME,
  type BusinessProfile,
} from "@/lib/contracts";
import type { DemoSnapshot } from "@/server/services/snapshot";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCheck,
  Code2,
  Globe,
  Loader2,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Eyebrow } from "./components";

import type { Act } from "./types";
export function PublishFlow({
  state,
  act,
  pending,
  onNext,
}: {
  state: DemoSnapshot;
  act: Act;
  pending: string | null;
  onNext: () => void;
}) {
  const [url, setUrl] = useState("");
  const busy =
    !!state.run &&
    ["queued", "fetching", "extracting"].includes(state.run.status);
  const steps = [
    { id: "fetching", label: "Read source page" },
    { id: "extracting", label: "Extract verified facts" },
    { id: "needs_review", label: "Owner review" },
  ];
  return (
    <>
      <Eyebrow>01 / Publish your presence</Eyebrow>
      <h1 className="mt-3 max-w-lg text-[34px] leading-[1.14] font-semibold tracking-[-1.2px] md:text-[42px]">
        Your website.
        <br />
        <span className="text-primary">Ready for the next web.</span>
      </h1>
      <p className="mt-4 max-w-lg text-sm leading-7 text-muted-foreground">
        Give agents the facts they need, and a way to do business with you.
        Start with the website you already have.
      </p>
      {state.version ? (
        <div className="mt-8 rounded-2xl border border-primary/20 bg-white p-6">
          <div className="flex size-10 items-center justify-center rounded-full bg-accent">
            <CheckCheck className="size-5 text-primary" />
          </div>
          <h2 className="mt-5 text-xl font-semibold">
            A presence people and agents can use.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Your approved facts now power a public business page, structured
            profile and commerce tools. You keep control of the offers.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {[
              ["Human presence", `/customers/${state.tenant.slug}`, Globe],
              [
                "Business JSON",
                `/customers/${state.tenant.slug}/business.json`,
                Code2,
              ],
            ].map(([label, href, Icon]) => {
              const I = Icon as typeof Globe;
              return (
                <a
                  key={String(label)}
                  href={String(href)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-lg border px-3 py-3 text-xs font-medium hover:bg-muted"
                >
                  <I className="size-3.5 text-primary" />
                  {String(label)}
                  <ArrowUpRight className="ml-auto size-3" />
                </a>
              );
            })}
          </div>
          <Button onClick={onNext} className="mt-6 h-11 gap-3 px-5">
            Open the traveller’s Grok chat
            <ArrowRight className="size-4" />
          </Button>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Next, continue as Alex, the traveller, in the Grok demo.
          </p>
          <p className="mt-4 text-[10px] text-muted-foreground">
            Approved version {state.version.id.slice(0, 8)} ·{" "}
            {state.run?.provider}
          </p>
        </div>
      ) : (
        <>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void act({
                action: "onboard",
                url: url || DEMO_SOURCE_URL,
              });
            }}
            className="mt-8 rounded-2xl border bg-white p-5 md:p-6"
          >
            <label htmlFor="source-url" className="text-xs font-medium">
              Business website
            </label>
            <div className="mt-3 flex gap-2">
              <div className="relative min-w-0 flex-1">
                <Globe className="absolute top-3 left-3 size-4 text-muted-foreground" />
                <Input
                  id="source-url"
                  placeholder="https://your-business.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="h-11 bg-background/60 pl-9 text-xs"
                  disabled={busy}
                />
              </div>
              <Button
                type="submit"
                className="h-11 gap-2 px-4 text-xs"
                disabled={busy || !!pending}
              >
                {busy ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ArrowRight className="size-4" />
                )}
                <span className="hidden sm:inline">
                  {busy ? "Reading…" : "Read website"}
                </span>
              </Button>
            </div>
            <button
              type="button"
              onClick={() => setUrl(DEMO_SOURCE_URL)}
              className="mt-3 text-[10px] text-primary underline-offset-4 hover:underline"
            >
              Try {DEMO_SOURCE_NAME}’s website
              <ArrowUpRight className="ml-1 inline size-3" />
            </button>
            {busy && (
              <div className="mt-6 space-y-3 border-t pt-5" aria-live="polite">
                {steps.map((step, i) => {
                  const current = steps.findIndex(
                    (s) => s.id === state.run?.status,
                  );
                  return (
                    <div
                      key={step.id}
                      className="flex items-center gap-2.5 text-xs"
                    >
                      <span className="flex size-5 items-center justify-center">
                        {current > i ? (
                          <Check className="size-3.5 text-primary" />
                        ) : current === i ? (
                          <Loader2 className="size-3.5 animate-spin text-primary" />
                        ) : (
                          <span className="size-1.5 rounded-full bg-border" />
                        )}
                      </span>
                      <span
                        className={
                          current === i
                            ? "font-medium"
                            : "text-muted-foreground"
                        }
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
                <p className="pt-1 pl-7 text-[10px] text-muted-foreground">
                  Progress reflects the running job. Nothing publishes without
                  your approval.
                </p>
              </div>
            )}
            {state.run?.error && (
              <p
                role="alert"
                className="mt-4 text-xs leading-relaxed text-destructive"
              >
                {state.run.error}
              </p>
            )}
          </form>
          {state.run?.status === "needs_review" && state.run.profile ? (
            <PublishReview
              key={state.run.id}
              initial={state.run.profile}
              act={act}
              pending={pending}
            />
          ) : (
            !busy && (
              <div className="mt-8 grid gap-5 sm:grid-cols-3">
                {[
                  {
                    icon: Globe,
                    title: "One source",
                    text: "Bring the website you already have.",
                  },
                  {
                    icon: ShieldCheck,
                    title: "You approve",
                    text: "Check facts and set your boundaries.",
                  },
                  {
                    icon: Users,
                    title: "Two audiences",
                    text: "Serve people and agents together.",
                  },
                ].map(({ icon: Icon, title, text }) => (
                  <div key={title}>
                    <span className="flex size-8 items-center justify-center rounded-lg border bg-white">
                      <Icon className="size-3.5 text-primary" />
                    </span>
                    <h3 className="mt-3 text-xs font-semibold">{title}</h3>
                    <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                      {text}
                    </p>
                  </div>
                ))}
              </div>
            )
          )}
        </>
      )}
    </>
  );
}

function PublishReview({
  initial,
  act,
  pending,
}: {
  initial: BusinessProfile;
  act: Act;
  pending: string | null;
}) {
  const [profile, setProfile] = useState(initial);
  const [confirmed, setConfirmed] = useState(false);
  return (
    <div className="mt-6 rounded-2xl border bg-white p-5 md:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Your presence, for review</h2>
        <Badge variant="secondary" className="text-[9px]">
          Review before publishing
        </Badge>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        Facts were scraped from the public website. Review them before
        publishing this demo presence.
      </p>
      <div className="mt-5 space-y-4">
        <label className="block space-y-2 text-xs font-medium">
          Business name
          <Input
            aria-label="Business name"
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            className="mt-2"
          />
        </label>
        <label className="block space-y-2 text-xs font-medium">
          How agents describe you
          <Textarea
            aria-label="Business description"
            value={profile.description}
            onChange={(e) =>
              setProfile({ ...profile, description: e.target.value })
            }
            className="mt-2 min-h-24 text-xs leading-relaxed"
          />
        </label>
        <div className="rounded-xl border border-amber-200/70 bg-amber-50/60 p-4">
          <p className="text-xs font-semibold text-amber-900">
            Unknown policies stay unknown
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-amber-800">
            A meeting room or desk does not establish quiet workspace access
            after checkout. Unconfirmed dog, arrival and workspace policies must
            be requested in the demo offer.
          </p>
          <label className="mt-3 flex cursor-pointer items-start gap-2 text-xs leading-relaxed">
            <input
              type="checkbox"
              className="mt-0.5 accent-[#087b6b]"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            I have reviewed the extracted facts. Unconfirmed policies will be
            requested from the demo operator.
          </label>
        </div>
        <Button
          className="h-11 w-full"
          disabled={!confirmed || !!pending}
          onClick={() => {
            void act({
              action: "publish",
              profile,
            });
          }}
        >
          {pending === "publish" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ShieldCheck className="size-4" />
          )}
          Approve & publish presence
        </Button>
      </div>
    </div>
  );
}
