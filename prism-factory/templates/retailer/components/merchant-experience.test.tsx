import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import MerchantExperience from "./merchant-experience";
import { newState, snapshot } from "../lib/retail/shopping";
import { config } from "../lib/config";
test("the actual generated component renders one usable shopping view", () => {
  const state = snapshot(newState());
  const html = renderToStaticMarkup(createElement(MerchantExperience, { state, enabled: config.flows, onAction: async () => undefined }));
  assert.equal((html.match(/class="retail"/g) ?? []).length, 1, "Generated source must render exactly one real shopping view");
  assert.ok(html.includes("Ear (a)"));
  assert.ok(html.includes("Galaxy Buds3 FE"));
  assert.ok(html.includes("<img"));
  assert.ok(html.includes("Maximum budget"));
});
