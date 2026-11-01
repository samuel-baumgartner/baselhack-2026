import { test } from "node:test";
import assert from "node:assert/strict";
import { isSameOrigin } from "./http";
test("same-origin checks accept a local Tailscale host even when Next binds localhost", () => {
  assert.equal(
    isSameOrigin(
      new Request("http://localhost:3040/api/jobs", {
        headers: {
          host: "100.98.187.105:3040",
          origin: "http://100.98.187.105:3040",
        },
      }),
    ),
    true,
  );
  assert.equal(
    isSameOrigin(
      new Request("https://prism.mvps.ch/api/jobs", {
        headers: { host: "prism.mvps.ch", origin: "https://untrusted.example" },
      }),
    ),
    false,
  );
  assert.equal(
    isSameOrigin(
      new Request("https://prism.mvps.ch/api/jobs", {
        headers: { host: "prism.mvps.ch", origin: "http://prism.mvps.ch" },
      }),
    ),
    false,
  );
});
