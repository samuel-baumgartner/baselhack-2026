import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { treeHash } from "../worker/source-build";
import { smokeGeneratedApp } from "../worker/source-smoke";
import type { Job } from "../lib/contracts";
const exec = promisify(execFile);
const origin = "http://127.0.0.1:3040";
const checks: string[] = [];
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const pass = (label: string) => { checks.push(label); console.log("PASS", label); };
async function create() {
  const response = await fetch(`${origin}/api/jobs`, { method: "POST", headers: { "Content-Type": "application/json", Origin: origin }, body: JSON.stringify({ url: "https://www.galaxus.ch" }) });
  const job = await response.json() as Job;
  assert.equal(response.status, 200, JSON.stringify(job));
  const cookie = response.headers.get("set-cookie")!.split(";")[0];
  const post = async (path: string, body: unknown) => {
    const res = await fetch(`${origin}/api/jobs/${job.id}/${path}`, { method: "POST", headers: { "Content-Type": "application/json", Origin: origin, Cookie: cookie }, body: JSON.stringify(body) });
    const data = await res.json();
    assert.equal(res.status, 200, JSON.stringify(data));
    return data as Job;
  };
  return { job, post };
}
async function wait(id: string, expected: string[], limit = 600000) {
  const start = Date.now(); let previous = "";
  while (Date.now() - start < limit) {
    const job = await (await fetch(`${origin}/api/jobs/${id}`)).json() as Job;
    if (job.stage !== previous) { console.log(id.slice(0, 6), job.stage); previous = job.stage; }
    if (job.stage === "failed") throw Error(job.error);
    if (expected.includes(job.stage)) return job;
    await sleep(350);
  }
  throw Error("Build did not finish within the test deadline.");
}
const first = await create();
let job = await wait(first.job.id, ["selection"]);
assert.ok(job.profile?.recommendedFlows.length);
pass("URL investigated and real agent recommendations persisted");
await first.post("selection", { selected: ["discover", "purchase", "updates"] });
job = await wait(job.id, ["ready"]);
assert.ok(job.threadId && job.reviewThreadId && job.threadId !== job.reviewThreadId);
assert.ok(job.generatedApp);
assert.ok(job.checks?.every(c => c.passed));
pass("Planner, independent review and generated source produced a ready app");
const app = job.generatedApp!;
assert.equal(await treeHash(app.directory), app.sourceHash);
const view = await readFile(`${app.directory}/components/merchant-experience.tsx`, "utf8");
assert.ok(view.includes("merchant-generated"));
assert.ok((await readFile(`${app.directory}/components/runtime.tsx`, "utf8")).includes("let revision"));
pass("Recorded source hash matches built files; latest template and generated TSX are present");
const inspected = JSON.parse((await exec("docker", ["inspect", app.container])).stdout)[0];
assert.deepEqual(inspected.Mounts.map((m: { Destination: string }) => m.Destination).sort(), ["/workspace", "/workspace/node_modules"]);
assert.ok(!inspected.Config.Env.some((e: string) => /^(?:OPENAI_API_KEY|ANTHROPIC_API_KEY|AI_GATEWAY_API_KEY|DATABASE_URL|VERCEL_OIDC_TOKEN)=/.test(e)));
assert.equal(inspected.HostConfig.Privileged, false);
pass("Output container has only source/dependency mounts and no model/database/deployment credentials");
const state = await smokeGeneratedApp(`http://127.0.0.1:${app.port}`, job.selected);
pass("Generated MCP supports selected tools, student filters, images, order idempotency/latest receipt, follows and isolation");
await exec("docker", ["restart", app.container]);
await sleep(2000);
const client = new Client({ name: "prism-restart-check", version: "1.0" });
await client.connect(new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${app.port}/mcp`)));
const restored = await client.callTool({ name: "get_shopping_session", arguments: { sessionId: state.sessionId } });
const data = restored.structuredContent as { ok: boolean; state: { latestOrder: { id: string }; preferences: { audio: boolean } } };
assert.equal(data.ok, true); assert.equal(data.state.latestOrder.id, state.latestOrderId); assert.equal(data.state.preferences.audio, true);
await client.close();
pass("Receipt and audio preference survive a real output container restart");
const second = await create();
await wait(second.job.id, ["selection"]);
await second.post("selection", { selected: ["discover"] });
const expectedContainer = `prism-output-${second.job.id}`;
const deadline = Date.now() + 600000;
let cancelled = false;
while (Date.now() < deadline) {
  const candidate = await (await fetch(`${origin}/api/jobs/${second.job.id}`)).json() as Job;
  if (candidate.stage === "failed") throw Error(candidate.error);
  const found = (await exec("docker", ["ps", "-a", "--filter", `name=^${expectedContainer}$`, "--format", "{{.Names}}"]) ).stdout.trim();
  if (found === expectedContainer) { await second.post("action", { action: "cancel" }); cancelled = true; break; }
  if (candidate.stage === "ready") throw Error("Cancellation test missed its startup window.");
  await sleep(100);
}
assert.equal(cancelled, true);
await wait(second.job.id, ["cancelled"]);
for (let i = 0; i < 100; i++) {
  const found = (await exec("docker", ["ps", "-a", "--filter", `name=^${expectedContainer}$`, "--format", "{{.Names}}"]) ).stdout.trim();
  if (!found) break;
  await sleep(150);
}
assert.equal((await exec("docker", ["ps", "-a", "--filter", `name=^${expectedContainer}$`, "--format", "{{.Names}}"]) ).stdout.trim(), "");
pass("Cancelling after output startup keeps the job cancelled and removes the output container");
await mkdir("docs/verification", { recursive: true });
await writeFile("docs/verification/source-factory.json", JSON.stringify({ jobId: job.id, cancelledJobId: second.job.id, checks, generatedApp: app, authenticatedChatGPTVerified: false }, null, 2));
console.log("COMPLETE", app.previewUrl);
