// Restricted operator control: requires local DATABASE_URL, never exposed as a public tool.
import { loadEnvConfig } from "@next/env";
import { runCommand } from "../lib/db";
loadEnvConfig(process.cwd());
async function main() {
  const id = process.argv[2];
  if (!id)
    throw new Error(
      "Usage: pnpm exec tsx scripts/publish-demo-update.ts <session-capability>",
    );
  const current = await runCommand(id, { name: "get_updates" });
  const next = await runCommand(id, {
    name: "publish_demo_update",
    expectedRevision: current.revision,
  });
  console.log(
    `Published synthetic edition ${next.edition}; pull refresh required. No host wakeup sent.`,
  );
}
void main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
