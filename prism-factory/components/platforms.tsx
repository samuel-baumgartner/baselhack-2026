import type { ReactNode } from "react";
/**
 * The four conversation hosts PRISM previews. ChatGPT is the only published
 * MCP Apps target; the others are visual previews of the same runtime.
 * Marks are drawn on one 24px grid with one stroke weight so they read as a
 * set, in the spirit of each host's identity rather than as copied logos.
 */
export const platforms = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    kind: "Published MCP app",
    line: "Find me something for studying.",
  },
  {
    id: "claude",
    name: "Claude",
    kind: "Visual preview",
    line: "Something quiet for the train?",
  },
  {
    id: "gemini",
    name: "Gemini",
    kind: "Visual preview",
    line: "Compare earbuds under CHF 100.",
  },
  {
    id: "grok",
    name: "Grok",
    kind: "Visual preview",
    line: "Cheapest noise cancelling pair.",
  },
] as const;

export type PlatformId = (typeof platforms)[number]["id"];

export const platformName = (id: string) =>
  platforms.find((p) => p.id === id)?.name ?? "ChatGPT";

const claudeRays = Array.from({ length: 12 }, (_, i) => {
  const a = (i * Math.PI) / 6 + 0.2,
    r = i % 2 ? 8 : 10;
  return `M${(12 + 2.6 * Math.cos(a)).toFixed(2)} ${(12 + 2.6 * Math.sin(a)).toFixed(2)}L${(12 + r * Math.cos(a)).toFixed(2)} ${(12 + r * Math.sin(a)).toFixed(2)}`;
}).join("");

const marks: Record<PlatformId, ReactNode> = {
  chatgpt: (
    <g>
      {[0, 60, 120, 180, 240, 300].map((r) => (
        <rect
          key={r}
          x="9.25"
          y="3"
          width="5.5"
          height="11"
          rx="2.75"
          transform={`rotate(${r} 12 12)`}
        />
      ))}
    </g>
  ),
  claude: <path d={claudeRays} strokeWidth="1.7" />,
  gemini: (
    <path
      d="M12 2.5C12.4 7.6 16.4 11.6 21.5 12 16.4 12.4 12.4 16.4 12 21.5 11.6 16.4 7.6 12.4 2.5 12 7.6 11.6 11.6 7.6 12 2.5Z"
      strokeLinejoin="round"
    />
  ),
  grok: (
    <g>
      <path d="M16.6 5.4A7.5 7.5 0 0 0 5.4 16.6" />
      <path d="M8.4 19.4A7.5 7.5 0 0 0 19.1 9.6" />
      <path d="M5 19 19.5 4.5" />
    </g>
  ),
};

export function PlatformMark({
  platform,
  size = 20,
}: {
  platform: PlatformId;
  size?: number;
}) {
  return (
    <svg
      className={`platform-mark mark-${platform}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      {marks[platform]}
    </svg>
  );
}
