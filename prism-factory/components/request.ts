/**
 * JSON requests with human error copy.
 *
 * API routes answer `{ error }` on failure, but proxies, timeouts and dev
 * reloads can return HTML or nothing at all. Never surface a raw
 * `SyntaxError: Unexpected token '<'` or a serialized validation dump.
 */
const OFFLINE = "We couldn’t reach PRISM. Check your connection and try again.";

function readable(message: unknown, status: number) {
  if (typeof message === "string") {
    const text = message.trim();
    // Validation libraries serialize issues as JSON. That is not copy.
    if (text && !/^[[{]/.test(text) && text.length < 240) return text;
  }
  if (status === 429) return "Too many requests right now. Wait a moment and try again.";
  if (status === 404) return "We couldn’t find this. The link may be incomplete.";
  if (status >= 500) return "PRISM hit a temporary problem. Try again in a moment.";
  return "That didn’t work. Check the details and try again.";
}

export async function requestJson<T>(
  url: string,
  init?: Omit<RequestInit, "body"> & { body?: unknown },
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers:
        init?.body === undefined
          ? init?.headers
          : { "Content-Type": "application/json", ...init?.headers },
      body: init?.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch {
    throw Error(OFFLINE);
  }
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // Non-JSON response: fall through to status-based copy.
  }
  if (!res.ok || data === null)
    throw Error(
      readable((data as { error?: unknown } | null)?.error, res.ok ? 502 : res.status),
    );
  return data as T;
}

export const errorText = (e: unknown, fallback: string) =>
  e instanceof Error && e.message ? e.message : fallback;
