import { cp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import assert from "node:assert/strict";
const exec = promisify(execFile);
const directory = resolve(".runs/render-regression/source");
await mkdir(directory, { recursive: true });
await cp("templates/retailer", directory, { recursive: true });
const config = JSON.parse(
  await readFile("templates/retailer/app-config.json", "utf8"),
);
await writeFile(
  `${directory}/app-config.json`,
  JSON.stringify({ ...config, appId: "render-regression" }),
);
const args = [
  "run",
  "--rm",
  "--network",
  "none",
  "--user",
  `${process.getuid?.()}:${process.getgid?.()}`,
  "--workdir",
  "/workspace",
  "--mount",
  `type=bind,src=${directory},dst=/workspace`,
  "--mount",
  `type=bind,src=${resolve("node_modules")},dst=/workspace/node_modules,readonly`,
  "node:24-bookworm",
  "node",
  "--import",
  "tsx",
  "--test",
  "components/merchant-experience.test.tsx",
];
await writeFile(
  `${directory}/components/merchant-experience.tsx`,
  '"use client"; import { RetailView } from "./retail"; export default function View(props: never) { const unused = <RetailView {...props} />; return null; }',
);
let failed = false;
try {
  await exec("docker", args);
} catch (error) {
  failed = true;
  await writeFile(
    ".runs/render-regression/blank-view.log",
    String((error as { stdout?: string }).stdout),
  );
}
assert.equal(
  failed,
  true,
  "The real generated-view test must reject a blank application",
);
await cp(
  "templates/retailer/components/merchant-experience.tsx",
  `${directory}/components/merchant-experience.tsx`,
);
const passing = await exec("docker", args);
await writeFile(".runs/render-regression/rendered-view.log", passing.stdout);
await rm(directory, { recursive: true });
console.log(
  "PASS blank generated view rejected; real template view renders correctly in isolated Docker",
);
