import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
export function normalizeUrl(input: string) {
  const u = new URL(input.includes("://") ? input : `https://${input}`);
  if (u.protocol !== "https:" || u.username || u.password || u.port)
    throw Error(
      "Use a public HTTPS website without credentials or a custom port.",
    );
  u.hash = "";
  return u.toString();
}
export function publicIp(ip: string) {
  if (ip.includes(":"))
    return (
      !/^(::|fe[89ab]|f[cd])/i.test(ip) && !ip.toLowerCase().includes("ffff:")
    );
  const [a, b] = ip.split(".").map(Number);
  if (a === 0 || a === 10 || a === 127 || a === 169 || a >= 224) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && (b === 168 || b === 0)) return false;
  if (a === 198 && (b === 18 || b === 19)) return false;
  return true;
}
export async function readWebsite(input: string) {
  let url = normalizeUrl(input);
  for (let i = 0; i < 4; i++) {
    const u = new URL(url);
    if (u.hostname === "localhost" || u.hostname.endsWith(".local"))
      throw Error("Private addresses are not supported");
    const resolved = isIP(u.hostname)
      ? [{ address: u.hostname }]
      : await lookup(u.hostname, { all: true });
    if (!resolved.length || resolved.some((r) => !publicIp(r.address)))
      throw Error("Private addresses are not supported");
    const res = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(12000),
      headers: { "User-Agent": "Prism-Demo/1.0 (+website research)" },
    });
    if (res.status >= 300 && res.status < 400) {
      url = normalizeUrl(new URL(res.headers.get("location") ?? "", url).href);
      continue;
    }
    if (!res.ok) throw Error(`Website returned ${res.status}`);
    if (!res.headers.get("content-type")?.includes("text/html"))
      throw Error("This URL is not a webpage");
    const reader = res.body?.getReader();
    if (!reader) throw Error("Empty webpage");
    let html = "";
    const decoder = new TextDecoder();
    while (html.length < 300000) {
      const { value, done } = await reader.read();
      if (done) break;
      html += decoder.decode(value, { stream: true });
    }
    await reader.cancel();
    return { url, html };
  }
  throw Error("Too many redirects");
}
