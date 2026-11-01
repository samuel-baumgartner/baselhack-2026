import { neon } from "@neondatabase/serverless";
import { newState, execute, snapshot, DomainError, type State, type Command } from "./hotel/stay";
const database = () => {
  if (!process.env.DATABASE_URL) throw Error("Hotel session database is not configured.");
  return neon(process.env.DATABASE_URL);
};
export async function openSession() {
  const state = newState();
  await database()`INSERT INTO prism_krafft_sessions(id,state,revision) VALUES(${state.id},${JSON.stringify(state)}::jsonb,0)`;
  return snapshot(state);
}
export async function runCommand(id: string, command: Command) {
  if (!/^[a-f0-9]{64}$/.test(id)) throw new DomainError("SESSION_NOT_FOUND", "Start a new stay session.");
  for (let attempt = 0; attempt < 4; attempt++) {
    const [row] = await database()`SELECT state,revision FROM prism_krafft_sessions WHERE id=${id}`;
    if (!row) throw new DomainError("SESSION_NOT_FOUND", "Start a new stay session.");
    const result = execute(row.state as State, command);
    if (result.changed) {
      const updated = await database()`UPDATE prism_krafft_sessions SET state=${JSON.stringify(result.state)}::jsonb,revision=${result.state.revision} WHERE id=${id} AND revision=${row.revision} RETURNING id`;
      if (!updated.length) continue;
    }
    return snapshot(result.state, result.view, result.reservation);
  }
  throw new DomainError("CONCURRENT_UPDATE", "Another change completed first. Reload your stay before trying again.");
}
