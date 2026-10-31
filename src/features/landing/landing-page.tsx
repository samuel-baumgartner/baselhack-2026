"use client";

import { BrandMark } from "@/features/brand/brand-mark";
import {
  ArrowDown,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  AudioLines,
  Bell,
  Check,
  CheckCheck,
  Globe2,
  Mail,
  MapPin,
  Pause,
  Play,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import "./landing.css";

const chapters = [
  {
    label: "Be discovered.",
    short: "Publish",
    icon: Globe2,
    title: "Your business. Fluent in agent.",
    text: "Turn the website you already have into an approved presence that people and agents can understand. Real facts. Clear policies. Your say.",
    tag: "01 / An open door",
    signal: "Business facts published",
    detail: "Website → owner-approved presence",
  },
  {
    label: "Make it happen.",
    short: "Book",
    icon: Mail,
    title: "A real conversation. A real offer.",
    text: "An unusual request lands in your inbox. You shape the offer, the traveller approves the exact terms, and a reservation brings it all together.",
    tag: "02 / A better conversation",
    signal: "Owner-approved offer ready",
    detail: "Agent request → your existing inbox",
  },
  {
    label: "Stay connected.",
    short: "Reconnect",
    icon: Bell,
    title: "The stay ends. The story continues.",
    text: "A courtyard concert. A reason to return. With the traveller’s permission, relevant updates reach their agent. They choose what happens next.",
    tag: "03 / A reason to return",
    signal: "A relevant moment, delivered",
    detail: "Permission → a connection that lasts",
  },
];

const story = [
  {
    label: "The request",
    speaker: "Traveller’s agent",
    icon: Sparkles,
    quote:
      "“I arrive after midnight. With a dog. And I need a quiet place to work after checkout.”",
    text: "One very human request. A budget under CHF 220. The kind of detail a booking filter misses.",
    result: "A request worth understanding",
    chips: ["After midnight", "Dog welcome", "Quiet workspace"],
  },
  {
    label: "The reply",
    speaker: "Hotel owner",
    icon: Mail,
    quote:
      "“Late checkout won’t work. But a courtyard room and our workspace until 15:00? Absolutely.”",
    text: "The request reaches the owner’s inbox. The owner reviews and approves a tailored offer before it is shared.",
    result: "Your terms. Your approval.",
    chips: ["Room + workspace", "Clear conditions", "Owner-approved"],
  },
  {
    label: "The connection",
    speaker: "Traveller + business",
    icon: CheckCheck,
    quote:
      "“That’s exactly what I needed. Book it. And let me know when there’s live jazz.”",
    text: "The traveller approves the exact offer. A fictional reservation is recorded; future culture updates require a separate opt-in.",
    result: "A booking. And a beginning.",
    chips: ["Explicit approval", "Recorded reservation", "Optional connection"],
  },
];

export function LandingPage() {
  const [chapter, setChapter] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [storyStep, setStoryStep] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const current = chapters[chapter]!;
  const moment = story[storyStep]!;
  const MomentIcon = moment.icon;

  useEffect(() => {
    const root = pageRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-visible", "true");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    root.querySelectorAll("[data-reveal]").forEach((node) => {
      node.setAttribute("data-observed", "true");
      observer.observe(node);
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (
      !playing ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const interval = window.setInterval(() => {
      if (!document.hidden)
        setChapter((value) => (value + 1) % chapters.length);
    }, 6500);
    return () => window.clearInterval(interval);
  }, [playing]);

  function chooseChapter(index: number) {
    setChapter(index);
    setPlaying(false);
  }

  return (
    <div className="presence-site" ref={pageRef}>
      <a href="#main" className="presence-skip">
        Skip to content
      </a>
      <header className="site-header">
        <Link href="/" className="wordmark" aria-label="Presence home">
          <BrandMark />
          presence
          <span className="wordmark-dot" />
        </Link>
        <nav
          aria-label="Main navigation"
          className={menuOpen ? "site-nav is-open" : "site-nav"}
        >
          <a href="#how-it-works" onClick={() => setMenuOpen(false)}>
            The idea
          </a>
          <a href="#in-action" onClick={() => setMenuOpen(false)}>
            In action <span className="nav-dot" />
          </a>
          <a href="#our-principles" onClick={() => setMenuOpen(false)}>
            On your terms
          </a>
        </nav>
        <Link href="/demo" className="nav-cta">
          Explore demo <ArrowUpRight size={16} />
        </Link>
        <button
          className="mobile-menu"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? (
            <X />
          ) : (
            <span>
              <i />
              <i />
            </span>
          )}
        </button>
      </header>

      <main id="main">
        <section className="hero-section">
          <div className="hero-copy">
            <div className="hero-eyebrow">
              <span className="live-dot" /> INDEPENDENT BUSINESS. MEET THE NEXT
              WEB.
            </div>
            <h1>
              Your next
              <br />
              customer is
              <br />
              <span className="hero-last-line">
                an <em>agent.</em>
                <span className="headline-spark">
                  <BrandMark />
                </span>
              </span>
            </h1>
            <p className="hero-description">
              Make sure your business is part of the conversation. Turn your
              website into a presence agents can discover, understand, and do
              business with.
            </p>
            <div className="hero-actions">
              <Link href="/demo" className="site-button button-violet">
                Find your presence <ArrowUpRight size={19} />
              </Link>
              <a href="#in-action" className="text-link">
                <span className="play-disc">
                  <Play size={11} fill="currentColor" />
                </span>
                See how it feels
              </a>
            </div>
            <p className="hero-footnote">
              <ShieldCheck size={14} /> Your business. Your voice. Your rules.
            </p>
          </div>

          <div
            className="signal-scene"
            ref={sceneRef}
            onPointerMove={(event) => {
              if (
                event.pointerType !== "mouse" ||
                window.matchMedia("(prefers-reduced-motion: reduce)").matches
              )
                return;
              const rect = event.currentTarget.getBoundingClientRect();
              event.currentTarget.style.setProperty(
                "--pointer-x",
                `${((event.clientX - rect.left) / rect.width - 0.5) * 12}px`,
              );
              event.currentTarget.style.setProperty(
                "--pointer-y",
                `${((event.clientY - rect.top) / rect.height - 0.5) * 12}px`,
              );
            }}
            onPointerLeave={() => {
              sceneRef.current?.style.setProperty("--pointer-x", "0px");
              sceneRef.current?.style.setProperty("--pointer-y", "0px");
            }}
          >
            <div className="scene-topline">
              <span>
                <i /> THE CONNECTION LAYER
              </span>
              <span>HUMAN ↔ AGENT</span>
            </div>
            <div className="orbital-field" aria-hidden="true">
              <div className="orbital-grid" />
              <div className="orbital-halo" />
              <div className="orbit orbit-one">
                <span />
              </div>
              <div className="orbit orbit-two">
                <span />
              </div>
              <div className="orbit orbit-three" />
              <svg className="signal-lines" viewBox="0 0 600 540" fill="none">
                <path d="M-30 174H108Q137 174 137 203V236Q137 270 171 270H300" />
                <path d="M300 270H430Q460 270 460 300V345Q460 370 490 370H640" />
                <path d="M300 270V420Q300 445 325 445H430" />
                <path
                  className="travelling-line"
                  d="M-30 174H108Q137 174 137 203V236Q137 270 171 270H430Q460 270 460 300V345Q460 370 490 370H640"
                />
              </svg>
              <div className="presence-core">
                <div className="core-inner">
                  <BrandMark />
                </div>
                <span>presence</span>
              </div>
              <div className="floating-card business-node">
                <div className="node-icon">
                  <Globe2 size={17} />
                </div>
                <div>
                  <strong>Your business</strong>
                  <small>A voice of its own</small>
                </div>
                <span className="node-status" />
              </div>
              <div className="floating-card agent-node">
                <div className="agent-avatar">
                  <AudioLines size={19} />
                </div>
                <div>
                  <strong>Their agent</strong>
                  <small>Intent meets possibility</small>
                </div>
                <span className="agent-wave">
                  <i />
                  <i />
                  <i />
                </span>
              </div>
              <div className="signal-coordinate coordinate-one">47.5596° N</div>
              <div className="signal-coordinate coordinate-two">
                BUILT FOR WHAT’S NEXT ↗
              </div>
              <div className="signal-toast" key={chapter}>
                <span className="toast-check">
                  <Check size={13} />
                </span>
                <div>
                  <strong>{current.signal}</strong>
                  <small>{current.detail}</small>
                </div>
                <span className="toast-bars">
                  <i />
                  <i />
                  <i />
                </span>
              </div>
              <div className="orbit-spark spark-one">+</div>
              <div className="orbit-spark spark-two">+</div>
            </div>
            <div className="scene-controls">
              <div
                className="scene-tabs"
                role="group"
                aria-label="Explore the customer journey"
              >
                {chapters.map((item, index) => (
                  <button
                    key={item.short}
                    className={chapter === index ? "is-active" : ""}
                    aria-pressed={chapter === index}
                    onClick={() => chooseChapter(index)}
                  >
                    <span>0{index + 1}</span>
                    {item.short}
                  </button>
                ))}
              </div>
              <button
                className="scene-pause"
                onClick={() => setPlaying(!playing)}
                aria-label={
                  playing ? "Pause journey autoplay" : "Play journey autoplay"
                }
              >
                {playing ? <Pause size={13} /> : <Play size={13} />}
              </button>
            </div>
          </div>
        </section>

        <div className="hero-baseline">
          <a href="#how-it-works">
            <ArrowDown size={14} /> A NEW KIND OF OPEN FOR BUSINESS
          </a>
          <span>CONCEIVED IN BASEL. BUILT FOR CONNECTION.</span>
          <span className="edition-tag">BASELHACK ’26 ↗</span>
        </div>

        <section id="how-it-works" className="how-section section-shell">
          <div className="section-heading" data-reveal>
            <span className="section-kicker">01 — THE SHIFT</span>
            <h2>
              The next web is a conversation.
              <br />
              <span>Give your business a voice.</span>
            </h2>
            <p>
              You have the place, the people, the thing worth finding.
              <br />
              Presence helps you meet the customer who sends an agent.
            </p>
          </div>
          <div className="journey-grid">
            {chapters.map((item, index) => (
              <button
                className={
                  chapter === index
                    ? "journey-card is-selected"
                    : "journey-card"
                }
                key={item.short}
                onClick={() => chooseChapter(index)}
                aria-pressed={chapter === index}
                data-reveal
              >
                <div className="journey-card-top">
                  <span>0{index + 1}</span>
                  <item.icon size={22} strokeWidth={1.5} />
                </div>
                <h3>{item.label}</h3>
                <p>{item.text}</p>
                <div className="journey-card-bottom">
                  <span>{item.short.toUpperCase()}</span>
                  <ArrowUpRight size={19} />
                </div>
              </button>
            ))}
          </div>
          <div className="journey-summary" aria-live="polite">
            <span className="summary-signal" />
            <span key={chapter}>{current.title}</span>
            <span>ONE PRESENCE. A WHOLE NEW POSSIBILITY.</span>
          </div>
        </section>

        <section id="in-action" className="story-section">
          <div className="story-intro" data-reveal>
            <span className="section-kicker">
              02 — VERY HUMAN. AGENT-ASSISTED.
            </span>
            <h2>
              Not every great stay
              <br />
              starts with <em>a search.</em>
            </h2>
            <p>
              Sometimes it starts with a tricky request.
              <br />
              Meet Hotel Linden, our fictional Basel hotel.
            </p>
            <div className="story-location">
              <MapPin size={14} /> BASEL, SWITZERLAND{" "}
              <span>47°33′ N 7°35′ E</span>
            </div>
            <div className="story-art" aria-hidden="true">
              <div className="hotel-roof" />
              <div className="hotel-building">
                <span className="hotel-name">LINDEN</span>
                <div className="hotel-windows">
                  {Array.from({ length: 12 }, (_, i) => (
                    <i key={i} />
                  ))}
                </div>
                <div className="hotel-door" />
              </div>
              <div className="hotel-tree tree-left" />
              <div className="hotel-tree tree-right" />
              <span className="art-caption">
                A LITTLE PLACE. A WORLD OF POSSIBILITY.
              </span>
            </div>
          </div>
          <div className="story-conversation" data-reveal>
            <div
              className="story-tabs"
              role="group"
              aria-label="Explore the hotel scenario"
            >
              {story.map((step, index) => (
                <button
                  key={step.label}
                  onClick={() => setStoryStep(index)}
                  aria-pressed={index === storyStep}
                  className={index === storyStep ? "is-active" : ""}
                >
                  <span>0{index + 1}</span>
                  {step.label}
                </button>
              ))}
            </div>
            <div className="story-content" key={storyStep} aria-live="polite">
              <div className="story-speaker">
                <span>
                  <MomentIcon size={19} />
                </span>
                <div>
                  <strong>{moment.speaker}</strong>
                  <small>AN ILLUSTRATIVE CONVERSATION</small>
                </div>
                <span className="speaker-dot" />
              </div>
              <blockquote>{moment.quote}</blockquote>
              <div className="story-chips">
                {moment.chips.map((chip) => (
                  <span key={chip}>{chip}</span>
                ))}
              </div>
              <p>{moment.text}</p>
              <div className="story-result">
                <CheckCheck size={18} />
                {moment.result}
                <ArrowDownLeft size={20} />
              </div>
            </div>
            <Link href="/demo?chapter=book" className="story-demo-link">
              Try the working flow <ArrowUpRight size={17} />
            </Link>
            <p className="story-disclaimer">
              Fictional hotel and inventory. No real stay booked or payment
              taken.
            </p>
          </div>
        </section>

        <section
          id="our-principles"
          className="principles-section section-shell"
        >
          <div className="principles-intro" data-reveal>
            <span className="section-kicker">03 — HUMAN BY DESIGN</span>
            <h2>
              More possibility.
              <br />
              <em>Still your business.</em>
            </h2>
            <p>
              Being ready for agents should mean more control over your business
              and more choice for your customers.
            </p>
            <Link href="/demo" className="text-link">
              Take a closer look <ArrowUpRight size={17} />
            </Link>
          </div>
          <div className="principles-list" data-reveal>
            {[
              {
                number: "01",
                title: "Your facts. Not guesswork.",
                text: "Source-backed details and owner review. Missing policies stay questions until you answer them.",
                icon: Globe2,
              },
              {
                number: "02",
                title: "Your offer. Your approval.",
                text: "You approve the commercial terms. The traveller approves the exact offer. Both sides have a say.",
                icon: ShieldCheck,
              },
              {
                number: "03",
                title: "A connection. With permission.",
                text: "Customers choose the updates they want, with frequency limits, an expiry date, and the freedom to leave.",
                icon: Bell,
              },
            ].map((principle) => (
              <div key={principle.number} className="principle-row">
                <span>{principle.number}</span>
                <div>
                  <h3>{principle.title}</h3>
                  <p>{principle.text}</p>
                </div>
                <principle.icon size={21} strokeWidth={1.5} />
              </div>
            ))}
          </div>
        </section>

        <section className="closing-section" data-reveal>
          <span className="section-kicker">
            <span className="live-dot" /> THE FUTURE HAS A FRONT DOOR.
          </span>
          <h2>
            Be <em>present.</em>
          </h2>
          <p>Your next customer’s agent is looking for a place like yours.</p>
          <Link href="/demo" className="site-button button-ink">
            Let’s make the connection <ArrowUpRight size={19} />
          </Link>
          <BrandMark className="closing-mark" />
        </section>
      </main>
      <footer className="site-footer">
        <div className="footer-top">
          <Link href="/" className="wordmark">
            <BrandMark />
            presence
          </Link>
          <span>THE BUSINESS SIDE OF PERSONAL AGENTS.</span>
          <a href="#main">
            Back to the possibility <ArrowUpRight size={15} />
          </a>
        </div>
        <div className="footer-bottom">
          <span>Made for BaselHack 2026.</span>
          <span>
            An independent project for Adobe’s Post-Website Business challenge.
          </span>
          <span>Human ambition. Agent potential.</span>
        </div>
      </footer>
    </div>
  );
}
