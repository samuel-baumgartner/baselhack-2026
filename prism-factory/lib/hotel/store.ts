import { neon } from "@neondatabase/serverless";
import { getJob } from "../db";
import { toolsFor } from "../contracts";
import { newState, execute, snapshot, DomainError, type State, type Command } from "./stay";
const database = () => neon(process.env.DATABASE_URL!);
export async function stay(jobId: string, command: Command & { sessionId?: string }) {
  const job = await getJob(jobId);
  if (!job?.config || job.stage !== "ready" || job.profile?.industry !== "hotel") throw new DomainError("NOT_READY", "This hotel app is not ready.");
  if (!toolsFor(job.selected, "hotel").includes(command.name)) throw new DomainError("FLOW_DISABLED", "This hotel experience was not enabled.");
  const decorate = (state: ReturnType<typeof snapshot>) => ({ ...state, hotel: { ...state.hotel, id: jobId, name: job.config!.company.name } });
  if (!command.sessionId) {
    if (command.name !== "search_rooms") throw new DomainError("SESSION_REQUIRED", "Start a stay session first.");
    const state = newState();
    await database()`INSERT INTO prism_factory_sessions(id,job_id,state,revision) VALUES(${state.id},${jobId},${JSON.stringify(state)}::jsonb,0)`;
    return decorate(snapshot(state));
  }
  for (let attempt = 0; attempt < 4; attempt++) {
    const [row] = await database()`SELECT state,revision FROM prism_factory_sessions WHERE id=${command.sessionId} AND job_id=${jobId}`;
    if (!row) throw new DomainError("SESSION_NOT_FOUND", "Start a new stay session.");
    const result = execute(row.state as State, command);
    if (result.changed) {
      const updated = await database()`UPDATE prism_factory_sessions SET state=${JSON.stringify(result.state)}::jsonb,revision=${result.state.revision} WHERE id=${command.sessionId} AND job_id=${jobId} AND revision=${row.revision} RETURNING id`;
      if (!updated.length) continue;
    }
    return decorate(snapshot(result.state, result.view, result.reservation));
  }
  throw new DomainError("CONCURRENT_UPDATE", "Another change completed first. Reload your stay before trying again.");
}
