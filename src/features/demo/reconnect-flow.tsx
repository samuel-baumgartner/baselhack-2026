"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { DemoSnapshot } from "@/server/services/snapshot";
import {
  ArrowRight,
  Bell,
  Check,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { Eyebrow } from "./components";

import type { Act } from "./types";
export function ReconnectFlow({
  state,
  actor,
  setActor,
  act,
  pending,
}: {
  state: DemoSnapshot;
  actor: "owner" | "traveller";
  setActor: (a: "owner" | "traveller") => void;
  act: Act;
  pending: string | null;
}) {
  const [consent, setConsent] = useState(false);
  const [title, setTitle] = useState("A little jazz. A familiar place.");
  const [description, setDescription] = useState(
    "Join our fictional courtyard jazz evening in Basel on 12 December 2030. Live local music, a quiet courtyard room and workspace the next morning. Contact us for a tailored return-stay offer.",
  );
  const suggestions = state.messages.filter((m) => m.chapter === "reconnect");
  return (
    <>
      <Eyebrow>03 / Keep the relationship</Eyebrow>
      <h1 className="mt-3 text-[34px] leading-[1.14] font-semibold tracking-[-1.2px] md:text-[40px]">
        {actor === "traveller" ? "Good places." : "A good stay ends."}
        <br />
        <span className="text-primary">
          {actor === "traveller"
            ? "Worth coming back to."
            : "The connection doesn’t have to."}
        </span>
      </h1>
      <p className="mt-4 max-w-lg text-sm leading-7 text-muted-foreground">
        {actor === "traveller"
          ? "Choose which hotels your agent can hear from. It only shares updates that match your interests."
          : "With permission, your business can reach the customer’s agent again. Relevant moments, not another unread newsletter."}
      </p>
      {!state.reservation ? (
        <div className="mt-8 rounded-xl border bg-white p-6 text-sm text-muted-foreground">
          Complete a reservation first, then choose whether to stay connected.
        </div>
      ) : actor === "traveller" ? (
        <div className="mt-8 space-y-5">
          {!state.subscription?.active ? (
            <div className="rounded-2xl border bg-white p-6">
              <span className="flex size-10 items-center justify-center rounded-xl bg-accent">
                <Bell className="size-4 text-primary" />
              </span>
              <h2 className="mt-4 text-lg font-semibold">
                Let your agent keep an eye out.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Receive local culture and special-event updates from{" "}
                {state.tenant.name}. Your personal agent checks relevance before
                suggesting anything.
              </p>
              <label className="mt-5 flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 accent-[#087b6b]"
                />
                I opt into culture updates from this hotel, at most once per
                month for one year. I can unsubscribe at any time.
              </label>
              <Button
                className="mt-5 h-11 text-xs"
                disabled={!consent || !!pending}
                onClick={() => {
                  void act({ action: "subscribe", categories: ["culture"] });
                }}
              >
                Keep my agent in the loop
                <ArrowRight className="size-3.5" />
              </Button>
            </div>
          ) : (
            <div className="rounded-2xl border border-primary/20 bg-white p-6">
              <Badge variant="secondary" className="text-[10px]">
                <Check className="mr-1 size-3" />
                Subscribed, on your terms
              </Badge>
              <h2 className="mt-4 text-lg font-semibold">
                Your agent is listening for the right moments.
              </h2>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                Culture updates from this hotel only. Maximum one per month.
                Expires{" "}
                {new Date(state.subscription.expiresAt).toLocaleDateString(
                  "en-GB",
                )}
                .
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setActor("owner")}
                >
                  Publish an event as the hotel
                  <ArrowRight className="size-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground"
                  disabled={!!pending}
                  onClick={() => {
                    void act({ action: "unsubscribe" });
                  }}
                >
                  Unsubscribe
                </Button>
              </div>
            </div>
          )}
          {suggestions.map((m) => (
            <div
              key={m.id}
              className="rounded-2xl border border-primary/25 bg-accent/50 p-6"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                <Sparkles className="size-4" />A suggestion from your personal
                agent
              </div>
              <p className="mt-4 text-base leading-8">{m.text}</p>
              <p className="mt-5 border-t border-primary/10 pt-4 text-[10px] text-muted-foreground">
                Based on an actual signed merchant event and your subscription.
                Nothing has been booked.
              </p>
            </div>
          ))}
          {state.deliveries.some((d) => d.status === "suppressed") && (
            <p className="rounded-lg border p-4 text-xs text-muted-foreground">
              An event was suppressed because consent, scope or frequency did
              not permit a suggestion. See activity for the reason.
            </p>
          )}
        </div>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await act({
              action: "event",
              title,
              description,
              category: "culture",
            });
          }}
          className="mt-8 rounded-2xl border bg-white p-6"
        >
          <Badge variant="secondary" className="text-[9px]">
            Owner-created event
          </Badge>
          <h2 className="mt-4 text-lg font-semibold">
            Give guests a reason to return.
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            A structured event reaches only subscribed agents. The
            customer&apos;s agent decides whether it is relevant.
          </p>
          <label
            htmlFor="event-title"
            className="mt-5 block text-xs font-medium"
          >
            Event title
          </label>
          <Input
            id="event-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-2"
          />
          <label
            htmlFor="event-description"
            className="mt-4 block text-xs font-medium"
          >
            What makes it worth returning for?
          </label>
          <Textarea
            id="event-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-2 min-h-32 text-xs leading-6"
          />
          <p className="mt-4 flex items-center gap-2 text-[10px] text-muted-foreground">
            <ShieldCheck className="size-3" />
            {state.subscription?.active
              ? "Culture subscription active. Delivery will recheck current consent."
              : "No active subscription. The event will not be sent."}
          </p>
          <Button className="mt-5 h-11 text-xs" disabled={!!pending}>
            <Send className="size-3.5" />
            Publish event to subscribed agents
          </Button>
          {state.events.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              className="mt-3 w-full text-xs"
              onClick={() => setActor("traveller")}
            >
              See the traveller&apos;s agent
              <ArrowRight className="size-3" />
            </Button>
          )}
        </form>
      )}
    </>
  );
}
