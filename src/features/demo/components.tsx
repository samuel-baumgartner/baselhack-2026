"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn, money } from "@/lib/utils";
import type { DemoSnapshot } from "@/server/services/snapshot";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  Leaf,
  MapPin,
  Radio,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
      {children}
    </p>
  );
}

export function SourceEvidence({ state }: { state: DemoSnapshot }) {
  const profile = state.version?.profile ?? state.run?.profile;
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-2 text-xs text-muted-foreground"
        >
          <ShieldCheck className="size-3.5" />
          View source evidence
          <ChevronRight className="size-3.5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Facts with a source</SheetTitle>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Web excerpts support extracted facts. Reviewed policies are recorded
            in the published version.
          </p>
        </SheetHeader>
        <div className="space-y-4 p-5">
          {profile?.claims.map((claim, i) => (
            <div key={`${claim.field}-${i}`} className="rounded-xl border p-4">
              <p className="text-xs font-medium text-primary">{claim.field}</p>
              <p className="mt-2 text-sm font-medium">{claim.value}</p>
              <blockquote className="mt-3 border-l-2 pl-3 text-xs leading-relaxed text-muted-foreground">
                “{claim.excerpt}”
              </blockquote>
              <a
                className="mt-3 block truncate text-xs text-primary underline-offset-4 hover:underline"
                href={claim.sourceUrl}
                target="_blank"
                rel="noreferrer"
              >
                {claim.sourceUrl}
              </a>
            </div>
          ))}
          {!profile?.claims.length && (
            <p className="text-sm text-muted-foreground">
              Source excerpts appear after extraction.
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function HotelArt({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-[#e9efeb]",
        compact ? "h-28" : "h-40",
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 360 180" className="h-full w-full" fill="none">
        <path
          d="M-20 125C60 78 92 152 173 117s88-96 215-57"
          stroke="#cadbd1"
          strokeWidth="29"
        />
        <path
          d="M-20 125C60 78 92 152 173 117s88-96 215-57"
          stroke="#f8fbf9"
          strokeWidth="18"
        />
        <path
          d="M32 0 122 180M179-20l-38 220M258-20l69 220M-20 38l400 115M-20 82l400-69"
          stroke="#d3dfd5"
          strokeWidth="2"
        />
        <rect
          x="174"
          y="58"
          width="60"
          height="56"
          rx="5"
          fill="#fff"
          stroke="#b9ccc0"
        />
        <path d="m171 60 33-25 33 25" fill="#829f90" />
        <rect x="197" y="89" width="12" height="25" rx="2" fill="#b9cec0" />
        {[184, 201, 218].map((x) => (
          <g key={x}>
            <rect x={x} y="66" width="7" height="9" rx="1" fill="#abc2b4" />
            <rect x={x} y="80" width="7" height="9" rx="1" fill="#abc2b4" />
          </g>
        ))}
        <circle cx="92" cy="56" r="12" fill="#b9cfc0" />
        <circle cx="284" cy="127" r="17" fill="#b5cdb9" />
        <circle cx="62" cy="151" r="21" fill="#b5cdb9" />
        <circle cx="266" cy="40" r="13" fill="#b5cdb9" />
        <path
          d="M308 65c0 12-15 26-15 26s-15-14-15-26a15 15 0 1 1 30 0Z"
          fill="#087b6b"
        />
        <circle cx="293" cy="65" r="5" fill="white" />
      </svg>
      <span className="absolute bottom-3 left-4 rounded-full border border-white/60 bg-white/90 px-2.5 py-1 text-[9px] font-medium tracking-wide text-[#4b6d5b]">
        BASEL · DEMO WORKSPACE
      </span>
    </div>
  );
}

export function BusinessCard({ state }: { state: DemoSnapshot }) {
  const p = state.version?.profile ?? state.run?.profile;
  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <HotelArt />
      <div className="p-5">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-accent">
            <Leaf className="size-4 text-primary" />
          </span>
          <div>
            <p className="text-sm font-semibold">
              {p?.name ?? "Your business, understood."}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {p
                ? "Independent hospitality. Agent-ready."
                : "Your source becomes a verified presence."}
            </p>
          </div>
        </div>
        {p && (
          <>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              {p.description}
            </p>
            <div className="mt-4 flex gap-1.5 text-[11px] text-muted-foreground">
              <MapPin className="mt-0.5 size-3 shrink-0" />
              <span>{p.address}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {p.amenities.slice(0, 4).map((a) => (
                <Badge
                  key={a}
                  variant="secondary"
                  className="text-[9px] font-normal"
                >
                  {a}
                </Badge>
              ))}
            </div>
          </>
        )}
        <div className="mt-5 flex items-center justify-between border-t pt-4">
          <span className="text-[11px] text-muted-foreground">
            Business presence
          </span>
          <Badge
            variant={state.version ? "secondary" : "outline"}
            className="text-[9px]"
          >
            {state.version ? (
              <>
                <Check className="mr-1 size-3" />
                Published
              </>
            ) : p ? (
              "Ready for review"
            ) : (
              "Not published"
            )}
          </Badge>
        </div>
        {state.version && (
          <a
            href={`/customers/${state.tenant.slug}`}
            target="_blank"
            rel="noreferrer"
            className="mt-4 flex items-center justify-between text-xs font-medium text-primary"
          >
            Open public presence
            <ArrowUpRight className="size-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}

export function OfferCard({
  state,
  onAccept,
  pending,
}: {
  state: DemoSnapshot;
  onAccept: () => void;
  pending: boolean;
}) {
  const [acknowledged, setAcknowledged] = useState(false);
  const offer = state.offer;
  if (!offer) return null;
  const terms = offer.terms;
  const booked = !!state.reservation;
  const expired =
    new Date(offer.expiresAt).getTime() < new Date(state.now).getTime();
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <Eyebrow>{booked ? "Your reservation" : "Your offer"}</Eyebrow>
        <ShieldCheck className="size-4 text-primary" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">{state.tenant.name}</h3>
      <p className="mt-1 text-[11px] text-muted-foreground">
        {state.inquiry?.requirements.arrival} –{" "}
        {state.inquiry?.requirements.departure} ·{" "}
        {state.inquiry?.requirements.guests} guest(s)
      </p>
      <div className="mt-4 rounded-lg bg-accent px-3 py-2 text-[11px] font-medium text-primary">
        <Check className="mr-1 inline size-3" />
        {booked
          ? `Confirmed · ${state.reservation!.reference}`
          : "Owner-approved. Your decision."}
      </div>
      <div className="my-5 space-y-3 border-b pb-5">
        {[
          ["Courtyard room", terms.roomMinor],
          ["Dog accommodation", terms.dogMinor],
          [
            `Workspace until ${terms.workspaceUntil ?? "—"}`,
            terms.workspaceMinor,
          ],
        ].map(([label, value]) => (
          <div
            key={String(label)}
            className="flex items-center justify-between text-xs"
          >
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium">{money(Number(value))}</span>
          </div>
        ))}
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Total, taxes included</p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Room + all extras
          </p>
        </div>
        <p className="text-3xl font-semibold tracking-tight">
          {money(offer.totalMinor)}
        </p>
      </div>
      <div className="mt-5 space-y-2 text-[10px] leading-relaxed text-muted-foreground">
        <p>
          Checkout {terms.checkOut}.{" "}
          {terms.lateArrival
            ? "After-midnight arrival included in this demo offer."
            : "Standard check-in."}
        </p>
        <p>{terms.cancellation}</p>
        <p className="flex items-center gap-1">
          <Clock3 className="size-3" />
          {booked
            ? "Accepted terms preserved."
            : expired
              ? "Offer expired — ask the owner for a new offer."
              : `Valid until ${new Date(offer.expiresAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`}
        </p>
      </div>
      {!booked && (
        <>
          <label className="mt-5 flex cursor-pointer items-start gap-2 text-[10px] leading-relaxed text-muted-foreground">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-0.5 accent-[#087b6b]"
            />
            I approve this exact price and the stated terms.
          </label>
          <Button
            className="mt-4 h-11 w-full text-xs"
            disabled={!acknowledged || pending || expired}
            onClick={onAccept}
          >
            {pending
              ? "Reserving…"
              : `Approve & reserve ${money(offer.totalMinor)}`}
          </Button>
        </>
      )}
      <p className="mt-4 text-center text-[9px] leading-relaxed text-muted-foreground">
        Fictional inventory. No real stay or payment.
      </p>
    </div>
  );
}

export function TracePanel({ state }: { state: DemoSnapshot }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border bg-card">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-4 text-xs text-muted-foreground"
      >
        <span className="flex items-center gap-2">
          <Radio className="size-3.5" />
          Live activity & evidence{" "}
          <span className="text-[10px]">({state.trace.length})</span>
        </span>
        <ChevronDown
          className={cn("size-3.5 transition-transform", open && "rotate-180")}
        />
      </button>
      {open && (
        <div className="max-h-80 space-y-4 overflow-y-auto px-4 pb-4">
          {state.trace.slice(0, 15).map((event) => (
            <div key={event.id} className="border-l-2 border-primary/20 pl-3">
              <p className="text-[10px] text-muted-foreground">
                {new Date(event.createdAt).toLocaleTimeString("en-GB")} ·{" "}
                {event.actor}
              </p>
              <p className="mt-1 text-xs font-medium">{event.title}</p>
              {event.detail && (
                <p className="mt-1 break-words text-[11px] leading-relaxed text-muted-foreground">
                  {event.detail}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Connections({ state }: { state: DemoSnapshot }) {
  return (
    <div className="space-y-3 rounded-xl border bg-card p-4">
      <Eyebrow>Connected foundation</Eyebrow>
      {[
        [
          "Durable worker",
          state.connections.worker ? "Online" : "Offline",
          state.connections.worker,
        ],
        [
          "Buyer agent",
          state.connections.ai ? state.connections.model : "Not connected",
          state.connections.ai,
        ],
        [
          "Email transport",
          state.connections.email === "resend"
            ? "Real email"
            : "Local practice",
          state.connections.email === "resend",
        ],
      ].map(([label, value, good]) => (
        <div
          key={String(label)}
          className="flex items-center justify-between text-[10px]"
        >
          <span className="text-muted-foreground">{label}</span>
          <span
            className={cn(
              "flex items-center gap-1.5",
              good ? "text-primary" : "text-amber-700",
            )}
          >
            <span
              className={cn(
                "size-1.5 rounded-full",
                good ? "bg-primary" : "bg-amber-500",
              )}
            />
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}
