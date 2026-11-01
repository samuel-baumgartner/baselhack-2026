import type { ReactNode } from "react";
import { platforms, type PlatformId } from "@/lib/platform-targets";
export { platforms, type PlatformId } from "@/lib/platform-targets";

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
  perplexity: <path d="M12 2v20M4 5l16 14M20 5 4 19M4 5h16v14H4Z" />,
  mistral: <path d="M3 19V5h4l5 7 5-7h4v14M3 9h5m8 0h5M3 14h7m4 0h7" />,
  cursor: <path d="m5 3 15 9-7 2-3 7L5 3Z" />,
  vscode: (
    <path d="m15 3 6 3v12l-6 3-9-8-3 3V8l3 3 9-8Zm0 0v18M6 11l9 7M6 13l9-7" />
  ),
  goose: (
    <path d="M8 20h9a4 4 0 0 0 4-4c0-3-3-4-6-4V6a3 3 0 0 0-6 0v8c-5 0-6 6-1 6ZM9 6H5m7-1h.01" />
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
