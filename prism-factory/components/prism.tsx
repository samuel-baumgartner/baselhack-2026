"use client";
import { useId } from "react";

/* Spectrum order matters: red deviates least, so it leaves on top. */
const spectrum = ["#ec6158", "#f29b5f", "#efd582", "#9bccac", "#6ba7d9", "#a18ad9"];
/* Light enters the left face, bends inside the glass and disperses where it
   leaves the right face. Points sit on the actual triangle edges. */
const ENTRY = { x: 373, y: 213 },
  EXIT = { x: 517, y: 205 };

export function Prism({
  compact = false,
  active = false,
}: {
  compact?: boolean;
  active?: boolean;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const id = (name: string) => `${name}-${uid}`;
  return (
    <div
      className="prism-art"
      data-compact={compact || undefined}
      data-active={active || undefined}
      aria-hidden="true"
    >
      <svg viewBox="0 0 900 400" fill="none">
        <defs>
          <linearGradient
            id={id("glass")}
            x1="370"
            y1="90"
            x2="540"
            y2="310"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#c8d5d5" stopOpacity=".3" />
            <stop offset=".5" stopColor="#f3f6f5" stopOpacity=".4" />
            <stop offset="1" stopColor="#9bafaf" stopOpacity=".25" />
          </linearGradient>
          <linearGradient
            id={id("edge")}
            gradientUnits="userSpaceOnUse"
            x1="370"
            y1="100"
            x2="535"
            y2="310"
          >
            <stop stopColor="#536464" stopOpacity=".8" />
            <stop offset=".5" stopColor="#96a8a8" stopOpacity=".5" />
            <stop offset="1" stopColor="#607575" stopOpacity=".65" />
          </linearGradient>
          <linearGradient
            id={id("beam")}
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="0"
            x2={ENTRY.x}
            y2="0"
          >
            <stop stopColor="#667575" stopOpacity="0" />
            <stop offset="1" stopColor="#667575" stopOpacity=".95" />
          </linearGradient>
          <filter id={id("glow")}>
            <feGaussianBlur stdDeviation="5" />
          </filter>
          <radialGradient id={id("floor")}>
            <stop stopColor="#aaa2d6" stopOpacity=".16" />
            <stop offset="1" stopColor="#aaa2d6" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="455" cy="333" rx="190" ry="34" fill={`url(#${id("floor")})`} />
        <path
          d={`M 0 246 L ${ENTRY.x} ${ENTRY.y}`}
          stroke={`url(#${id("beam")})`}
          strokeWidth="8"
          opacity=".12"
          filter={`url(#${id("glow")})`}
        />
        <path
          d={`M 0 246 L ${ENTRY.x} ${ENTRY.y}`}
          stroke={`url(#${id("beam")})`}
          strokeWidth="1.3"
        />
        <path
          d="M 450 77 L 562 291 L 329 291 Z"
          fill={`url(#${id("glass")})`}
          stroke={`url(#${id("edge")})`}
          strokeWidth="1.2"
        />
        <path
          d="M 450 77 L 476 112 L 581 304 L 562 291 M 329 291 L 348 305 L 581 304 M 476 112 L 348 305"
          stroke="#7e9494"
          strokeOpacity=".22"
        />
        <path
          d="M 450 77 L 329 291"
          stroke="#667575"
          strokeOpacity=".32"
          strokeWidth="3"
          filter={`url(#${id("glow")})`}
        />
      </svg>
      {/* Light sits on its own layer so its pulse stays on the compositor. */}
      <svg className="prism-light" viewBox="0 0 900 400" fill="none">
        <path
          d={`M ${ENTRY.x} ${ENTRY.y} L ${EXIT.x} ${EXIT.y}`}
          stroke="#667575"
          strokeOpacity=".45"
        />
        {spectrum.map((c, i) => {
          const d = `M ${EXIT.x} ${EXIT.y} L 900 ${194 + i * 21}`;
          return (
            <g key={c}>
              <path
                d={d}
                stroke={c}
                strokeWidth="7"
                opacity=".16"
                filter={`url(#${id("glow")})`}
              />
              <path d={d} stroke={c} strokeWidth="1" opacity=".85" />
            </g>
          );
        })}
        <circle cx={EXIT.x} cy={EXIT.y} r="2" fill="#667575" opacity=".8" />
      </svg>
    </div>
  );
}
