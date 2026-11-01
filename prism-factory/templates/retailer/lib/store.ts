import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { newState, execute, snapshot, DomainError, type State, type Command } from "./retail/shopping";
const directory = resolve(".data/sessions");
const pending = new Map<string, Promise<unknown>>();
export async function openSession() {
  const state = newState();
  await mkdir(directory, { recursive: true });
  await writeFile(resolve(directory, `${state.id}.json`), JSON.stringify(state), { flag: "wx" });
  return snapshot(state);
}
export async function runCommand(id: string, command: Command) {
  if (!/^[a-f0-9]{64}$/.test(id)) throw new DomainError("SESSION_NOT_FOUND", "Start a new shopping session.");
  const previous = pending.get(id) ?? Promise.resolve();
  const next = previous.catch(() => undefined).then(async () => {
    let state: State;
    try { state = JSON.parse(await readFile(resolve(directory, `${id}.json`), "utf8")); }
    catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") throw new DomainError("SESSION_NOT_FOUND", "Start a new shopping session."); throw error; }
    const result = execute(state, command);
    if (result.changed) {
      const temporary = resolve(directory, `${id}-${randomUUID()}.tmp`);
      await writeFile(temporary, JSON.stringify(result.state));
      await rename(temporary, resolve(directory, `${id}.json`));
    }
    return snapshot(result.state, result.view, result.selected, result.order);
  });
  pending.set(id, next);
  try { return await next; } finally { if (pending.get(id) === next) pending.delete(id); }
}
