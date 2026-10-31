import { load } from "cheerio";
import ipaddr from "ipaddr.js";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { Agent, request } from "undici";
import { AppError } from "../auth";
import { config } from "../config";

export function isPublicAddress(address: string) {
  try {
    let parsed = ipaddr.parse(address);
    if (
      parsed.kind() === "ipv6" &&
      (parsed as ipaddr.IPv6).isIPv4MappedAddress()
    )
      parsed = (parsed as ipaddr.IPv6).toIPv4Address();
    return parsed.range() === "unicast";
  } catch {
    return false;
  }
}

export async function fetchSource(input: string) {
  let url = new URL(input);
  const fixture = new URL("/fixtures/hotel-linden", config().APP_URL);
  for (let redirect = 0; redirect < 4; redirect++) {
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password
    )
      throw new AppError(
        "UNSAFE_URL",
        "Use a public HTTP or HTTPS business website.",
      );
    const trustedFixture =
      config().DEMO_MODE === "true" && url.href === fixture.href;
    let address: { address: string; family: number };
    if (trustedFixture) address = { address: "127.0.0.1", family: 4 };
    else {
      if (url.port && !["80", "443"].includes(url.port))
        throw new AppError(
          "UNSAFE_URL",
          "Custom network ports are not supported.",
        );
      const host = url.hostname.replace(/^\[|\]$/g, "");
      const addresses = isIP(host)
        ? [{ address: host, family: isIP(host) }]
        : await lookup(host, { all: true });
      if (
        !addresses.length ||
        addresses.some((a) => !isPublicAddress(a.address))
      )
        throw new AppError(
          "UNSAFE_URL",
          "Private or reserved network addresses are not allowed.",
        );
      address = addresses[0]!;
    }
    // Pin the vetted address; do not resolve the hostname again during connection.
    const agent = new Agent({
      connect: {
        lookup: (_hostname, options, callback) => {
          if (options.all) callback(null, [address]);
          else callback(null, address.address, address.family);
        },
      },
    });
    try {
      const response = await request(url, {
        dispatcher: agent,
        signal: AbortSignal.timeout(15000),
        headers: {
          "user-agent": "PresenceDemo/0.1 (business presence extraction)",
          accept: "text/html",
        },
      });
      if (response.statusCode >= 300 && response.statusCode < 400) {
        await response.body.dump();
        const location = response.headers.location;
        if (typeof location !== "string")
          throw new AppError(
            "FETCH_FAILED",
            "The website returned an invalid redirect.",
          );
        url = new URL(location, url);
        continue;
      }
      if (response.statusCode !== 200)
        throw new AppError(
          "FETCH_FAILED",
          `The website returned HTTP ${response.statusCode}. Try its main homepage.`,
        );
      if (!String(response.headers["content-type"]).includes("text/html"))
        throw new AppError(
          "UNSUPPORTED_SOURCE",
          "Use the business's HTML website.",
        );
      let html = "";
      let bytes = 0;
      for await (const chunk of response.body) {
        bytes += chunk.length;
        if (bytes > 1_000_000)
          throw new AppError(
            "SOURCE_TOO_LARGE",
            "The page is too large. Try a simpler business page.",
          );
        html += chunk.toString();
      }
      const $ = load(html);
      $("script,style,noscript,svg,nav").remove();
      const text = $("body").text().replace(/\s+/g, " ").trim().slice(0, 18000);
      if (text.length < 40)
        throw new AppError(
          "EMPTY_SOURCE",
          "This page did not contain enough readable business information.",
        );
      return { url: url.href, text, trustedFixture };
    } finally {
      await agent.close();
    }
  }
  throw new AppError(
    "TOO_MANY_REDIRECTS",
    "The website redirects too many times.",
  );
}
