"use client";

import "./grok-theme.css";
import { Button } from "@/components/ui/button";
import { cn, money } from "@/lib/utils";
import type { DemoSnapshot } from "@/server/services/snapshot";
import {
  ArrowDown,
  Bell,
  Check,
  CheckCircle2,
  Loader2,
  MessageSquare,
  ShieldCheck,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { OfferCard } from "./components";
import { RequestComposer } from "./request-composer";
import { RoleSwitcher } from "./role-switcher";
import type { Act } from "./types";
import { useDemo } from "./use-demo";

function GrokMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M25.6 6.7A13 13 0 1 0 28.8 20M25.5 3.5 13.2 18.8H21L8.5 29"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GrokMessage({
  children,
  label = "Grok",
}: {
  children: React.ReactNode;
  label?: string;
}) {
  return (
    <article className="flex gap-3 sm:gap-4">
      <GrokMark className="mt-0.5 size-7 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="mb-3 text-sm font-semibold">{label}</p>
        {children}
      </div>
    </article>
  );
}

export function GrokWorkspace() {
  const { state, error, connected, pending, act, clearError } = useDemo();
  const scroll = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true);
  const hasConversation =
    !!state?.messages.length || !!state?.inquiry || !!state?.reservation;
  const busy =
    state?.messages.some((message) => message.state === "running") ?? false;
  const bookMessages =
    state?.messages.filter((message) => message.chapter === "book") ?? [];
  const updates =
    state?.messages.filter((message) => message.chapter === "reconnect") ?? [];
  const ownerHref = state?.reservation
    ? "/owner?chapter=reconnect"
    : state?.inquiry
      ? "/owner?chapter=book"
      : "/owner";
  const progress = [
    state?.messages.length,
    state?.offer?.id,
    state?.reservation?.id,
    state?.subscription?.active,
    state?.inquiry?.mailStatus,
  ].join(":");
  useEffect(() => {
    if (hasConversation && nearBottom.current && scroll.current)
      scroll.current.scrollTo({
        top: scroll.current.scrollHeight,
        behavior: "smooth",
      });
  }, [progress, hasConversation]);

  return (
    <div className="grok-demo flex h-dvh overflow-hidden bg-background text-foreground">
      <aside className="hidden w-[238px] shrink-0 flex-col border-r border-white/5 bg-[#101012] px-4 py-6 lg:flex">
        <Link
          href="/traveller"
          className="flex items-center gap-3 px-3 text-2xl font-semibold tracking-tight"
          aria-label="Grok demo home"
        >
          <GrokMark className="size-8" />
          Grok
        </Link>
        <p className="mt-12 px-3 text-xs text-muted-foreground">
          Your conversations
        </p>
        <Link
          href="/traveller"
          aria-current="page"
          className="mt-3 flex items-center gap-3 rounded-xl bg-white/8 px-3 py-3 text-sm"
        >
          <MessageSquare className="size-4" />A stay in Basel
        </Link>
        <div className="mt-auto flex items-center gap-3 rounded-xl border border-white/8 p-3">
          <span className="flex size-9 items-center justify-center rounded-full bg-[#353539] text-sm font-medium">
            A
          </span>
          <div>
            <p className="text-sm font-medium">Alex</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Traveller
            </p>
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-[76px] shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/5 px-4 py-3 sm:px-8">
          <div className="flex items-center gap-2.5">
            <GrokMark className="size-6 lg:hidden" />
            <span className="text-lg font-semibold tracking-tight">Grok</span>
            <span className="rounded-full border px-2 py-0.5 text-[10px] text-muted-foreground">
              Demo mock
            </span>
          </div>
          <RoleSwitcher actor="traveller" ownerHref={ownerHref} />
        </header>
        <div
          ref={scroll}
          onScroll={() => {
            const element = scroll.current;
            if (element)
              nearBottom.current =
                element.scrollHeight -
                  element.scrollTop -
                  element.clientHeight <
                160;
          }}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
        >
          <main
            className={cn(
              "mx-auto w-full max-w-[820px] px-4 py-8 sm:px-8 sm:py-12",
              !hasConversation &&
                "flex min-h-full flex-col justify-center py-5 sm:py-6",
            )}
          >
            {error && (
              <div
                role="alert"
                className="mb-8 flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
              >
                <p className="flex-1">{error}</p>
                <button onClick={clearError} aria-label="Dismiss error">
                  <X className="size-4" />
                </button>
              </div>
            )}
            {!state ? (
              <div
                role="status"
                className="flex items-center justify-center gap-3 py-20 text-sm text-muted-foreground"
              >
                <Loader2 className="size-4 animate-spin" />
                Opening your conversation…
              </div>
            ) : (
              <>
                {!hasConversation && (
                  <div className="mb-3 text-center">
                    <GrokMark className="mx-auto mb-4 size-10" />
                    <h1 className="text-3xl font-medium tracking-tight sm:text-[40px]">
                      Where are we going?
                    </h1>
                    <p className="mt-4 text-sm leading-7 text-muted-foreground">
                      Tell me what you need. I’ll take care of the conversation.
                    </p>
                  </div>
                )}
                {!state.version ? (
                  <div className="mt-7 rounded-2xl border bg-card p-5 text-sm leading-7 text-muted-foreground">
                    Start with{" "}
                    <span className="font-medium text-foreground">
                      Hotel owner
                    </span>{" "}
                    at the top right and connect a website. Then come back here
                    to arrange your stay.
                  </div>
                ) : (
                  <>
                    <div
                      className="space-y-8"
                      aria-label="Conversation with Grok"
                    >
                      {bookMessages.map((message) =>
                        message.role === "user" ? (
                          <article
                            key={message.id}
                            className="ml-auto max-w-[90%] rounded-3xl bg-[#2b2b2f] px-5 py-4 sm:max-w-[85%]"
                          >
                            <p className="mb-2 text-xs font-medium text-muted-foreground">
                              You
                            </p>
                            <p className="text-sm leading-7 whitespace-pre-wrap">
                              {message.text}
                            </p>
                          </article>
                        ) : (
                          <GrokMessage key={message.id}>
                            <p className="text-sm leading-7 whitespace-pre-wrap">
                              {message.text}
                            </p>
                            {message.state === "failed" && (
                              <p className="mt-2 text-xs text-destructive">
                                I couldn’t finish that step. Please try again
                                from the hotel workspace.
                              </p>
                            )}
                          </GrokMessage>
                        ),
                      )}
                      {busy && (
                        <div
                          role="status"
                          className="flex items-center gap-3 text-sm text-muted-foreground"
                        >
                          <Loader2 className="size-4 animate-spin" />
                          Grok is checking the hotel and arranging your request…
                        </div>
                      )}
                      {state.inquiry && !state.offer && !state.reservation && (
                        <GrokMessage>
                          <InquiryStatus
                            state={state}
                            act={act}
                            pending={pending}
                          />
                        </GrokMessage>
                      )}
                      {state.offer && !state.reservation && (
                        <GrokMessage>
                          <p className="mb-4 text-sm leading-7">
                            {state.tenant.name} has approved an offer. Here are
                            the exact terms. Nothing is booked until you
                            approve.
                          </p>
                          <OfferCard
                            key={state.offer.id}
                            state={state}
                            pending={pending === "accept"}
                            onAccept={() => {
                              void act({
                                action: "accept",
                                offerId: state.offer!.id,
                                idempotencyKey: crypto.randomUUID(),
                              });
                            }}
                          />
                        </GrokMessage>
                      )}
                      {state.reservation && (
                        <GrokMessage>
                          <div className="rounded-2xl border bg-card p-5">
                            <div className="flex items-center gap-2 text-sm font-semibold">
                              <CheckCircle2 className="size-5" />
                              Your stay is confirmed.
                            </div>
                            <p className="mt-3 text-sm text-muted-foreground">
                              {state.tenant.name} ·{" "}
                              {money(state.reservation.totalMinor)}
                            </p>
                            <p className="mt-3 text-2xl font-semibold tracking-tight">
                              {state.reservation.reference}
                            </p>
                            <p className="mt-3 text-xs leading-6 text-muted-foreground">
                              Both sides approved the same terms. This is a demo
                              reservation in fictional inventory. No payment was
                              taken.
                            </p>
                          </div>
                        </GrokMessage>
                      )}
                      {state.reservation && (
                        <GrokMessage>
                          <FollowHotel
                            state={state}
                            act={act}
                            pending={pending}
                          />
                        </GrokMessage>
                      )}
                      {updates.map((message) => (
                        <GrokMessage
                          key={message.id}
                          label="Grok · An update for you"
                        >
                          <div className="rounded-2xl border bg-card p-5">
                            <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                              <Bell className="size-4" />
                              From a hotel you chose to follow
                            </div>
                            <p className="text-sm leading-7">{message.text}</p>
                            <p className="mt-4 text-[11px] text-muted-foreground">
                              Checked against your interests and consent.
                              Nothing has been booked.
                            </p>
                          </div>
                        </GrokMessage>
                      ))}
                    </div>
                    {!state.inquiry && !hasConversation && (
                      <RequestComposer
                        submitLabel="Send to Grok"
                        disabled={busy || !!pending}
                        onSend={(prompt) => {
                          void act({ action: "request", prompt });
                        }}
                      />
                    )}
                  </>
                )}
                {hasConversation && (
                  <p className="mt-10 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
                    <ShieldCheck className="size-3.5" />
                    Your agent asks before committing you to an offer.
                  </p>
                )}
              </>
            )}
          </main>
        </div>
        <footer className="flex shrink-0 flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t border-white/5 px-4 py-3 text-center text-[10px] text-muted-foreground">
          <span>Grok demo mock · Fictional inventory · No real payment</span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className={cn(
                "size-1.5 rounded-full",
                connected ? "bg-emerald-400" : "bg-amber-400",
              )}
            />
            {connected ? "Connected" : "Connecting"}
          </span>
        </footer>
      </div>
    </div>
  );
}

function InquiryStatus({
  state,
  act,
  pending,
}: {
  state: DemoSnapshot;
  act: Act;
  pending: string | null;
}) {
  const inquiry = state.inquiry!;
  const failed = inquiry.mailStatus === "queued" && !!inquiry.error;
  return (
    <div className="rounded-2xl border bg-card p-5">
      <p className="text-sm font-medium">
        {failed
          ? "The email couldn’t be sent yet."
          : inquiry.replyText
            ? "The hotel replied. I’m waiting for its approved offer."
            : inquiry.mailStatus === "queued"
              ? "I’m sending your request to the hotel."
              : "Your request is with the hotel."}
      </p>
      <p className="mt-2 text-sm leading-7 text-muted-foreground">
        {failed
          ? "Your request is saved. I can try sending it again."
          : "I’ll bring the offer back here when it is ready. You’ll review the exact price before booking."}
      </p>
      {failed && (
        <Button
          className="mt-4"
          size="sm"
          variant="outline"
          disabled={!!pending}
          onClick={() => {
            void act({ action: "retry-email", inquiryId: inquiry.id });
          }}
        >
          Retry sending request
        </Button>
      )}
      <p className="mt-4 text-[11px] text-muted-foreground">
        {inquiry.mailStatus === "queued"
          ? "Email delivery pending"
          : inquiry.mailProvider === "resend"
            ? "Sent through real email"
            : "Local practice email"}{" "}
        · No reservation yet
      </p>
    </div>
  );
}

function FollowHotel({
  state,
  act,
  pending,
}: {
  state: DemoSnapshot;
  act: Act;
  pending: string | null;
}) {
  const [consent, setConsent] = useState(false);
  if (state.subscription?.active)
    return (
      <div className="rounded-2xl border bg-card p-5">
        <p className="flex items-center gap-2 text-sm font-medium">
          <Check className="size-4" />
          I’ll keep an eye out for the right moments.
        </p>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          Culture updates from {state.tenant.name} only, at most once a month.
          You stay in control.
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="mt-3 text-muted-foreground"
          disabled={!!pending}
          onClick={() => {
            void act({ action: "unsubscribe" });
          }}
        >
          Unsubscribe
        </Button>
      </div>
    );
  return (
    <div className="rounded-2xl border bg-card p-5">
      <h2 className="text-base font-medium">
        Want me to keep in touch with this hotel?
      </h2>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">
        I can let you know when there’s local culture or a special event that
        fits your interests.
      </p>
      <label className="mt-5 flex cursor-pointer items-start gap-3 text-xs leading-6 text-muted-foreground">
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
          className="mt-1.5"
        />
        I opt into culture updates from this hotel, at most once per month for
        one year. I can unsubscribe at any time.
      </label>
      <Button
        className="mt-5"
        disabled={!consent || !!pending}
        onClick={() => {
          void act({ action: "subscribe", categories: ["culture"] });
        }}
      >
        Keep me in the loop
        <ArrowDown className="size-4" />
      </Button>
    </div>
  );
}
