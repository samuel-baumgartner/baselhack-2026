import { useSyncExternalStore } from "react";

/**
 * Storage can throw: Safari private windows, disabled cookies, sandboxed
 * iframes and full quotas. Persistence is a convenience here, never a
 * requirement, so every access fails quietly.
 */
type Area = "local" | "session";

function area(kind: Area): Storage | null {
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export function readStored(key: string, kind: Area = "local") {
  try {
    return area(kind)?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function writeStored(key: string, value: string, kind: Area = "local") {
  try {
    area(kind)?.setItem(key, value);
  } catch {
    // Ignore quota and privacy-mode failures.
  }
}

export function removeStored(key: string, kind: Area = "local") {
  try {
    area(kind)?.removeItem(key);
  } catch {
    // Ignore.
  }
}

const subscribe = (notify: () => void) => {
  window.addEventListener("storage", notify);
  return () => window.removeEventListener("storage", notify);
};

/** Hydration-safe read: `null` on the server and during the first render. */
export function useStored(key: string) {
  return useSyncExternalStore(
    subscribe,
    () => readStored(key),
    () => null,
  );
}
