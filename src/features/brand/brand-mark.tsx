import { cn } from "@/lib/utils";

/** A meeting point: independent signals, one business presence. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
      className={cn("size-8", className)}
    >
      <path
        d="M20 3v10m0 14v10M3 20h10m14 0h10M8 8l7 7m10 10 7 7M8 32l7-7m10-10 7-7"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle cx="20" cy="20" r="4" fill="currentColor" />
    </svg>
  );
}
