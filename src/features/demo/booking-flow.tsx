"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { type OfferTerms, DEFAULT_REPLY, totalMinor } from "@/lib/contracts";
import { cn, money } from "@/lib/utils";
import type { DemoSnapshot } from "@/server/services/snapshot";
import {
  ArrowRight,
  CheckCheck,
  CheckCircle2,
  Loader2,
  Mail,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { Eyebrow } from "./components";

import type { Act } from "./types";
import { RequestComposer } from "./request-composer";
export function BookingFlow({
  state,
  actor,
  setActor,
  act,
  pending,
  onNext,
}: {
  state: DemoSnapshot;
  actor: "owner" | "traveller";
  setActor: (a: "owner" | "traveller") => void;
  act: Act;
  pending: string | null;
  onNext: () => void;
}) {
  const running = state.messages.some((m) => m.state === "running");
  const conversation = state.messages.filter((m) => m.chapter === "book");
  return (
    <>
      <Eyebrow>02 / Make the conversation count</Eyebrow>
      <h1 className="mt-3 text-[34px] leading-[1.14] font-semibold tracking-[-1.2px] md:text-[40px]">
        {actor === "owner" ? (
          <>
            Your inbox.
            <br />
            <span className="text-primary">An agent on the other side.</span>
          </>
        ) : (
          <>
            Your next stay.
            <br />
            <span className="text-primary">Let’s get the details right.</span>
          </>
        )}
      </h1>
      <p className="mt-4 text-sm leading-7 text-muted-foreground">
        {actor === "owner"
          ? "Reply by email, review the structured offer, and decide what your business can promise."
          : "Your agent checks the hotel, requests an offer and asks you before booking."}
      </p>
      {!state.version ? (
        <div className="mt-8 rounded-xl border bg-white p-6 text-sm text-muted-foreground">
          Publish the business presence first to enable the agent&apos;s
          commerce tools.
        </div>
      ) : state.reservation ? (
        <div className="mt-8 rounded-2xl border border-primary/25 bg-white p-7">
          <span className="flex size-12 items-center justify-center rounded-full bg-accent">
            <CheckCircle2 className="size-6 text-primary" />
          </span>
          <p className="mt-5 text-[10px] font-medium tracking-widest text-primary uppercase">
            Confirmed in fictional inventory
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            A real workflow. A saved reservation.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Both sides approved the same offer. The room is reserved against the
            demo&apos;s actual capacity, and the accepted terms are preserved.
          </p>
          <div className="mt-6 flex flex-wrap gap-8 border-y py-4">
            <div>
              <Eyebrow>Confirmation</Eyebrow>
              <p className="mt-2 text-lg font-semibold">
                {state.reservation.reference}
              </p>
            </div>
            <div>
              <Eyebrow>Agreed total</Eyebrow>
              <p className="mt-2 text-lg font-semibold">
                {money(state.reservation.totalMinor)}
              </p>
            </div>
          </div>
          <Button onClick={onNext} className="mt-6 h-11">
            Keep the relationship going
            <ArrowRight className="size-4" />
          </Button>
        </div>
      ) : actor === "owner" ? (
        <OwnerInbox state={state} act={act} pending={pending} />
      ) : (
        <>
          <div className="mt-7 space-y-5">
            {conversation.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "rounded-2xl p-5",
                  message.role === "user"
                    ? "ml-6 border bg-white"
                    : "bg-transparent pr-3 pl-0",
                )}
              >
                <div className="mb-3 flex items-center gap-2">
                  <span
                    className={cn(
                      "flex size-6 items-center justify-center rounded-lg",
                      message.role === "user" ? "bg-muted" : "bg-accent",
                    )}
                  >
                    {message.role === "user" ? (
                      <UserRound className="size-3" />
                    ) : (
                      <Sparkles className="size-3 text-primary" />
                    )}
                  </span>
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {message.role === "user"
                      ? "Traveller"
                      : "Your personal agent"}
                  </span>
                </div>
                <p className="text-sm leading-7 whitespace-pre-wrap">
                  {message.text}
                </p>
                {message.state === "failed" && (
                  <p className="mt-2 text-xs text-destructive">
                    The agent run needs attention. Check the activity trace.
                  </p>
                )}
              </div>
            ))}
            {running && (
              <div
                className="flex items-center gap-3 py-4 text-sm text-muted-foreground"
                aria-live="polite"
              >
                <Loader2 className="size-4 animate-spin text-primary" />
                Agent is checking the business and requesting an offer…
              </div>
            )}
          </div>
          {state.inquiry && !state.offer && (
            <div className="mt-6 rounded-xl border bg-white p-5">
              <div className="flex items-center gap-2 text-xs font-medium">
                <Mail className="size-4 text-primary" />
                {state.inquiry.mailStatus === "queued"
                  ? "Owner email is queued"
                  : state.inquiry.mailStatus === "reply_received"
                    ? "Owner reply received"
                    : "Waiting for the owner to reply"}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {state.inquiry.mailProvider === "resend"
                  ? "A real email is carrying this request to the business."
                  : "Local practice transport is active. Connect Resend for real email."}{" "}
                No reservation exists yet.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 text-xs"
                onClick={() => setActor("owner")}
              >
                View the owner&apos;s inbox
                <ArrowRight className="size-3" />
              </Button>
            </div>
          )}
          {!state.inquiry && (
            <RequestComposer
              disabled={running || !!pending}
              onSend={(prompt) => {
                void act({ action: "request", prompt });
              }}
            />
          )}
        </>
      )}
    </>
  );
}

function OwnerInbox({
  state,
  act,
  pending,
}: {
  state: DemoSnapshot;
  act: Act;
  pending: string | null;
}) {
  const [reply, setReply] = useState(DEFAULT_REPLY);
  const [sent, setSent] = useState(false);
  const inquiry = state.inquiry;
  if (!inquiry)
    return (
      <div className="mt-8 rounded-xl border bg-white p-6 text-sm text-muted-foreground">
        No requests yet. Switch to Traveller and send the agent a request.
      </div>
    );
  return (
    <div className="mt-7 space-y-5">
      <div className="overflow-hidden rounded-2xl border bg-white">
        <div className="flex items-center justify-between border-b bg-muted/50 px-5 py-3">
          <span className="flex items-center gap-2 text-xs font-medium">
            <Mail className="size-3.5 text-primary" />
            Owner mailbox
          </span>
          <Badge variant="outline" className="bg-white text-[9px]">
            {inquiry.mailProvider === "resend" ? "Real email" : "Practice mail"}
          </Badge>
        </div>
        <div className="p-5">
          <p className="text-sm font-semibold">
            New stay request · 12–13 November 2030
          </p>
          <p className="mt-2 text-[10px] text-muted-foreground">
            From: Traveller agent · To:{" "}
            {state.connections.ownerEmail ?? "local practice inbox"}
          </p>
          <p className="mt-5 border-l-2 border-primary/20 pl-4 text-sm leading-7">
            {inquiry.prompt}
          </p>
          {inquiry.messageId && (
            <p className="mt-4 break-all text-[9px] text-muted-foreground">
              {inquiry.mailProvider === "resend"
                ? "Resend message"
                : "Practice message"}
              : {inquiry.messageId}
            </p>
          )}
        </div>
      </div>
      {!inquiry.replyText ? (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (
              await act({ action: "reply", inquiryId: inquiry.id, text: reply })
            )
              setSent(true);
          }}
          className="rounded-2xl border bg-white p-5"
        >
          <label htmlFor="owner-reply" className="text-xs font-semibold">
            Reply with an offer
          </label>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
            {inquiry.mailProvider === "resend"
              ? "This composer sends actual email through your verified Resend sender to the inquiry reply address. You can also reply from the real mailbox."
              : "This is a local practice reply. No internet email will be sent."}
          </p>
          <Textarea
            id="owner-reply"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            className="mt-4 min-h-60 text-xs leading-6"
          />
          <Button
            className="mt-4 h-10 text-xs"
            disabled={
              !!pending ||
              sent ||
              inquiry.mailStatus === "queued" ||
              state.connections.testSender
            }
          >
            {sent ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Send className="size-3" />
            )}
            {sent
              ? "Waiting for inbound delivery…"
              : inquiry.mailProvider === "resend"
                ? "Send real email reply"
                : "Submit practice reply"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="mt-3 h-10 w-full text-xs"
            disabled={!!pending}
            onClick={() => {
              void act({
                action: "dashboard-reply",
                inquiryId: inquiry.id,
                text: reply,
              });
            }}
          >
            Submit through owner dashboard instead
          </Button>
          <p className="mt-2 text-[10px] text-muted-foreground">
            Dashboard replies are recorded separately from received email.
          </p>
          {inquiry.replyAddress && (
            <Button
              asChild
              variant="outline"
              className="mt-3 h-10 w-full text-xs"
            >
              <a
                href={`mailto:${inquiry.replyAddress}?subject=${encodeURIComponent("Presence demo stay offer")}&body=${encodeURIComponent(reply)}`}
              >
                Reply from my mailbox
              </a>
            </Button>
          )}
          {state.connections.testSender && (
            <p className="mt-3 text-xs leading-relaxed text-amber-800">
              Resend test sender: the inquiry goes to your account mailbox.
              Reply from that mailbox, or use the dashboard. A verified sending
              domain enables this email composer.
            </p>
          )}
          {inquiry.error && (
            <p className="mt-3 text-xs text-destructive">{inquiry.error}</p>
          )}
        </form>
      ) : (
        <div className="rounded-2xl border bg-white p-5">
          <p className="flex items-center gap-2 text-xs font-semibold text-primary">
            <CheckCheck className="size-4" />
            {inquiry.mailStatus === "dashboard_reply"
              ? "Owner dashboard reply received"
              : inquiry.mailProvider === "resend"
                ? "Real email reply received"
                : "Practice reply received"}
          </p>
          <p className="mt-3 text-xs leading-6 whitespace-pre-wrap text-muted-foreground">
            {inquiry.replyText}
          </p>
          {inquiry.replyMessageId && (
            <p className="mt-3 break-all text-[9px] text-muted-foreground">
              Received message: {inquiry.replyMessageId}
            </p>
          )}
        </div>
      )}
      {inquiry.proposedTerms && inquiry.status !== "offered" && (
        <OfferReview
          key={JSON.stringify(inquiry.proposedTerms)}
          inquiryId={inquiry.id}
          initial={inquiry.proposedTerms}
          act={act}
          pending={pending}
        />
      )}{" "}
      {inquiry.status === "offered" && (
        <div className="rounded-xl bg-accent p-5 text-xs leading-relaxed text-primary">
          <ShieldCheck className="mr-2 inline size-4" />
          Offer approved and shared. Switch to Traveller to review and accept
          the exact terms.
        </div>
      )}
    </div>
  );
}

function OfferReview({
  inquiryId,
  initial,
  act,
  pending,
}: {
  inquiryId: string;
  initial: OfferTerms;
  act: Act;
  pending: string | null;
}) {
  const [terms, setTerms] = useState(initial);
  return (
    <div className="rounded-2xl border bg-white p-5">
      <h3 className="text-sm font-semibold">Review the structured offer</h3>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        The email is a proposal. Only your approval publishes these commercial
        terms.
      </p>
      <div className="mt-5 grid grid-cols-3 gap-3">
        {(
          [
            { key: "roomMinor", label: "Room (CHF)" },
            { key: "dogMinor", label: "Dog (CHF)" },
            { key: "workspaceMinor", label: "Workspace (CHF)" },
          ] as const
        ).map(({ key, label }) => (
          <label key={key} className="text-[10px] text-muted-foreground">
            {label}
            <Input
              type="number"
              min="0"
              step="0.01"
              aria-label={label}
              value={terms[key] / 100}
              onChange={(e) =>
                setTerms({
                  ...terms,
                  [key]: Math.round(Number(e.target.value) * 100),
                })
              }
              className="mt-2"
            />
          </label>
        ))}
      </div>
      <div className="mt-5 flex items-center justify-between border-t pt-4">
        <span className="text-xs text-muted-foreground">
          Total, taxes included
        </span>
        <span className="text-xl font-semibold">
          {money(totalMinor(terms))}
        </span>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        Checkout {terms.checkOut}. Quiet workspace until {terms.workspaceUntil}.{" "}
        {terms.cancellation}
      </p>
      <Button
        onClick={() => {
          void act({ action: "approve-offer", inquiryId, terms });
        }}
        className="mt-5 h-11 w-full text-xs"
        disabled={!!pending}
      >
        <ShieldCheck className="size-3.5" />
        Approve this offer & notify the agent
      </Button>
    </div>
  );
}
