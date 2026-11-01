import { createHash } from "node:crypto";
import { cp, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { createServer } from "node:net";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import ts from "typescript";
import { z } from "zod";
import type { Job, OutputConfig } from "../lib/contracts";
import { turn } from "./agent";
const exec = promisify(execFile);
const project = process.cwd();
const image = process.env.PRISM_BUILD_IMAGE ?? "node:24-bookworm";
const sourceSchema = z.object({
  summary: z.string().max(1000),
  files: z.array(z.object({ path: z.enum(["components/merchant-experience.tsx", "app/merchant.css", "README.md"]), content: z.string().min(1).max(40000) })).length(3),
});
type SourceFiles = z.infer<typeof sourceSchema>["files"];
export function validateGeneratedFiles(files: SourceFiles) {
  if (new Set(files.map(f => f.path)).size !== 3) throw Error("The generated source must contain each allowed file exactly once.");
  const component = files.find(f => f.path === "components/merchant-experience.tsx")!.content;
  const ast = ts.createSourceFile("merchant-experience.tsx", component, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let retail = false;
  function visit(node: ts.Node) {
    if (ts.isImportDeclaration(node)) {
      const name = ts.isStringLiteral(node.moduleSpecifier) ? node.moduleSpecifier.text : "";
      if (!["react", "./retail", "./experience-types"].includes(name)) throw Error(`Generated view imports an unsupported module: ${name}`);
    }
    if (ts.isIdentifier(node) && ["process", "globalThis", "window", "document", "fetch", "require", "eval", "Function"].includes(node.text)) throw Error(`Generated view may not access ${node.text}. Use onAction instead.`);
    if (node.kind === ts.SyntaxKind.ImportKeyword) throw Error("Dynamic imports are not allowed in the merchant view.");
    if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && node.tagName.getText(ast) === "RetailView") retail = true;
    ts.forEachChild(node, visit);
  }
  visit(ast);
  if (!retail || !component.includes("export default") || !/^[\s]*["']use client["']/.test(component)) throw Error("Generated view must export a client component containing RetailView.");
  return files;
}
async function treeHash(directory: string): Promise<string> {
  const hash = createHash("sha256");
  async function walk(base: string, prefix = "") {
    const entries = await readdir(base, { withFileTypes: true });
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      if (["node_modules", ".next", ".data", "next-env.d.ts", "tsconfig.tsbuildinfo"].includes(entry.name)) continue;
      const path = join(prefix, entry.name);
      if (entry.isDirectory()) await walk(join(base, entry.name), path);
      else if (entry.isFile()) hash.update(path).update(await readFile(join(base, entry.name)));
      else throw Error("Source artifacts may not contain symlinks.");
    }
  }
  await walk(directory);
  return hash.digest("hex");
}
async function availablePort() {
  const containers = await exec("docker", ["ps", "-a", "--filter", "name=prism-output-", "--format", "{{.Ports}}"]);
  for (let port = 3200; port < 3300; port++) {
    if (containers.stdout.includes(`:${port}->`)) continue;
    const free = await new Promise<boolean>(resolve => {
      const server = createServer();
      server.once("error", () => resolve(false));
      server.listen(port, "0.0.0.0", () => server.close(() => resolve(true)));
    });
    if (free) return port;
  }
  throw Error("No local preview ports are available between 3200 and 3299.");
}
export async function prepareSource(job: Job, config: OutputConfig, plannerId: string, onProgress: (message: string) => Promise<unknown>, signal?: AbortSignal, repairFeedback = "") {
  if (!/^[a-f0-9]{40}$/.test(job.id)) throw Error("Invalid build ID");
  const directory = resolve(project, ".runs", job.id, "source");
  const template = resolve(project, "templates/retailer");
  const templateHash = await treeHash(template);
  await mkdir(directory, { recursive: true });
  await cp(template, directory, { recursive: true });
  await writeFile(join(directory, "app-config.json"), JSON.stringify({ ...config, appId: job.id }, null, 2));
  const input = {
    company: config.company, flows: config.flows, headline: config.headline,
    plan: job.plan,
    interface: await readFile(join(template, "components/experience-types.ts"), "utf8"),
    retailInterface: (await readFile(join(template, "components/retail.tsx"), "utf8")).slice(0, 1800),
    starter: await readFile(join(template, "components/merchant-experience.tsx"), "utf8"),
  };
  let feedback = repairFeedback;
  for (let attempt = 0; attempt < 3; attempt++) {
    signal?.throwIfAborted();
    await onProgress(attempt ? "Repairing the generated source after validation feedback" : "Generating the merchant’s React view and stylesheet");
    const result = await turn(`Implement the revised plan as real source files for a standalone Next.js MCP Apps project. Return exactly three files: components/merchant-experience.tsx, app/merchant.css and README.md. The TSX must begin with 'use client', import { RetailView } from './retail' and import type { ExperienceProps } from './experience-types', and export default a component taking ExperienceProps. Keep <RetailView {...props} /> to preserve the implemented shopping functionality. Build a concise useful merchant-specific introduction or quick-action area above it, using props.onAction to call update_filters with patch (maxPriceMinor in CHF cents), or get_updates if selected. At most two quick actions. Respect props.busy on buttons. Use semantic markup, accessible buttons, mobile-friendly CSS and reduced-motion support; keep Galaxus' white/charcoal branding and avoid yellow purchase buttons. For other companies use their name/accent but explicitly retain the prepared demonstration product catalogue. Do not fabricate products, discounts, live stock or native host verification. Imports are restricted to react, ./retail and ./experience-types; no network, browser globals, process, dynamic imports or require. CSS selectors must be scoped with merchant-generated; don't override .retail or base html/body. Do not modify the protocol, domain or session runtime. README must explain how to run, the selected flows and the local synthetic data limits. No tool calls or file access: return the actual source code in the requested schema. Context: ${JSON.stringify(input)}\n${feedback}`, sourceSchema, plannerId, signal);
    try {
    const files = validateGeneratedFiles(result.output.files);
    for (const file of files) await writeFile(join(directory, file.path), file.content);
    await writeFile(resolve(project, ".runs", job.id, "source-generation.json"), JSON.stringify({ summary: result.output.summary, files: files.map(f => f.path), plannerId, templateHash }, null, 2));
      return { directory, templateHash, sourceHash: await treeHash(directory), summary: result.output.summary };
    } catch (error) {
      feedback = `Source validation failed: ${error instanceof Error ? error.message : String(error)}`;
      if (attempt === 2) throw error;
    }
  }
  throw Error("Source generation did not complete");
}
export async function compileAndStart(job: Job, source: { directory: string; templateHash: string; sourceHash: string }, onProgress: (message: string) => Promise<unknown>, signal?: AbortSignal) {
  signal?.throwIfAborted();
  const port = await availablePort();
  const host = process.env.PRISM_PREVIEW_HOST ?? "127.0.0.1";
  if (!/^[a-zA-Z0-9.:-]+$/.test(host)) throw Error("Invalid preview hostname");
  const previewUrl = `http://${host}:${port}`;
  const common = ["--user", `${process.getuid?.() ?? 1000}:${process.getgid?.() ?? 1000}`, "--workdir", "/workspace", "--mount", `type=bind,src=${source.directory},dst=/workspace`, "--mount", `type=bind,src=${resolve(project, "node_modules")},dst=/workspace/node_modules,readonly`, "--env", "NEXT_TELEMETRY_DISABLED=1", "--env", `NEXT_PUBLIC_APP_ORIGIN=${previewUrl}`];
  const buildName = `prism-build-${job.id}`;
  await onProgress("Compiling TypeScript, exercising the domain and building Next.js in Docker");
  const logPath = resolve(project, ".runs", job.id, "build.log");
  let buildLog = "";
  try {
    const result = await exec("docker", ["run", "--rm", "--name", buildName, "--network", "none", "--cpus", "2", "--memory", "3g", "--pids-limit", "256", ...common, image, "sh", "-c", "node scripts/widget.mjs && node node_modules/typescript/bin/tsc --noEmit && node --import tsx --test lib/*.test.ts lib/retail/*.test.ts && node node_modules/next/dist/bin/next build"], { timeout: 240000, maxBuffer: 6 * 1024 * 1024, signal });
    buildLog = result.stdout + result.stderr;
  } catch (error) {
    const failure = error as Error & { stdout?: string; stderr?: string };
    buildLog = (failure.stdout ?? "") + (failure.stderr ?? "");
    await writeFile(logPath, buildLog);
    throw Error(`Generated app did not build. ${buildLog.slice(-6000) || failure.message}`);
  } finally {
    await exec("docker", ["rm", "-f", buildName]).catch(() => undefined);
  }
  await writeFile(logPath, buildLog);
  signal?.throwIfAborted();
  await onProgress("Starting the independently built local application");
  const container = `prism-output-${job.id}`;
  await exec("docker", ["rm", "-f", container]).catch(() => undefined);
  await exec("docker", ["run", "--detach", "--name", container, "--restart", "unless-stopped", "--cpus", "2", "--memory", "2g", "--pids-limit", "256", "--publish", `${port}:3000`, ...common, image, "node", "node_modules/next/dist/bin/next", "start", "--hostname", "0.0.0.0", "--port", "3000"], { signal });
  try {
    let ready = false;
    for (let attempt = 0; attempt < 60; attempt++) {
      signal?.throwIfAborted();
      try { const response = await fetch(`http://127.0.0.1:${port}/widget`, { signal: AbortSignal.timeout(1000) }); if (response.ok) { ready = true; break; } } catch {}
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    if (!ready) throw Error("The generated application did not start.");
    return { ...source, port, previewUrl, mcpUrl: `${previewUrl}/mcp`, container, builtAt: new Date().toISOString() };
  } catch (error) { await exec("docker", ["rm", "-f", container]); throw error; }
}
