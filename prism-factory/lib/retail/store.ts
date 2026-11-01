import { neon } from "@neondatabase/serverless";
import {
  newState,
  execute,
  snapshot,
  DomainError,
  type State,
  type Command,
} from "./shopping";
import { getJob } from "../db";
import { toolsFor } from "../contracts";
function sql() {
  return neon(process.env.DATABASE_URL!);
}
export async function retail(
  jobId: string,
  command: Command & { sessionId?: string },
) {
  const job = await getJob(jobId);
  if (!job?.config || job.stage !== "ready")
    throw new DomainError("NOT_READY", "This experience is not published yet.");
  if (job.profile?.industry === "hotel") throw new DomainError("WRONG_TEMPLATE", "This is a hotel app. Use its room and reservation tools.");
  if (!toolsFor(job.selected).includes(command.name))
    throw new DomainError(
      "FLOW_DISABLED",
      "This experience was not selected for this app.",
    );
  if (!command.sessionId) {
    if (command.name !== "search_products")
      throw new DomainError(
        "SESSION_REQUIRED",
        "Start a shopping session first",
      );
    const state = newState();
    state.tenant = jobId;
    await sql()`INSERT INTO prism_factory_sessions(id,job_id,state,revision) VALUES(${state.id},${jobId},${JSON.stringify(state)}::jsonb,0)`;
    return {
      ...snapshot(state),
      merchant: {
        id: jobId,
        name: job.config.company.name,
        logo: "https://prism.mvps.ch/merchants/galaxus/logo.svg",
        snapshot: "2026-10-31",
      },
    };
  }
  for (let attempt = 0; attempt < 3; attempt++) {
    const [row] =
      await sql()`SELECT state,revision FROM prism_factory_sessions WHERE id=${command.sessionId} AND job_id=${jobId}`;
    if (!row)
      throw new DomainError("SESSION_NOT_FOUND", "Start a new demo session");
    const result = execute(row.state as State, command);
    if (result.changed) {
      const updated =
        await sql()`UPDATE prism_factory_sessions SET state=${JSON.stringify(result.state)}::jsonb,revision=${result.state.revision} WHERE id=${command.sessionId} AND job_id=${jobId} AND revision=${row.revision} RETURNING id`;
      if (!updated.length) continue;
    }
    return {
      ...snapshot(result.state, result.view, result.selected, result.order),
      merchant: {
        id: jobId,
        name: job.config.company.name,
        logo: "https://prism.mvps.ch/merchants/galaxus/logo.svg",
        snapshot: "2026-10-31",
      },
    };
  }
  throw new DomainError(
    "CONFLICT",
    "Your session changed. Refresh and try again.",
  );
}
