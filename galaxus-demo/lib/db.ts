import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { pgTable, text, integer, jsonb } from "drizzle-orm/pg-core";
import { and, eq } from "drizzle-orm";
import {
  newState,
  execute,
  snapshot,
  DomainError,
  type State,
  type Command,
} from "./shopping";
export const sessions = pgTable("prism_demo_sessions", {
  id: text("id").primaryKey(),
  tenant: text("tenant").notNull(),
  revision: integer("revision").notNull(),
  state: jsonb("state").$type<State>().notNull(),
});
function db() {
  if (!process.env.DATABASE_URL)
    throw new Error("DATABASE_URL is required. No ephemeral fallback.");
  return drizzle(neon(process.env.DATABASE_URL));
}
export async function openSession() {
  const state = newState();
  await db()
    .insert(sessions)
    .values({ id: state.id, tenant: state.tenant, revision: 0, state });
  return snapshot(state);
}
export async function runCommand(id: string, c: Command) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const [row] = await db()
      .select()
      .from(sessions)
      .where(and(eq(sessions.id, id), eq(sessions.tenant, "galaxus")));
    if (!row)
      throw new DomainError(
        "SESSION_NOT_FOUND",
        "Unknown demo session. Start a new search. Session IDs are private bearer capabilities.",
      );
    const result = execute(row.state, c);
    if (result.changed) {
      const updated = await db()
        .update(sessions)
        .set({ state: result.state, revision: result.state.revision })
        .where(
          and(
            eq(sessions.id, id),
            eq(sessions.tenant, "galaxus"),
            eq(sessions.revision, row.revision),
          ),
        )
        .returning({ id: sessions.id });
      if (!updated.length) continue;
    }
    return snapshot(result.state, result.view, result.selected, result.order);
  }
  throw new DomainError(
    "CONCURRENT_UPDATE",
    "Another write won. Reload and review.",
  );
}
