"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

import "./persona.css";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Bell,
  Check,
  Globe,
  Leaf,
  Menu,
  MessageSquare,
  RotateCcw,
  ShieldCheck,
  X,
} from "lucide-react";
import { useState } from "react";
import {
  BusinessCard,
  Connections,
  OfferCard,
  SourceEvidence,
  TracePanel,
} from "./components";
import { useDemo } from "./use-demo";

import { BookingFlow } from "./booking-flow";
import { PublishFlow } from "./publish-flow";
import { ReconnectFlow } from "./reconnect-flow";
type Chapter = "publish" | "book" | "reconnect";

const chapters = [
  {
    id: "publish" as const,
    label: "Website",
    subtitle: "Your business, agent-ready",
    icon: Globe,
  },
  {
    id: "book" as const,
    label: "Inbox",
    subtitle: "Turn intent into a booking",
    icon: MessageSquare,
  },
  {
    id: "reconnect" as const,
    label: "Updates",
    subtitle: "A relationship that continues",
    icon: Bell,
  },
];

export function DemoWorkspace({
  initialChapter = "publish",
}: {
  initialChapter?: Chapter;
}) {
  const { state, error, connected, pending, act, clearError } = useDemo();
  const chapter = initialChapter;
  const router = useRouter();
  const [resetOpen, setResetOpen] = useState(false);
  const complete = [
    !!state?.version,
    !!state?.reservation,
    state?.deliveries.some((d) => d.status === "delivered") ?? false,
  ];
  const setActor = (next: "owner" | "traveller") => {
    if (next === "traveller") router.push("/traveller");
  };
  const navigate = (next: Chapter) => {
    router.push(`/owner?chapter=${next}`);
  };
  const ownerSidebar = (
    <>
      <Link
        href="/demo"
        className="flex items-center gap-2.5 px-6 pt-8 text-[25px] font-semibold tracking-[-1.4px] text-white"
      >
        <span className="flex size-8 items-center justify-center rounded-xl border border-[#52746b] bg-[#294c43]">
          <Leaf className="size-4 text-[#a9d6b4]" />
        </span>
        presence
        <span className="mb-3 ml-0.5 size-1.5 rounded-full bg-[#a6d6b5]" />
      </Link>
      <p className="mt-3 px-6 text-[9px] font-medium tracking-[0.17em] text-[#99b3ac] uppercase">
        The business side of agents
      </p>
      <div className="mt-16 px-6">
        <p className="text-[9px] font-medium tracking-[0.17em] text-[#829e95] uppercase">
          The next customer journey
        </p>
      </div>
      <nav className="mt-5 space-y-2 px-3">
        {chapters.map((step, i) => (
          <button
            key={step.id}
            onClick={() => navigate(step.id)}
            className={cn(
              "group flex w-full items-center gap-3 rounded-xl px-3.5 py-3.5 text-left transition-colors",
              chapter === step.id ? "bg-[#315d4d]" : "hover:bg-white/5",
            )}
          >
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-lg border text-[10px]",
                chapter === step.id
                  ? "border-[#87b89c]/40 bg-[#7bb38d]/15 text-[#c6ebcf]"
                  : "border-[#3b574d] text-[#9eb6ac]",
              )}
            >
              {complete[i] ? <Check className="size-3.5" /> : `0${i + 1}`}
            </span>
            <div>
              <p
                className={cn(
                  "text-[13px] font-medium",
                  chapter === step.id ? "text-white" : "text-[#afc4bb]",
                )}
              >
                {step.label}
              </p>
              <p className="mt-1 text-[9px] text-[#8fae9f]">{step.subtitle}</p>
            </div>
            {chapter === step.id && (
              <span className="ml-auto size-1 rounded-full bg-[#add7b3]" />
            )}
          </button>
        ))}
      </nav>
      <div className="mt-auto p-4">
        <div className="rounded-xl border border-[#3b574d] bg-[#263f35] p-3.5">
          <div className="flex items-center gap-2">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#3a5949]">
              <Leaf className="size-3.5 text-[#bad5b5]" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-medium text-[#e0eadd]">
                {state?.tenant.name ?? "Your business"}
              </p>
              <p className="mt-0.5 text-[9px] text-[#91aa9a]">
                Public website · demo workspace
              </p>
            </div>
          </div>
          <div className="mt-3 border-t border-[#3b574d] pt-2.5 text-[9px] text-[#91aa9a]">
            BaselHack 2026 <span className="float-right">Adobe challenge</span>
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between px-1">
          <span className="flex items-center gap-1.5 text-[9px] text-[#a5bbad]">
            <span
              className={cn(
                "size-1.5 rounded-full",
                connected ? "bg-[#9dcda7]" : "bg-amber-400",
              )}
            />
            {connected ? "Connected to your local app" : "Connecting…"}
          </span>
          <button
            onClick={() => setResetOpen(true)}
            aria-label="Reset demo"
            title="Reset demo"
            className="text-[#8da598] hover:text-white"
          >
            <RotateCcw className="size-3" />
          </button>
        </div>
      </div>
    </>
  );
  const sidebar = ownerSidebar;
  return (
    <div
      className="demo-workspace flex min-h-screen bg-background"
      data-persona="owner"
    >
      <aside className="sticky top-0 hidden h-screen w-[228px] shrink-0 flex-col bg-[#203b30] lg:flex">
        {sidebar}
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex min-h-[76px] flex-wrap items-center justify-between gap-x-3 gap-y-3 border-b bg-white px-5 py-3 md:h-[76px] md:flex-nowrap md:px-9 md:py-0">
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="lg:hidden"
                  aria-label="Open navigation"
                >
                  <Menu className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="flex w-[250px] flex-col border-0 bg-[#24212d] p-0"
              >
                <SheetTitle className="sr-only">Demo chapters</SheetTitle>
                {sidebar}
              </SheetContent>
            </Sheet>
            <Link
              href="/owner"
              className="text-sm font-semibold text-foreground"
            >
              Presence{" "}
              <span className="ml-2 hidden font-normal text-muted-foreground sm:inline">
                Hotel owner
              </span>
            </Link>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <span className="hidden rounded-full border bg-background px-2.5 py-1 text-[9px] font-medium tracking-wide text-muted-foreground md:block">
              BASELHACK 2026
            </span>
          </div>
        </header>
        <main className="mx-auto max-w-[1350px] px-5 pt-8 pb-12 md:px-9 xl:px-11 xl:pt-10">
          <div
            className="persona-banner mb-7 flex items-center gap-3 rounded-2xl border p-4"
            role="status"
            aria-live="polite"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Leaf className="size-5" />
            </span>
            <div>
              <p className="text-[10px] font-semibold tracking-widest text-primary uppercase">
                Hotel owner workspace
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {`You are managing ${state?.tenant.name ?? "your business"}. Publish facts and approve what the hotel offers.`}
              </p>
            </div>
          </div>
          {error && (
            <div
              role="alert"
              className="mb-6 flex items-start gap-3 rounded-xl border border-destructive/25 bg-red-50 p-4 text-sm text-destructive"
            >
              <span className="flex-1">{error}</span>
              <button onClick={clearError} aria-label="Dismiss error">
                <X className="size-4" />
              </button>
            </div>
          )}
          {!state ? (
            <div className="grid gap-8 xl:grid-cols-[1fr_300px]">
              <div className="space-y-6">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-20 w-4/5" />
                <Skeleton className="h-60 w-full" />
              </div>
              <Skeleton className="hidden h-96 xl:block" />
            </div>
          ) : (
            <>
              <div className="mb-8 flex items-center gap-2 text-[10px] text-muted-foreground">
                {chapters.map((c, i) => (
                  <span key={c.id} className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(c.id)}
                      className={cn(
                        "flex items-center gap-1.5",
                        c.id === chapter && "font-medium text-primary",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-4 items-center justify-center rounded-full border text-[8px]",
                          c.id === chapter && "border-primary/30 bg-accent",
                          complete[i] &&
                            "border-transparent bg-primary text-white",
                        )}
                      >
                        {complete[i] ? <Check className="size-2.5" /> : i + 1}
                      </span>
                      {c.label}
                    </button>
                    {i < 2 && <span className="mx-1 h-px w-5 bg-border" />}
                  </span>
                ))}
              </div>
              <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_300px] 2xl:gap-12">
                <section className="min-w-0">
                  {chapter === "publish" ? (
                    <PublishFlow state={state} act={act} pending={pending} />
                  ) : chapter === "book" ? (
                    <BookingFlow
                      state={state}
                      actor="owner"
                      setActor={setActor}
                      act={act}
                      pending={pending}
                      onNext={() => navigate("reconnect")}
                    />
                  ) : (
                    <ReconnectFlow
                      state={state}
                      actor="owner"
                      setActor={setActor}
                      act={act}
                      pending={pending}
                    />
                  )}
                  <div className="mt-8">
                    <TracePanel state={state} />
                  </div>
                </section>
                <aside className="space-y-5 xl:sticky xl:top-7">
                  {chapter === "book" && state.offer ? (
                    <OfferCard
                      key={state.offer.id}
                      state={state}
                      canAccept={false}
                      pending={pending === "accept"}
                      onAccept={() => {
                        void act({
                          action: "accept",
                          offerId: state.offer!.id,
                          idempotencyKey: crypto.randomUUID(),
                        });
                      }}
                    />
                  ) : (
                    <BusinessCard state={state} />
                  )}
                  <Connections state={state} />
                  {(state.run?.profile || state.version) && (
                    <SourceEvidence state={state} />
                  )}
                  <div className="flex items-start gap-2 px-1 text-[10px] leading-relaxed text-muted-foreground">
                    <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
                    <p>
                      One approved presence. Human control over every commercial
                      promise.
                    </p>
                  </div>
                </aside>
              </div>
            </>
          )}
        </main>
        <footer className="mx-5 flex flex-wrap items-center justify-between gap-3 border-t py-5 text-[9px] text-muted-foreground md:mx-9">
          <span>Presence · The business side of personal agents</span>
          <span>Public website facts. Demo inventory. No payment taken.</span>
        </footer>
      </div>
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start a fresh demo?</DialogTitle>
            <DialogDescription>
              This clears this workspace’s demo records and restores its seeded
              inventory. Live work must finish first.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setResetOpen(false)}>
              Keep this session
            </Button>
            <Button
              onClick={async () => {
                if (await act({ action: "reset" })) {
                  setResetOpen(false);
                  navigate("publish");
                }
              }}
              disabled={!!pending}
            >
              Reset demo workspace
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
